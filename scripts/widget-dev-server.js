import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, "..");
const serverPublicDir = resolve(projectRoot, "apps/car-search-server/public");
const templatePath = resolve(serverPublicDir, "car-widget.html");
const widgetPackageRoot = resolve(projectRoot, "packages/car-search-widget");
const entryPoint = resolve(widgetPackageRoot, "src/index.jsx");
const outputDir = resolve(projectRoot, ".ui-dev");
const outputHtmlPath = join(outputDir, "index.html");
const outputScriptPath = join(outputDir, "widget.js");
const publicDir = serverPublicDir;
const WIDGET_PLACEHOLDER = "<!--APP_SCRIPT-->";

const port = Number(process.env.WIDGET_DEV_PORT ?? 4173);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function ensureHtmlShell() {
  const template = await readFile(templatePath, "utf8");
  const injected = template.includes(WIDGET_PLACEHOLDER)
    ? template.replace(WIDGET_PLACEHOLDER, '<script type="module" src="./widget.js"></script>')
    : `${template}\n<script type="module" src="./widget.js"></script>`;
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputHtmlPath, injected, "utf8");
}

async function startDevServer() {
  await ensureHtmlShell();

  const ctx = await esbuild.context({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
  absWorkingDir: widgetPackageRoot,
    jsx: "automatic",
    sourcemap: true,
    define: {
      "process.env.NODE_ENV": '"development"',
    },
    outfile: outputScriptPath,
  });

  await ctx.rebuild();
  await ctx.watch();

  const server = createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400).end("Bad Request");
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    let filePath;
    if (requestUrl.pathname === "/" || requestUrl.pathname === "/index.html") {
      filePath = outputHtmlPath;
    } else if (requestUrl.pathname === "/widget.js") {
      filePath = outputScriptPath;
    } else if (requestUrl.pathname.startsWith("/images/")) {
      filePath = resolve(publicDir, requestUrl.pathname.slice(1));
      if (!filePath.startsWith(publicDir)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
    }

    if (!filePath) {
      res.writeHead(404).end("Not Found");
      return;
    }

    try {
  const data = await readFile(filePath);
  const mimeType = MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
      res.writeHead(200, { "content-type": mimeType }).end(data);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Widget dev server failed to read", filePath, error);
      }
      res.writeHead(404).end("Not Found");
    }
  });

  await new Promise((resolveStart) => {
    server.listen(port, "127.0.0.1", () => {
      console.log("\nCar widget dev server running:\n");
      console.log(`  UI preview:   http://127.0.0.1:${port}/index.html`);
      console.log("  Rebuilding bundle on file changes...\n");
      resolveStart();
    });
  });

  const stop = async () => {
    server.close();
    await ctx.dispose();
    process.exit(0);
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

startDevServer().catch((error) => {
  console.error("Failed to launch widget dev server", error);
  process.exit(1);
});
