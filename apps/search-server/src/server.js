import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { searchVehicles } from "@drive-scout/search-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(serverRoot, "..", "..");
const widgetPackageRoot = resolve(workspaceRoot, "packages/search-widget");

dotenv.config({ path: resolve(workspaceRoot, ".env") });

const widgetTemplatePath = resolve(serverRoot, "public/car-widget.html");
const widgetEntryPoint = resolve(widgetPackageRoot, "src/index.jsx");
// Prebuilt assets produced by Vite during the workspace build
const widgetJsPath = resolve(widgetPackageRoot, "dist/widget.js");
const widgetCssPath = resolve(widgetPackageRoot, "dist/widget-style.css");
const publicDir = resolve(serverRoot, "public");
const WIDGET_PLACEHOLDER = "<!--APP_SCRIPT-->";
const isDevelopment = process.env.NODE_ENV !== "production";

const DEFAULT_ALLOWED_ORIGINS = ["https://chatgpt.com", "https://chat.openai.com"];
const MAX_QUERY_LENGTH = 120;
const MIN_QUERY_LENGTH = 1;
const MAX_VEHICLES_LIMIT = 12;
const MIN_VEHICLES_LIMIT = 1;
const DEFAULT_VEHICLE_LIMIT = 9;

export function resolveAllowedOrigin(requestOrigin) {
  if (isDevelopment) {
    return "*";
  }

  const configuredOrigins = (process.env.ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowList = new Set([...configuredOrigins, ...DEFAULT_ALLOWED_ORIGINS]);

  if (requestOrigin && allowList.has(requestOrigin)) {
    return requestOrigin;
  }

  return configuredOrigins[0] ?? DEFAULT_ALLOWED_ORIGINS[0];
}

export function getCorsHeaders(requestOrigin, additionalHeaders = {}) {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(requestOrigin),
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
    ...additionalHeaders,
  };
}

const FALLBACK_WIDGET_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Car search widget unavailable</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color: #0f172a;
        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        background-color: #f4f6fb;
      }

      body {
        margin: 0;
        padding: 56px 24px;
        background: #f4f6fb;
      }

      main {
        max-width: 560px;
        margin: 0 auto;
        padding: 32px;
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
      }

      h1 {
        margin-top: 0;
        font-size: 1.6rem;
      }

      p {
        color: #475569;
        font-size: 0.95rem;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Car search widget unavailable</h1>
      <p>
        The React bundle for the Fahrzeugsuche experience could not be built. Check the server logs for details and
        ensure dependencies are installed.
      </p>
    </main>
  </body>
</html>`;

let widgetHtmlCache = null;

const MIME_TYPES = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const readWidgetTemplate = () => readFileSync(widgetTemplatePath, "utf8");

/**
 * Builds the widget bundle in development mode using esbuild
 * @returns {Promise<{jsText: string | null, cssText: string | null}>}
 */
async function buildDevelopmentWidget() {
  const esbuild = await import("esbuild");
  const result = await esbuild.build({
    entryPoints: [widgetEntryPoint],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    absWorkingDir: widgetPackageRoot,
    write: false,
    minify: false,
    jsx: "automatic",
    sourcemap: true,
    outfile: "car-widget.js",
    loader: { ".css": "css" },
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
  });
  
  const jsText = (result.outputFiles ?? []).find((file) => file.path.endsWith(".js"))?.text ?? null;
  const cssText = (result.outputFiles ?? []).find((file) => file.path.endsWith(".css"))?.text ?? null;
  
  return { jsText, cssText };
}

/**
 * Reads pre-built production widget assets
 * @returns {{jsText: string | null, cssText: string | null}}
 */
function buildProductionWidget() {
  let jsText = null;
  
  try {
    jsText = readFileSync(widgetJsPath, "utf8");
  } catch (error) {
    console.error(`✗ Failed to read widget JS from ${widgetJsPath}:`, error.message);
  }
  
  return { jsText, cssText: null };
}

/**
 * Injects CSS styles into the HTML replacement string
 * @param {string | null} prebuiltCss - CSS from esbuild output
 * @returns {string} CSS style tags or empty string
 */
function injectStyles(prebuiltCss) {
  let styles = "";
  
  // Try to read the pre-built Tailwind CSS from the widget package first
  try {
    const widgetCss = readFileSync(widgetCssPath, "utf8");
    if (widgetCss) {
      styles += `<style>\n${widgetCss}\n</style>\n`;
      return styles;
    }
  } catch (error) {
    console.error(`✗ Failed to read widget CSS from ${widgetCssPath}:`, error.message);
  }
  
  // Fallback to esbuild CSS output if pre-built CSS is not available
  if (prebuiltCss) {
    styles += `<style>\n${prebuiltCss}\n</style>\n`;
    console.log(`✓ Using esbuild CSS output (${prebuiltCss.length} bytes)`);
  } else {
    console.warn("⚠ No CSS found. Widget will render without styles.");
  }
  
  return styles;
}

/**
 * Generates debug script for development mode
 * @param {number} jsSize - Size of JavaScript bundle in bytes
 * @param {boolean} hasCSS - Whether CSS was loaded
 * @returns {string} Debug script tag or empty string
 */
function generateDebugScript(jsSize, hasCSS) {
  if (!isDevelopment) {
    return "";
  }
  
  return `
    <script>
      console.log('[Car Widget] Initializing...');
      console.log('[Car Widget] NODE_ENV:', '${isDevelopment ? 'development' : 'production'}');
      console.log('[Car Widget] JS loaded:', ${jsSize}, 'bytes');
      console.log('[Car Widget] CSS loaded:', ${hasCSS});
      
      window.addEventListener('error', function(e) {
        console.error('[Car Widget] Global error:', e.error || e.message);
      });
      
      window.addEventListener('unhandledrejection', function(e) {
        console.error('[Car Widget] Unhandled promise rejection:', e.reason);
      });
    </script>
  `;
}

/**
 * Injects JavaScript into the HTML
 * @param {string} jsText - JavaScript code to inject
 * @param {boolean} hasCSS - Whether CSS was loaded
 * @returns {string} Script tags with debug and main JavaScript
 */
function injectScripts(jsText, hasCSS) {
  if (!jsText) {
    throw new Error("Widget build produced no JS output. Check that 'pnpm build' was run and dist/widget.js exists.");
  }
  
  const debugScript = generateDebugScript(jsText.length, hasCSS);
  const mainScript = `<script type="module">\n${jsText}\n</script>`;
  
  return debugScript + mainScript;
}

/**
 * Builds the complete widget HTML with bundled assets
 * @returns {Promise<string>} Complete HTML with inlined CSS and JS
 */
async function buildWidgetHtml() {
  const template = readWidgetTemplate();
  
  // Build widget based on environment
  const { jsText, cssText } = isDevelopment 
    ? await buildDevelopmentWidget() 
    : buildProductionWidget();
  
  // Inject styles and scripts
  const styles = injectStyles(cssText);
  const hasCSS = styles.includes('<style>');
  const scripts = injectScripts(jsText, hasCSS);
  const replacement = styles + scripts;
  
  // Insert into template
  if (template.includes(WIDGET_PLACEHOLDER)) {
    return template.replace(WIDGET_PLACEHOLDER, replacement);
  }
  
  return `${template}\n${replacement}`;
}

async function getWidgetHtml() {
  if (isDevelopment) {
    try {
      return await buildWidgetHtml();
    } catch (error) {
      console.error("Failed to rebuild widget in development mode", error);
      return FALLBACK_WIDGET_HTML;
    }
  }

  if (widgetHtmlCache) {
    return widgetHtmlCache;
  }

  try {
    widgetHtmlCache = await buildWidgetHtml();
    console.log("✓ Widget HTML built successfully", widgetHtmlCache.length, "bytes");
  } catch (error) {
    console.error("✗ Failed to build widget:", error.message);
    console.error("   Stack:", error.stack);
    widgetHtmlCache = FALLBACK_WIDGET_HTML;
  }

  return widgetHtmlCache;
}

// Build widget on startup to catch errors early
try {
  await getWidgetHtml();
  console.log("✓ Widget preloaded successfully");
} catch (error) {
  console.error("✗ Widget preload failed:", error.message);
}

// Validate environment variables on startup
if (!isDevelopment) {
  const requiredEnvVars = ['PORT', 'MCP_PATH'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}. Using defaults.`);
  }
  if (!process.env.ALLOWED_ORIGIN) {
    console.log('ALLOWED_ORIGIN not set. Defaulting to https://chatgpt.com, https://chat.openai.com');
  }
}

const searchInputSchema = {
  query: z
    .string()
    .min(MIN_QUERY_LENGTH, "query is required")
    .max(MAX_QUERY_LENGTH, "query is too long")
    .describe("Free text search for vehicles."),
  engineType: z
    .enum(["combustion", "hybrid", "electric"], {
      errorMap: () => ({
        message: "engineType must be combustion, hybrid, or electric",
      }),
    })
    .optional()
    .describe("Optional engine type filter."),
  limit: z
    .number()
    .int()
    .min(MIN_VEHICLES_LIMIT)
    .max(MAX_VEHICLES_LIMIT)
    .default(DEFAULT_VEHICLE_LIMIT)
    .describe("Maximum number of vehicles to return."),
};

const leadSubmissionSchema = {
  firstName: z
    .string()
    .min(1, "First name is required")
    .describe("Customer's first name."),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .describe("Customer's last name."),
  email: z
    .string()
    .email("Invalid email address")
    .describe("Customer's email address."),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .describe("Customer's phone number."),
  message: z
    .string()
    .optional()
    .describe("Optional message from the customer."),
  vehicleTitle: z
    .string()
    .describe("Title of the vehicle of interest."),
  vehicleId: z
    .string()
    .describe("ID of the vehicle of interest."),
  requestType: z
    .string()
    .default("test_drive")
    .describe("Type of request (e.g., test_drive, contact)."),
  timestamp: z
    .string()
    .describe("ISO timestamp of the submission."),
};

const replyWithResults = ({ results, summary, statusText }) => ({
  content: statusText ? [{ type: "text", text: statusText }] : [],
  structuredContent: {
    results: Array.isArray(results) ? results : [],
    summary: summary ?? statusText ?? "",
  },
});

// Some hosting proxies drop Accept; force SSE so the MCP transport stays happy.
function ensureStreamableAccept(req) {
  const rawAccept = req?.headers?.accept;
  const accept = Array.isArray(rawAccept) ? rawAccept.join(",") : rawAccept;

  if (!accept) {
    req.headers.accept = "text/event-stream";
    return;
  }

  const normalized = accept.toLowerCase();
  if (normalized.includes("text/event-stream")) {
    return;
  }

  if (normalized.trim() === "*/*") {
    req.headers.accept = "text/event-stream";
    return;
  }

  req.headers.accept = `${accept}, text/event-stream`;
}

function createCarServer() {
  const server = new McpServer({
    name: "Car Scout",
    version: "0.1.0",
  });

  server.registerResource(
    "search-widget",
    "ui://widget/car-widget.html",
    {},
    async () => {
      const html = await getWidgetHtml();
      return {
        contents: [
          {
            uri: "ui://widget/car-widget.html",
            mimeType: "text/html+skybridge",
            text: html,
            _meta: {
              "openai/widgetPrefersBorder": false,
              "openai/widgetPrefersBackground": "light",
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_vehicles",
    {
      title: "Get vehicles",
      description: "Retrieves and displays vehicles from the inventory database. This is a read-only search operation.",
      inputSchema: searchInputSchema,
      annotations: {
        readOnlyHint: true,
      },
      _meta: {
        "openai/outputTemplate": "ui://widget/car-widget.html",
        "openai/toolInvocation/invoking": "Searching vehicles",
        "openai/toolInvocation/invoked": "Vehicles ready",
      },
    },
    async (args) => {
      try {
        const { results, summary } = await searchVehicles({
          query: args?.query,
          engineType: args?.engineType,
          limit: args?.limit,
        });

        if (!results.length) {
          return replyWithResults({
            results,
            summary,
            statusText: summary || "No vehicles matched your query.",
          });
        }

        const statusText = `${results.length} vehicles ready to explore.`;
        return replyWithResults({ results, summary: summary || statusText, statusText });
      } catch (error) {
        console.error("get_vehicles failed", error);
        return replyWithResults({
          results: [],
          summary: "We could not reach the inventory service.",
          statusText: "Inventory lookup failed. Please retry in a moment.",
        });
      }
    }
  );

  server.registerTool(
    "submit_lead",
    {
      title: "Submit test drive lead",
      description: "Submits a customer lead for a test drive or vehicle inquiry. This stores the customer's contact information and vehicle interest.",
      inputSchema: leadSubmissionSchema,
      annotations: {
        readOnlyHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Submitting lead",
        "openai/toolInvocation/invoked": "Lead submitted successfully",
      },
    },
    async (args) => {
      try {
        // Log the lead submission (in production, this would save to a database)
        console.log("Lead submission received:", {
          customer: `${args.firstName} ${args.lastName}`,
          email: args.email,
          phone: args.phone,
          vehicle: args.vehicleTitle,
          vehicleId: args.vehicleId,
          requestType: args.requestType,
          message: args.message,
          timestamp: args.timestamp,
        });

        // In a real application, you would:
        // 1. Save to database
        // 2. Send confirmation email to customer
        // 3. Notify dealer/sales team
        // 4. Create CRM entry
        
        const responseMessage = `Thank you, ${args.firstName}! Your request for a test drive of the ${args.vehicleTitle} has been received. A dealer representative will contact you at ${args.email} or ${args.phone} shortly.`;

        return {
          content: [
            {
              type: "text",
              text: responseMessage,
            },
          ],
          structuredContent: {
            success: true,
            leadId: `lead_${Date.now()}`, // Mock lead ID
            customerName: `${args.firstName} ${args.lastName}`,
            vehicleTitle: args.vehicleTitle,
            contactEmail: args.email,
            contactPhone: args.phone,
            message: responseMessage,
          },
        };
      } catch (error) {
        console.error("submit_lead failed", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to submit your request. Please try again or contact us directly.",
            },
          ],
          structuredContent: {
            success: false,
            error: "Submission failed",
          },
        };
      }
    }
  );

  return server;
}

// Exported handler for both serverless and traditional server usage
export async function handleMcpRequest(req, res) {
  // Handle browser GET requests with a simple info message
  if (req.method === "GET" && !req.headers["mcp-session-id"]) {
    res.writeHead(200, {
      "content-type": "text/plain",
      ...getCorsHeaders(req.headers?.origin),
    });
    res.end("Car search MCP server is running. Connect via an MCP client (e.g., ChatGPT) to use the search tool.");
    return;
  }

  ensureStreamableAccept(req);
  const corsHeaders = getCorsHeaders(req.headers?.origin, {
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
  });
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  const server = createCarServer();
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error handling MCP request", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Internal server error");
    }
  }
}

// Traditional HTTP server for local development
const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = process.env.MCP_PATH ?? "/mcp";

const httpServer = createServer(async (req, res) => {
  if (!req?.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname.startsWith(MCP_PATH)) {
    const requestedHeaders = req.headers?.["access-control-request-headers"];
    res.writeHead(204, {
      ...getCorsHeaders(req.headers?.origin, {
        "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": requestedHeaders || "content-type, mcp-session-id",
        "Access-Control-Expose-Headers": "Mcp-Session-Id",
      }),
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain" }).end("Car search MCP server");
    return;
  }

  if (req.method === "GET" && !url.pathname.startsWith(MCP_PATH)) {
    const candidatePath = resolve(publicDir, `.${url.pathname}`);
    if (candidatePath.startsWith(publicDir)) {
      try {
        const asset = readFileSync(candidatePath);
        const ext = extname(candidatePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";
        res.writeHead(200, { "content-type": mimeType }).end(asset);
        return;
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "EISDIR") {
          console.error("Static asset error", error);
        }
      }
    }
  }

  const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname.startsWith(MCP_PATH) && req.method && MCP_METHODS.has(req.method)) {
    await handleMcpRequest(req, res);
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(`Car search MCP server listening on http://localhost:${port}${MCP_PATH}`);
});
