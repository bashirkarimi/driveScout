const isDevelopment = process.env.NODE_ENV !== "production";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://chatgpt.com",
  "https://chat.openai.com",
];

/**
 * Resolves the appropriate CORS origin based on environment and configuration
 * @param {string} requestOrigin - The origin from the request headers
 * @returns {string} The allowed origin to use in CORS headers
 */
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

/**
 * Generates CORS headers for HTTP responses
 * @param {string} requestOrigin - The origin from the request headers
 * @param {Object} additionalHeaders - Additional headers to merge with CORS headers
 * @returns {Object} Complete CORS headers object
 */
export function getCorsHeaders(requestOrigin, additionalHeaders = {}) {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(requestOrigin),
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
    ...additionalHeaders,
  };
}

/**
 * Ensures the request accepts Server-Sent Events (SSE) for MCP transport
 * Some hosting proxies drop the Accept header, so we force text/event-stream
 * @param {Object} req - HTTP request object
 */
export function ensureStreamableAccept(req) {
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
