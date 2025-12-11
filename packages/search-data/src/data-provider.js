import { FALLBACK_RESULTS } from "./fallback-data.js";

export async function searchVehicles({
  query,
  engineType,
  limit = 9,
}) {
  if (!query?.trim()) {
    return { results: [], summary: "Provide a search term to fetch inventory." };
  }

  const filtered = FALLBACK_RESULTS.filter((item) => {
    if (!engineType) return true;
    return item.engineType?.toLowerCase() === engineType.toLowerCase();
  })
    .filter((item) => {
      const haystack = [item.name, item.model, item.description]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query.toLowerCase());
    })
    .slice(0, limit);

  return {
    results: filtered,
    summary: filtered.length
      ? `Showing ${filtered.length} vehicles.`
      : "No vehicles matched your search.",
  };
}
