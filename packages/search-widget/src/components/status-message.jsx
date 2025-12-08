export const StatusMessage = ({ message, isLoading }) => (
  <div aria-live="polite" className="flex items-center gap-2 text-sm text-slate-500">
    {isLoading && (
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
    )}
    <span>{message ?? ""}</span>
  </div>
);
