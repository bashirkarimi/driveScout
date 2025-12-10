import { PLACEHOLDER_IMAGE } from "../constants.js";
import { Button } from "./button";

export const Card = ({ car, onViewDetails, onBookTestDrive }) => {
  const {
    title,
    subtitle,
    heroImage,
    highlights,
    pricing,
    description,
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
      <div className="pt-3 mt-auto flex flex-col gap-2 sm:flex-row">
        <Button variant="primary" onClick={() => onViewDetails(car)} className="flex-1">
          Open Full Details
        </Button>
        <Button variant="success" onClick={() => onBookTestDrive(car)} className="flex-1">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Book Test Drive
        </Button>
      </div>
    </div>
  </article>
);
}