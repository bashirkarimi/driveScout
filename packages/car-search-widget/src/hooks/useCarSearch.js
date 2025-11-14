import { useCallback, useEffect, useMemo, useState } from "react";
import { FALLBACK_RESULTS } from "@drive-scout/car-search-data";
import { FALLBACK_LIMIT } from "../constants.js";
import { getInitialToolOutput, normalizeEngineType } from "../utils/cars.js";

export const useCarSearch = () => {
  const { results: initialResults, summary: initialSummary } = useMemo(() => getInitialToolOutput(), []);

  const [query, setQuery] = useState("");
  const [engineType, setEngineType] = useState("any");
  const [results, setResults] = useState(initialResults);
  const [statusMessage, setStatusMessage] = useState(() => {
    if (initialSummary?.trim()) return initialSummary;
    if (initialResults.length) return `${initialResults.length} vehicles ready to explore.`;
    return "";
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!statusMessage && results.length) {
      setStatusMessage(`${results.length} vehicles ready to explore.`);
    }
  }, [results, statusMessage]);

  const runFallbackSearch = useCallback(
    (searchQuery, searchEngineType) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const normalizedEngine = normalizeEngineType(searchEngineType);

      const filtered = FALLBACK_RESULTS.filter((item) => {
        if (normalizedEngine && item.engineType?.toLowerCase() !== normalizedEngine) {
          return false;
        }
        const haystack = [item.name, item.model, item.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return normalizedQuery ? haystack.includes(normalizedQuery) : true;
      }).slice(0, FALLBACK_LIMIT);

      setResults(filtered);

      if (filtered.length) {
        const audience = normalizedEngine ? `${normalizedEngine} inventory` : "demo vehicles";
        setStatusMessage(
          filtered.length === 1
            ? `Showing 1 ${audience} from the demo catalogue.`
            : `Showing ${filtered.length} ${audience} from the demo catalogue.`
        );
      } else {
        setStatusMessage("No demo vehicles matched. Configure Contentful credentials for live data.");
      }
    },
    [setResults, setStatusMessage]
  );

  const updateFromResponse = useCallback(
    (response) => {
      const structured = response?.structuredContent;
      if (!structured?.results) return;

      const nextResults = Array.isArray(structured.results) ? structured.results : [];
      setResults(nextResults);

      const summaryText = typeof structured.summary === "string" ? structured.summary.trim() : "";
      if (summaryText) {
        setStatusMessage(summaryText);
      } else if (nextResults.length) {
        setStatusMessage(`${nextResults.length} vehicles ready to explore.`);
      } else {
        setStatusMessage("No vehicles matched your query.");
      }
    },
    [setResults, setStatusMessage]
  );

  useEffect(() => {
    const handleSetGlobals = (event) => {
      const toolOutput = event.detail?.globals?.toolOutput;
      if (!toolOutput) return;
      updateFromResponse({ structuredContent: toolOutput });
    };

    window.addEventListener("openai:set_globals", handleSetGlobals, { passive: true });
    return () => window.removeEventListener("openai:set_globals", handleSetGlobals);
  }, [updateFromResponse]);

  const callSearchTool = useCallback(
    async (payload, fallbackContext) => {
      setIsLoading(true);
      if (window.openai?.callTool) {
        try {
          const response = await window.openai.callTool("search_inventory", payload);
          updateFromResponse(response);
        } catch (error) {
          console.error("search_inventory tool invocation failed", error);
          setResults([]);
          setStatusMessage("Inventory lookup failed. Please retry in a moment.");
        } finally {
          setIsLoading(false);
        }
        return;
      }

      runFallbackSearch(fallbackContext.query, fallbackContext.engineType);
      setIsLoading(false);
    },
    [runFallbackSearch, updateFromResponse]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setStatusMessage("Enter a search term to see cars.");
        setResults([]);
        return;
      }

      const normalizedEngine = engineType === "any" ? undefined : engineType;

      await callSearchTool(
        { query: trimmedQuery, engineType: normalizedEngine, limit: FALLBACK_LIMIT },
        { query: trimmedQuery, engineType }
      );
    },
    [callSearchTool, engineType, query]
  );

  return {
    query,
    setQuery,
    engineType,
    setEngineType,
    results,
    statusMessage,
    isLoading,
    handleSubmit,
  };
};
