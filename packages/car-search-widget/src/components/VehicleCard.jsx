import { PLACEHOLDER_IMAGE } from "../constants.js";

export const VehicleCard = ({ car }) => (
  <article className="card">
    <img
      alt={car.name ?? "Vehicle"}
      src={car.image?.url ?? PLACEHOLDER_IMAGE}
    />
    <div className="card-header">
      <h2>{car.name ?? "Unnamed vehicle"}</h2>
      {car.badge && <span className="badge">{car.badge}</span>}
    </div>
    <div className="card-body">
      <div className="meta">
        {[
          car.model && { key: "model", value: car.model },
          car.engineType && { key: "engine", value: car.engineType },
          car.price?.formatted && { key: "price", value: car.price.formatted },
        ]
          .filter(Boolean)
          .map((item) => (
            <span key={item.key} className="meta-item">
              <strong>{item.value}</strong>
            </span>
          ))}
      </div>
      {car.description ? (
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
          {car.description}
        </p>
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
