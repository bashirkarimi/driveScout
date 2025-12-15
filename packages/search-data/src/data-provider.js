import { FALLBACK_RESULTS } from "./fallback-data.js";

export async function searchVehicles({
  query,
  engineType,
  limit = 9,
}) {
  // Treat '*' as a wildcard (match all)
  const effectiveQuery = query?.trim() === '*' ? '' : query;
  
  // Allow search with only engineType or only query or both
  if (!effectiveQuery?.trim() && !engineType) {
    return { results: [], summary: "Provide a search term or engine type to fetch inventory." };
  }

  let filtered = FALLBACK_RESULTS;
  let detectedEngineType = engineType;
  
  // Detect engine type from query if not explicitly provided
  if (effectiveQuery?.trim()) {
    const normalizedQuery = effectiveQuery.toLowerCase();
    
    // Check for engine type keywords in the query
    if (!detectedEngineType) {
      if (normalizedQuery.includes('electric') || normalizedQuery.includes('electronic') || normalizedQuery.includes('e-')) {
        detectedEngineType = 'electric';
      } else if (normalizedQuery.includes('hybrid')) {
        detectedEngineType = 'hybrid';
      } else if (normalizedQuery.includes('combustion') || normalizedQuery.includes('gasoline') || normalizedQuery.includes('petrol') || normalizedQuery.includes('diesel')) {
        detectedEngineType = 'combustion';
      }
    }
  }
  
  // Apply engineType filter if detected or provided
  if (detectedEngineType) {
    const normalizedEngineType = detectedEngineType.toLowerCase() === 'electronic' ? 'electric' : detectedEngineType.toLowerCase();
    
    filtered = filtered.filter((item) => {
      const itemEngineType = item.highlights?.engineType?.toLowerCase();
      return itemEngineType === normalizedEngineType;
    });
  }
  
  // Apply query filter for other search terms (excluding engine type keywords)
  if (effectiveQuery?.trim() && effectiveQuery.trim() !== '*') {
    const normalizedQuery = effectiveQuery.toLowerCase();
    // Remove engine type keywords from search to avoid double filtering
    const queryWithoutEngineType = normalizedQuery
      .replace(/\b(electric|electronic|hybrid|combustion|gasoline|petrol|diesel|e-)\b/gi, '')
      .trim();
    
    if (queryWithoutEngineType && queryWithoutEngineType !== '*') {
      filtered = filtered.filter((item) => {
        const haystack = [item.title, item.model, item.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(queryWithoutEngineType);
      });
    }
  }
  
  // Apply limit
  filtered = filtered.slice(0, limit);

  return {
    results: filtered,
    summary: filtered.length
      ? `Showing ${filtered.length} vehicles.`
      : "No vehicles matched your search.",
  };
}
