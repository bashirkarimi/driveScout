import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getWidgetHtml, preloadWidget } from "./widget-builder.js";
import {
  getCorsHeaders,
  resolveAllowedOrigin,
  ensureStreamableAccept,
} from "./cors-utils.js";
import {
  getVehiclesHandler,
  searchInputSchema,
} from "./tools/get-vehicles.js";
import {
  submitLeadHandler,
  leadSubmissionSchema,
} from "./tools/submit-lead.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = resolve(__dirname, "..");
const publicDir = resolve(serverRoot, "public");
const isDevelopment = process.env.NODE_ENV !== "production";

dotenv.config({ path: resolve(serverRoot, "..", "..", ".env") });

const MIME_TYPES = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

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
    getVehiclesHandler
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
    submitLeadHandler
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
