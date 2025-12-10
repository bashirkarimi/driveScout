import { useState } from "react";
import { SearchForm } from "./components/search-form";
import { StatusMessage } from "./components/status-message";
import { CardGrid } from "./components/card-grid";
import { EmptyState } from "./components/empty-state";
import { Modal } from "./components/modal";
import { DetailCard } from "./components/detail-card";
import { useCarSearch } from "./hooks/useCarSearch.js";
import { Logo } from './components/logo';

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

  const [selectedCar, setSelectedCar] = useState(null);

  const handleViewDetails = (car) => {
    setSelectedCar(car);
  };

  const handleCloseModal = () => {
    setSelectedCar(null);
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6 md:gap-6">
      <header className="flex gap-3">
        <Logo size={40} />
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Drive Scout
        </h1>
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
      <CardGrid data={results} onViewDetails={handleViewDetails} />
      <EmptyState shouldHide={results.length !== 0} />

      <Modal isOpen={!!selectedCar} onClose={handleCloseModal}>
        {selectedCar && (
          <DetailCard car={selectedCar} onClose={handleCloseModal} />
        )}
      </Modal>
    </main>
  );
}
