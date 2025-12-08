// Thin adapter for Vercel serverless deployment
// Imports the shared MCP handler from the main server file
import { handleMcpRequest, resolveAllowedOrigin } from "../apps/search-server/src/server.js";

// Serverless function handler for Vercel
export default async function handler(req, res) {
  const allowedOrigin = resolveAllowedOrigin(req.headers?.origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const requestedHeaders = req.headers?.["access-control-request-headers"];
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", requestedHeaders || "content-type, mcp-session-id");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    return res.status(204).end();
  }

  const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
  if (!req.method || !MCP_METHODS.has(req.method)) {
    return res.status(405).end("Method Not Allowed");
  }

  // Delegate to the shared handler
  await handleMcpRequest(req, res);
}
