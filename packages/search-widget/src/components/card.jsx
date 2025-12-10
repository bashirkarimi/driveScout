import { PLACEHOLDER_IMAGE } from "../constants.js";
import { Button } from "./button";

export const Card = ({ car, onViewDetails }) => {
  const {
    title,
    subtitle,
    heroImage,
    highlights,
    pricing,
    badge,
    description,
    actions,
  } = car;
return (
  <article className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-900/10">
    <img
      alt={title ?? "Vehicle"}
      src={heroImage ?? PLACEHOLDER_IMAGE}
      className="h-48 w-full object-cover md:h-52"
    />
    <div className="flex flex-col gap-4 p-4 h-full">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          {title ?? "Unnamed vehicle"}
        </h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
        {badge && (
          <span className="inline-flex w-fit items-center rounded-full bg-blue-200 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-blue-800">
            {badge}
          </span>
        )}
      </header>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {[
          highlights.year && {
            key: "year",
            value: highlights.year,
          },
          highlights.engineType && {
            key: "engine",
            value: highlights.engineType,
          },
          pricing?.priceFormatted && {
            key: "price",
            value: pricing.priceFormatted,
          },
        ]
          .filter(Boolean)
          .map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600"
            >
              <p>
                <span className="sr-only">{item.key}: </span>
                {item.value}
              </p>
            </span>
          ))}
      </div>
      {description && (
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      )}
      <div className="pt-3 mt-auto">
        <Button variant="primary" onClick={() => onViewDetails(car)}>
          Open Full Details
        </Button>
      </div>
    </div>
  </article>
);
}