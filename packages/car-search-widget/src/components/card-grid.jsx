import { Card } from "./card";
import { buildVehicleKey } from "../utils/cars.js";

export const CardGrid = ({ data }) => {
  if (!data.length) {
    return null;
  }

  if (data.length === 1) {
    const car = data[0];
    return (
      <section aria-live="polite" className="flex justify-center">
        <Card car={car} />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
      {data.map((car, index) => (
        <Card car={car} key={buildVehicleKey(car, index)} />
      ))}
    </section>
  );
};
