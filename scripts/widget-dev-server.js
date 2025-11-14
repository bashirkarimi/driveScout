import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, "..");
const templatePath = resolve(projectRoot, "public/car-widget.html");
const entryPoint = resolve(projectRoot, "widget/index.jsx");
const outputDir = resolve(projectRoot, ".ui-dev");
const outputHtmlPath = join(outputDir, "index.html");
const outputScriptPath = join(outputDir, "widget.js");
const WIDGET_PLACEHOLDER = "<!--APP_SCRIPT-->";

const port = Number(process.env.WIDGET_DEV_PORT ?? 4173);

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
    jsx: "automatic",
    sourcemap: true,
    define: {
      "process.env.NODE_ENV": '"development"',
    },
    outfile: outputScriptPath,
  });

  await ctx.watch();

  const { host, port: activePort } = await ctx.serve({
    servedir: outputDir,
    host: "localhost",
    port,
  });

  console.log("\nCar widget dev server running:\n");
  console.log(`  UI preview:   http://${host}:${activePort}/index.html`);
  console.log("  Rebuilding bundle on file changes...\n");

  const stop = async () => {
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
