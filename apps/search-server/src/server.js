import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { searchVehicles } from "@drive-scout/search-data";
import { getWidgetHtml, preloadWidget } from "./widget-builder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = resolve(__dirname, "..");
const publicDir = resolve(serverRoot, "public");
const isDevelopment = process.env.NODE_ENV !== "production";

dotenv.config({ path: resolve(serverRoot, "..", "..", ".env") });
const DEFAULT_ALLOWED_ORIGINS = [
  "https://chatgpt.com",
  "https://chat.openai.com",
];
const MAX_QUERY_LENGTH = 120;
const MIN_QUERY_LENGTH = 1;
const MAX_VEHICLES_LIMIT = 12;
const MIN_VEHICLES_LIMIT = 1;
const DEFAULT_VEHICLE_LIMIT = 9;
const MIME_TYPES = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

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
    Vary: "Origin",
    ...additionalHeaders,
  };
}

// Build widget on startup to catch errors early
await preloadWidget();

// Validate environment variables on startup
if (!isDevelopment) {
  const requiredEnvVars = ["PORT", "MCP_PATH"];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(
        ", "
      )}. Using defaults.`
    );
  }
  if (!process.env.ALLOWED_ORIGIN) {
    console.log(
      "ALLOWED_ORIGIN not set. Defaulting to https://chatgpt.com, https://chat.openai.com"
    );
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
  vehicleTitle: z.string().describe("Title of the vehicle of interest."),
  vehicleId: z.string().describe("ID of the vehicle of interest."),
  requestType: z
    .string()
    .default("test_drive")
    .describe("Type of request (e.g., test_drive, contact)."),
  timestamp: z.string().describe("ISO timestamp of the submission."),
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
      description:
        "Retrieves and displays vehicles from the inventory database. This is a read-only search operation.",
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
        return replyWithResults({
          results,
          summary: summary || statusText,
          statusText,
        });
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
      description:
        "Submits a customer lead for a test drive or vehicle inquiry. This stores the customer's contact information and vehicle interest.",
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
    res.end(
      "Drive Scout MCP server is running. Connect via an MCP client (e.g., ChatGPT) to use the search tool."
    );
    return;
  }

  ensureStreamableAccept(req);
  const corsHeaders = getCorsHeaders(req.headers?.origin, {
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
  });
  Object.entries(corsHeaders).forEach(([key, value]) =>
    res.setHeader(key, value)
  );

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
        "Access-Control-Allow-Headers":
          requestedHeaders || "content-type, mcp-session-id",
        "Access-Control-Expose-Headers": "Mcp-Session-Id",
      }),
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res
      .writeHead(200, { "content-type": "text/plain" })
      .end("Car search MCP server");
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
  if (
    url.pathname.startsWith(MCP_PATH) &&
    req.method &&
    MCP_METHODS.has(req.method)
  ) {
    await handleMcpRequest(req, res);
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(
    `Drive Scout MCP server listening on http://localhost:${port}${MCP_PATH}`
  );
});
