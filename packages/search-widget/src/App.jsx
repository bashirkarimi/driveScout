import { SearchForm } from "./components/search-form";
import { StatusMessage } from "./components/status-message";
import { CardGrid } from "./components/card-grid";
import { EmptyState } from "./components/empty-state";
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Car Scout</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
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
      <CardGrid data={results} />
      <EmptyState shouldHide={results.length !== 0} />
    </main>
  );
}
