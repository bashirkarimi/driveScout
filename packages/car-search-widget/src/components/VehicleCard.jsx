import { PLACEHOLDER_IMAGE } from "../constants.js";
import { formatMeta } from "../utils/cars.js";

export const VehicleCard = ({ car }) => (
  <article className="card">
    <img alt={car.name ?? "Vehicle"} src={car.image?.url ?? PLACEHOLDER_IMAGE} />
    <div className="card-body">
      <h2>{car.name ?? "Unnamed vehicle"}</h2>
      {car.badge ? <span className="badge">{car.badge}</span> : null}
      <div className="meta">{formatMeta(car)}</div>
      {car.description ? (
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>{car.description}</p>
      ) : null}
      {car.ctaUrl ? (
        <div className="cta-link">
          <a href={car.ctaUrl} rel="noopener" target="_blank">
            {car.ctaLabel ?? "View details"}
          </a>
        </div>
      ) : null}
    </div>
  </article>
);
