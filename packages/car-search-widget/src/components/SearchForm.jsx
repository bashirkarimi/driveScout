export const SearchForm = ({
  query,
  onQueryChange,
  engineType,
  onEngineTypeChange,
  onSubmit,
  isLoading,
}) => (
  <form autoComplete="off" onSubmit={onSubmit}>
    <input
      type="search"
      placeholder="Search by name, model, series, or keyword"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
    />
    <select value={engineType} onChange={(event) => onEngineTypeChange(event.target.value)}>
      <option value="any">Any engine type</option>
      <option value="combustion">Combustion</option>
      <option value="hybrid">Hybrid</option>
      <option value="electric">Electric</option>
    </select>
    <button type="submit" disabled={isLoading}>
      <span>{isLoading ? "Searching..." : "Show results"}</span>
    </button>
  </form>
);
