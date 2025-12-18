import { memo } from "react";
import { Card } from "./card";
import { buildVehicleKey } from "../utils/cars.js";

export const CardGrid = memo(({ data, onViewDetails, onBookTestDrive }) => {
  if (!data || !data.length) {
    return null;
  }

  const gridClass =
    data.length === 1
      ? "flex justify-center"
      : "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3";

  return (
    <section className={gridClass} aria-live="polite">
      {data.map((vehicle, index) => (
        <Card
          vehicle={vehicle}
          key={buildVehicleKey(vehicle, index)}
          onViewDetails={onViewDetails}
          onBookTestDrive={onBookTestDrive}
        />
      ))}
    </section>
  );
});
