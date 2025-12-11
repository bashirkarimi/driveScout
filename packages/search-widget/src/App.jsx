import { useState } from "react";
import { SearchForm } from "./components/search-form";
import { StatusMessage } from "./components/status-message";
import { CardGrid } from "./components/card-grid";
import { EmptyState } from "./components/empty-state";
import { Modal } from "./components/modal";
import { DetailCard } from "./components/detail-card";
import { LeadForm } from "./components/lead-form";
import { useCarSearch } from "./hooks/useCarSearch.js";
import { Logo } from "./components/logo";

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

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormCar, setLeadFormCar] = useState(null);

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
  };

  const handleBookTestDrive = (vehicle) => {
    setLeadFormCar(vehicle);
    setShowLeadForm(true);
    setSelectedVehicle(null); // Close the detail modal if open
  };

  const handleCloseLeadForm = () => {
    setShowLeadForm(false);
    setLeadFormCar(null);
  };

  const handleSubmitLead = async (leadData) => {
    // In a real application, this would send data to your backend
    console.log("Lead form submitted:", leadData);

    // For now, we'll just simulate an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Lead successfully submitted:", leadData);
        resolve({ success: true });
      }, 1000);
    });
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
      <CardGrid
        data={results}
        onViewDetails={handleViewDetails}
        onBookTestDrive={handleBookTestDrive}
      />
      <EmptyState shouldHide={results.length !== 0} />

      {showLeadForm && leadFormCar && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-lg">
          <LeadForm
            vehicleData={leadFormCar}
            onClose={handleCloseLeadForm}
            onSubmit={handleSubmitLead}
          />
        </div>
      )}

      <Modal isOpen={!!selectedVehicle} onClose={handleCloseModal}>
        {selectedVehicle && (
          <DetailCard
            vehicleDetails={selectedVehicle}
            onClose={handleCloseModal}
            onBookTestDrive={handleBookTestDrive}
          />
        )}
      </Modal>
    </main>
  );
}
