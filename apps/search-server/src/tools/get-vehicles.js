import { searchVehicles } from "@drive-scout/search-data";

/**
 * Helper function to format tool responses with structured content
 * @param {Object} params - Response parameters
 * @param {Array} params.results - Search results array
 * @param {string} params.summary - Summary text
 * @param {string} params.statusText - Status message for the user
 * @returns {Object} Formatted response object
 */
const replyWithResults = ({ results, summary, statusText }) => ({
  content: statusText ? [{ type: "text", text: statusText }] : [],
  structuredContent: {
    results: Array.isArray(results) ? results : [],
    summary: summary ?? statusText ?? "",
  },
});

/**
 * Tool handler for getting vehicles from the inventory
 * @param {Object} args - Tool arguments
 * @param {string} args.query - Search query
 * @param {string} [args.engineType] - Optional engine type filter
 * @param {number} [args.limit] - Maximum number of results
 * @returns {Promise<Object>} Tool response with vehicle results
 */
export async function getVehiclesHandler(args) {
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
