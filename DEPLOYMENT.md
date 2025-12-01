# Deployment Guide

## Serverless Functions Explained

### Traditional Server vs. Serverless

**Your Current Setup (Traditional):**
```javascript
const httpServer = createServer(async (req, res) => { ... });
httpServer.listen(port); // Always running
```
- Server runs 24/7
- Maintains persistent connections
- Fixed resource allocation
- You pay for uptime

**Serverless Functions:**
```javascript
export default async function handler(req, res) { ... }
// Called only when request arrives
```
- Executes on-demand per request
- Auto-scales from 0 to infinity
- No server management
- You pay per execution

### Key Differences

1. **Lifecycle**: Serverless functions are stateless - each invocation is independent
2. **Timeout**: Limited execution time (10-60 seconds)
3. **Cold Starts**: First request may be slower as function initializes
4. **Scaling**: Automatic horizontal scaling

---

## Deploying to Vercel

### Prerequisites

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Build the widget:
   ```bash
   pnpm build
   ```

### Environment Variables

Your serverless function needs these environment variables:

- `ALLOWED_ORIGIN` - CORS origin (default: `https://chatgpt.com`)
- `NODE_ENV` - Set to `production`
- `CMS_SPACE_ID` - Your Contentful space ID (if using CMS)
- `CMS_API_TOKEN` - Your Contentful API token (if using CMS)

### Deployment Steps

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy (first time):**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `car-search-sdk` (or your choice)
   - In which directory is your code located? `./`
   - Want to override settings? **N**

3. **Set environment variables:**
   ```bash
   vercel env add ALLOWED_ORIGIN
   # Enter: https://chatgpt.com
   
   vercel env add CMS_SPACE_ID
   # Enter your Contentful space ID
   
   vercel env add CMS_API_TOKEN
   # Enter your Contentful API token
   ```

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

5. **Your MCP endpoint will be:**
   ```
   https://your-project.vercel.app/mcp
   ```

### Continuous Deployment

Connect your GitHub repository to Vercel for automatic deployments:

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Add environment variables in the project settings
5. Deploy!

Every push to `main` will automatically deploy.

---

## What Changed in the Code

### 1. Created `/api/mcp.js` (Serverless Handler)

**Before (Traditional Server):**
```javascript
const httpServer = createServer(async (req, res) => {
  // Handle routing
  if (url.pathname.startsWith(MCP_PATH)) {
    const server = createCarServer();
    const transport = new StreamableHTTPServerTransport();
    await server.connect(transport);
    await transport.handleRequest(req, res);
  }
});
httpServer.listen(port);
```

**After (Serverless Function):**
```javascript
export default async function handler(req, res) {
  // Handle one request at a time
  const server = createCarServer();
  const transport = new StreamableHTTPServerTransport();
  
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } finally {
    // Clean up after each request
    transport.close();
    server.close();
  }
}
```

**Key Changes:**
- No `createServer()` - Vercel provides the HTTP server
- No `.listen()` - Function is invoked automatically
- Cleanup in `finally` block - Release resources after each request
- CORS headers set per request

### 2. Created `/vercel.json` (Configuration)

Tells Vercel:
- How to build your project (`buildCommand`)
- Route `/mcp` to the serverless function (`rewrites`)
- Memory and timeout limits for the function
- Environment variables

### 3. Why This Works

Your MCP server architecture is already well-suited for serverless:
- Each request creates a new server instance
- No shared state between requests
- Transport closes after handling

The refactor mainly removes the HTTP server wrapper and exports a function handler instead.

---

## Troubleshooting

### Cold Starts
**Problem**: First request is slow (2-5 seconds)
**Solution**: Vercel Pro has warmer functions, or use a cron job to keep it warm

### Timeouts
**Problem**: Function times out after 10 seconds (free tier)
**Solution**: 
- Upgrade to Pro for 60-second timeouts
- Optimize your search queries
- Add caching for widget HTML

### CORS Errors
**Problem**: ChatGPT can't connect
**Solution**: Verify `ALLOWED_ORIGIN` is set to `https://chatgpt.com`

### Build Failures
**Problem**: Deployment fails during build
**Solution**: 
```bash
# Test locally first
pnpm build
pnpm test

# Check build logs
vercel logs
```

---

## Alternative: Netlify

If you prefer Netlify:

1. Create `netlify.toml`:
```toml
[build]
  command = "pnpm install && pnpm build"
  publish = "apps/search-server/public"
  functions = "netlify/functions"

[[redirects]]
  from = "/mcp/*"
  to = "/.netlify/functions/mcp/:splat"
  status = 200
```

2. Create `netlify/functions/mcp.js`:
```javascript
import handler from '../../api/mcp.js';
export { handler };
```

3. Deploy:
```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod
```

---

## Testing Your Deployment

1. **Test the endpoint:**
   ```bash
   curl https://your-project.vercel.app/mcp
   ```

2. **Update ChatGPT MCP connector:**
   - Go to ChatGPT settings
   - Update MCP server URL to: `https://your-project.vercel.app/mcp`
   - Test a search query

3. **Monitor logs:**
   ```bash
   vercel logs --follow
   ```

---

## Cost Comparison

**Vercel Free Tier:**
- 100GB bandwidth/month
- 100 hours serverless function execution
- 10-second timeout
- Perfect for development and low traffic

**Vercel Pro ($20/month):**
- 1TB bandwidth
- 1000 hours execution
- 60-second timeout
- Better for production

**Traditional VPS (e.g., DigitalOcean):**
- $6-12/month
- Always running
- No timeout limits
- You manage everything

For an MCP server with moderate usage, Vercel Free tier should be sufficient!
