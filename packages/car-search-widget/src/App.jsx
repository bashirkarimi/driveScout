import { SearchForm } from "./components/SearchForm.jsx";
import { StatusMessage } from "./components/StatusMessage.jsx";
import { VehicleResults } from "./components/VehicleResults.jsx";
import { EmptyState } from "./components/EmptyState.jsx";
import { useCarSearch } from "./hooks/useCarSearch.js";

export default function App() {
  const {
    query,
    setQuery,
    engineType,
    setEngineType,
    results,
    statusMessage,
    isLoading,
    handleSubmit,
  } = useCarSearch();

  return (
    <main>
      <header>
        <h1>Fahrzeugsuche</h1>
        <p className="description">
          Search the live inventory to discover cars that match your needs. Pick a preferred engine type or browse
          everything.
        </p>
      </header>
      <SearchForm
        engineType={engineType}
        isLoading={isLoading}
        onEngineTypeChange={setEngineType}
        onQueryChange={setQuery}
        onSubmit={handleSubmit}
        query={query}
      />
      <StatusMessage isLoading={isLoading} message={statusMessage} />
      <VehicleResults cars={results} />
      <EmptyState shouldHide={results.length !== 0} />
    </main>
  );
}
