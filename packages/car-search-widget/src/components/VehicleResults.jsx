import { VehicleCard } from "./VehicleCard.jsx";
import { buildVehicleKey } from "../utils/cars.js";

export const VehicleResults = ({ cars }) => {
  if (!cars.length) {
    return null;
  }

  if (cars.length === 1) {
    const car = cars[0];
    return (
      <section aria-live="polite" className="flex justify-center">
        <VehicleCard car={car} />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
      {cars.map((car, index) => (
        <VehicleCard car={car} key={buildVehicleKey(car, index)} />
      ))}
    </section>
  );
};
