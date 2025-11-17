export const EmptyState = ({ shouldHide }) => (
  <div
    className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-8 text-center text-sm text-slate-500"
    hidden={shouldHide}
  >
    We could not find cars that match your filters. Try a broader search.
  </div>
);
