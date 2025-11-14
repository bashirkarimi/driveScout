export const EmptyState = ({ shouldHide }) => (
  <div className="empty" hidden={shouldHide}>
    We could not find cars that match your filters. Try a broader search.
  </div>
);
