import { PLACEHOLDER_IMAGE } from "../constants.js";

export const VehicleCard = ({ car }) => (
  <article className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-900/10">
    <img
      alt={car.name ?? "Vehicle"}
      src={car.image?.url ?? PLACEHOLDER_IMAGE}
      className="h-48 w-full object-cover md:h-52"
    />
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{car.name ?? "Unnamed vehicle"}</h2>
        {car.badge ? (
          <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {car.badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {[
          car.model && { key: "model", value: car.model },
          car.engineType && { key: "engine", value: car.engineType },
          car.price?.formatted && { key: "price", value: car.price.formatted },
        ]
          .filter(Boolean)
          .map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600"
            >
              {item.value}
            </span>
          ))}
      </div>
      {car.description ? (
        <p className="text-sm leading-relaxed text-slate-500">{car.description}</p>
      ) : null}
      {car.ctaUrl ? (
        <div className="pt-3">
          <a
            href={car.ctaUrl}
            rel="noopener"
            target="_blank"
            className="inline-flex items-center rounded-md bg-slate-200 px-3 py-2 font-semibold text-slate-800 transition-colors hover:bg-orange-500 hover:text-white"
          >
            {car.ctaLabel ?? "View details"}
          </a>
        </div>
      ) : null}
    </div>
  </article>
);
