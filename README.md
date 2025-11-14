# Drive Scout SDK APP

This project demonstrates an end-to-end ChatGPT app built with the [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) and the [Apps SDK quickstart](https://developers.openai.com/apps-sdk/quickstart) patterns. The app connects ChatGPT to a Contentful headless CMS, renders a custom vehicle search experience inside ChatGPT via an iframe widget, and exposes a tool that streams structured inventory results to both the LLM and the user interface.

## Features

- **Headless CMS integration:** Queries vehicle inventory stored in Contentful using the Content Delivery API with optional engine-type filtering.
- **Custom UX in ChatGPT:** Renders a responsive widget visually inspired by [avemo-group.de/fahrzeugsuche](https://avemo-group.de/fahrzeugsuche) inside ChatGPT.
- **React-powered widget:** Uses a React component (bundled on-demand with esbuild) to manage form state and render the iframe UI.
- **Apps SDK + MCP server:** Implements an MCP server that exposes the widget resource and a `search_inventory` tool, keeping UI and structured content in sync through `window.openai`.
- **Local mock data:** Provides high-quality fallback inventory data so the widget can be previewed without live Contentful credentials.

## Prerequisites

- Node.js 18 or newer.
- A Contentful space with a `car` content type (configurable) that includes fields for `name`, `model`, `engineType`, `description`, `heroImage`, optional `price`, `ctaUrl`, `ctaLabel`, and `statusBadge`.
- A Contentful Content Delivery (CDA) access token.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy the environment template and populate it:
   ```bash
   cp .env.example .env
   ```
   Fill in your Contentful credentials. Adjust `CONTENTFUL_CAR_CONTENT_TYPE` if your content model uses a different ID.
3. Run the MCP server locally (the React widget is bundled automatically on the first request in development):
   ```bash
   pnpm dev
   ```
   To work on the iframe UI in isolation, run:
   ```bash
   pnpm run widget:dev
   ```
   Then open the printed preview URL (defaults to `http://localhost:4173/index.html`).
4. (Optional) Test locally with the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector):
   ```bash
   npx @modelcontextprotocol/inspector@latest http://localhost:8787/mcp
   ```
5. Expose the server to ChatGPT using a tunnel such as ngrok:
   ```bash
   ngrok http 8787
   ```
   Use the public URL (e.g. `https://your-subdomain.ngrok.app/mcp`) when adding the connector in ChatGPT.
6. In ChatGPT:
   - Enable developer mode (Settings → Apps & Connectors → Advanced).
   - Add a new connector pointing to the tunneled `/mcp` URL.
   - Start a new chat, attach the connector, and ask something like “Find an electric SUV in stock.”

## Project Layout

- `apps/car-search-server/src/server.js` – MCP server that registers the widget resource and the `search_inventory` tool.
- `apps/car-search-server/public/` – HTML/CSS shell and static assets served with the widget bundle.
- `packages/car-search-data/src/` – Contentful integration and demo data shared across packages.
- `packages/car-search-widget/src/` – React sources compiled on-demand into the widget iframe.
- `scripts/widget-dev-server.js` – esbuild-powered preview server for developing the widget locally.
- `.env.example` – Template for required environment variables.

## Customization Tips

- Update the widget styling in `public/car-widget.html` to further match brand guidelines or add additional filters (price range, body style, etc.).
- Extend `searchCars` in `src/contentful.js` to map additional fields such as mileage or availability dates.
- When you change tools or metadata, refresh the connector in ChatGPT (Settings → Connectors → Refresh) so the new schema is picked up.

## Deploying

When ready, deploy `apps/car-search-server/src/server.js` (or package the `@drive-scout/car-search-server` workspace) to a public environment that supports Node.js (e.g., Vercel, Fly.io, Azure). Ensure the `/mcp` endpoint remains reachable over HTTPS and keep your Contentful tokens secure via environment variables.
