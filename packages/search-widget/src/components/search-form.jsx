export const SearchForm = ({
  query,
  onQueryChange,
  engineType,
  onEngineTypeChange,
  onSubmit,
  isLoading,
}) => (
  <form
    autoComplete="off"
    onSubmit={onSubmit}
    className="grid gap-3 rounded-3xl border border-indigo-100 bg-white/80 p-4 shadow-widget backdrop-blur md:grid-cols-[1fr_160px_auto]"
  >
    <input
      type="search"
      placeholder="Search by name, model, series, or keyword"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    <select
      value={engineType}
      onChange={(event) => onEngineTypeChange(event.target.value)}
      className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="any">Any engine type</option>
      <option value="combustion">Combustion</option>
      <option value="hybrid">Hybrid</option>
      <option value="electric">Electric</option>
    </select>
    <button
      type="submit"
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      <span>{isLoading ? "Searching..." : "Show results"}</span>
    </button>
  </form>
);
