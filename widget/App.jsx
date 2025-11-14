import { useCallback, useEffect, useMemo, useState } from "react";
import { FALLBACK_RESULTS } from "../src/fallback-data.js";

const PLACEHOLDER_IMAGE = "/images/vehicle-placeholder.svg";
const FALLBACK_LIMIT = 9;

const getInitialToolOutput = () => {
  const toolOutput = window.openai?.toolOutput ?? {};
  const results = Array.isArray(toolOutput.results) ? toolOutput.results : [];
  const summary = typeof toolOutput.summary === "string" ? toolOutput.summary : "";
  return { results, summary };
};

const formatMeta = (car) => {
  const parts = [];
  if (car.model) parts.push(car.model);
  if (car.engineType) parts.push(car.engineType);
  if (car.price?.formatted) parts.push(car.price.formatted);
  return parts.join(" • ");
};

const normalizeEngineType = (engineType) => {
  if (!engineType || engineType === "any") return undefined;
  return engineType.toLowerCase();
};

export default function App() {
  const { results: initialResults, summary: initialSummary } = useMemo(
    () => getInitialToolOutput(),
    []
  );

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

  const runFallbackSearch = useCallback((searchQuery, searchEngineType) => {
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
  }, []);

  const updateFromResponse = useCallback((response) => {
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
  }, []);

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

  return (
    <main>
      <header>
        <h1>Fahrzeugsuche</h1>
        <p className="description">
          Search the live inventory to discover cars that match your needs. Pick a preferred engine type or browse
          everything.
        </p>
      </header>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Search by name, model, series, or keyword"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={engineType} onChange={(event) => setEngineType(event.target.value)}>
          <option value="any">Any engine type</option>
          <option value="combustion">Combustion</option>
          <option value="hybrid">Hybrid</option>
          <option value="electric">Electric</option>
        </select>
        <button type="submit" disabled={isLoading}>
          <span>{isLoading ? "Searching..." : "Show results"}</span>
        </button>
      </form>
      <div aria-live="polite" className="status" data-state={isLoading ? "loading" : "idle"}>
        {statusMessage}
      </div>
      <section className="results-grid" aria-live="polite">
        {results.map((car, index) => {
          const key = car.id ?? `${car.name ?? "vehicle"}-${index}`;
          return (
            <article className="card" key={key}>
              <img alt={car.name ?? "Vehicle"} src={car.image?.url ?? PLACEHOLDER_IMAGE} />
              <div className="card-body">
                <h2>{car.name ?? "Unnamed vehicle"}</h2>
                {car.badge ? <span className="badge">{car.badge}</span> : null}
                <div className="meta">{formatMeta(car)}</div>
                {car.description ? (
                  <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>{car.description}</p>
                ) : null}
                {car.ctaUrl ? (
                  <div className="cta-link">
                    <a href={car.ctaUrl} rel="noopener" target="_blank">
                      {car.ctaLabel ?? "View details"}
                    </a>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
      <div className="empty" hidden={results.length !== 0}>
        We could not find cars that match your filters. Try a broader search.
      </div>
    </main>
  );
}
