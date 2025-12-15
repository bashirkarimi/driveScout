import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(serverRoot, "..", "..");
const widgetPackageRoot = resolve(workspaceRoot, "packages/search-widget");

const widgetTemplatePath = resolve(serverRoot, "public/car-widget.html");
const widgetEntryPoint = resolve(widgetPackageRoot, "src/index.jsx");
const widgetJsPath = resolve(widgetPackageRoot, "dist/widget.js");
const widgetCssPath = resolve(widgetPackageRoot, "dist/widget-style.css");
const fallbackWidgetPath = resolve(__dirname, "fallback-widget.html");
const WIDGET_PLACEHOLDER = "<!--APP_SCRIPT-->";
const isDevelopment = process.env.NODE_ENV !== "production";

let FALLBACK_WIDGET_HTML = "";
try {
  FALLBACK_WIDGET_HTML = readFileSync(fallbackWidgetPath, "utf8");
} catch (error) {
  console.warn("Warning: Could not load fallback widget template", error.message);
  FALLBACK_WIDGET_HTML = "<div>Widget unavailable</div>";
}

const readWidgetTemplate = () => readFileSync(widgetTemplatePath, "utf8");

let widgetHtmlCache = null;

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

  const jsText =
    (result.outputFiles ?? []).find((file) => file.path.endsWith(".js"))
      ?.text ?? null;
  const cssText =
    (result.outputFiles ?? []).find((file) => file.path.endsWith(".css"))
      ?.text ?? null;

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
    console.error(
      `✗ Failed to read widget JS from ${widgetJsPath}:`,
      error.message
    );
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
    console.error(
      `✗ Failed to read widget CSS from ${widgetCssPath}:`,
      error.message
    );
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
      console.log('[Car Widget] NODE_ENV:', '${
        isDevelopment ? "development" : "production"
      }');
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
    throw new Error(
      "Widget build produced no JS output. Check that 'pnpm build' was run and dist/widget.js exists."
    );
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
  const hasCSS = styles.includes("<style>");
  const scripts = injectScripts(jsText, hasCSS);
  const replacement = styles + scripts;

  // Insert into template
  if (template.includes(WIDGET_PLACEHOLDER)) {
    return template.replace(WIDGET_PLACEHOLDER, replacement);
  }

  return `${template}\n${replacement}`;
}

/**
 * Gets the widget HTML, using cache in production or rebuilding in development
 * @returns {Promise<string>} Complete widget HTML
 */
export async function getWidgetHtml() {
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
    console.log(
      "✓ Widget HTML built successfully",
      widgetHtmlCache.length,
      "bytes"
    );
  } catch (error) {
    console.error("✗ Failed to build widget:", error.message);
    console.error("   Stack:", error.stack);
    widgetHtmlCache = FALLBACK_WIDGET_HTML;
  }

  return widgetHtmlCache;
}

/**
 * Preloads the widget HTML on startup to catch errors early
 * @returns {Promise<void>}
 */
export async function preloadWidget() {
  try {
    await getWidgetHtml();
    console.log("✓ Widget preloaded successfully");
  } catch (error) {
    console.error("✗ Widget preload failed:", error.message);
  }
}
