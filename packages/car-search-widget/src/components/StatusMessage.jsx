export const StatusMessage = ({ message, isLoading }) => (
  <div aria-live="polite" className="status" data-state={isLoading ? "loading" : "idle"}>
    {message}
  </div>
);
