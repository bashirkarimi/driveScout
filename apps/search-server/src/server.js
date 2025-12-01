import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { searchCars } from "@drive-scout/search-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(serverRoot, "..", "..");
const widgetPackageRoot = resolve(workspaceRoot, "packages/search-widget");

dotenv.config({ path: resolve(workspaceRoot, ".env") });

const widgetTemplatePath = resolve(serverRoot, "public/car-widget.html");
const widgetEntryPoint = resolve(widgetPackageRoot, "src/index.jsx");
const widgetCssPath = resolve(widgetPackageRoot, "dist/widget-style.css");
const publicDir = resolve(serverRoot, "public");
const WIDGET_PLACEHOLDER = "<!--APP_SCRIPT-->";
const isDevelopment = process.env.NODE_ENV !== "production";

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

async function buildWidgetHtml() {
  const template = readWidgetTemplate();
  const esbuild = await import("esbuild");

  const result = await esbuild.build({
    entryPoints: [widgetEntryPoint],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    absWorkingDir: widgetPackageRoot,
    write: false,
    minify: !isDevelopment,
    jsx: "automatic",
    sourcemap: isDevelopment,
    outfile: "car-widget.js",
    loader: {
      ".css": "css",
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(isDevelopment ? "development" : "production"),
    },
  });

  const jsOutput = (result.outputFiles ?? []).find((file) => file.path.endsWith(".js"));
  const cssOutput = (result.outputFiles ?? []).find((file) => file.path.endsWith(".css"));
  
  if (!jsOutput?.text) {
    throw new Error("Widget build produced no output.");
  }

  // Include CSS as inline style tag and JavaScript as inline script
  let replacement = "";
  
  // Try to read the pre-built Tailwind CSS from the widget package first
  // This ensures Tailwind styles are included even if esbuild doesn't bundle them
  try {
    const prebuiltCss = readFileSync(widgetCssPath, "utf8");
    if (prebuiltCss) {
      replacement += `<style>\n${prebuiltCss}\n</style>\n`;
    }
  } catch (error) {
    // Fallback to esbuild CSS output if pre-built CSS is not available
    if (cssOutput?.text) {
      replacement += `<style>\n${cssOutput.text}\n</style>\n`;
    } else {
      console.warn("No CSS found. Run 'pnpm build' in the search-widget package to generate styles.");
    }
  }
  
  replacement += `<script type="module">\n${jsOutput.text}\n</script>`;
  
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
  } catch (error) {
    console.error("Failed to build widget", error);
    widgetHtmlCache = FALLBACK_WIDGET_HTML;
  }

  return widgetHtmlCache;
}

await getWidgetHtml();

// Validate environment variables on startup
if (!isDevelopment) {
  const requiredEnvVars = ['PORT', 'MCP_PATH'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}. Using defaults.`);
  }
  if (!process.env.ALLOWED_ORIGIN) {
    console.log('ALLOWED_ORIGIN not set. Defaulting to https://chatgpt.com');
  }
}

const searchInputSchema = {
  query: z
    .string()
    .min(1, "query is required")
    .max(120, "query is too long")
    .describe("Free text search for vehicles."),
  engineType: z
    .enum(["combustion", "hybrid", "electric"], {
      errorMap: () => ({ message: "engineType must be combustion, hybrid, or electric" }),
    })
    .optional()
    .describe("Optional engine type filter."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(24)
    .optional()
    .describe("Maximum number of vehicles to return."),
};

const replyWithResults = ({ results, summary, statusText }) => ({
  content: statusText ? [{ type: "text", text: statusText }] : summary ? [{ type: "text", text: summary }] : [],
  structuredContent: {
    results: Array.isArray(results) ? results : [],
    summary: summary ?? statusText ?? "",
  },
});

function createCarServer() {
  const server = new McpServer({
    name: "car-search-app",
    version: "0.1.0",
  });

  server.registerResource(
    "search-widget",
    "ui://widget/car-widget.html",
    {
      readOnlyHint: true,        // Skip confirmation prompts
      destructiveHint: false,    // Not deleting data
      openWorldHint: false       // Not publishing externally
    },
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
    "search_inventory",
    {
      title: "Search car inventory",
      description: "Searches the latest vehicles from the headless CMS.",
      inputSchema: searchInputSchema,
      _meta: {
        "openai/outputTemplate": "ui://widget/car-widget.html",
        "openai/toolInvocation/invoking": "Searching vehicles",
        "openai/toolInvocation/invoked": "Vehicles ready",
      },
    },
    async (args) => {
      try {
        const { results, summary } = await searchCars({
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
        console.error("search_inventory failed", error);
        return replyWithResults({
          results: [],
          summary: "We could not reach the inventory service.",
          statusText: "Inventory lookup failed. Please retry in a moment.",
        });
      }
    }
  );

  return server;
}

// Exported handler for both serverless and traditional server usage
export async function handleMcpRequest(req, res) {
  const allowedOrigin = isDevelopment ? "*" : (process.env.ALLOWED_ORIGIN || "https://chatgpt.com");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

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
    const allowedOrigin = isDevelopment ? "*" : (process.env.ALLOWED_ORIGIN || "https://chatgpt.com");
    res.writeHead(204, {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
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
