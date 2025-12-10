import { PLACEHOLDER_IMAGE } from "../constants.js";
import { ImageCarousel } from "./image-carousel.jsx";

export const DetailCard = ({ car, onClose }) => {
  const {
    title,
    subtitle,
    heroImage,
    gallery,
    highlights,
    pricing,
    badge,
    description,
    location,
    actions,
    meta,
  } = car;

  const displayImages = gallery && gallery.length > 0 ? gallery : [heroImage || PLACEHOLDER_IMAGE];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex justify-end border-b border-slate-200 bg-white p-4">
        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close details"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <ImageCarousel images={displayImages} alt={title} />
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
                {title || "Unnamed vehicle"}
              </h2>
              {subtitle && (
                <p className="mt-1 text-base text-slate-600">{subtitle}</p>
              )}
            </div>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-elm-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-elm-800">
                {badge}
              </span>
            )}
          </div>

          {pricing && (
            <div className="rounded-lg bg-elm-50 p-4">
              <div className="flex flex-wrap items-baseline gap-2">
                {pricing.priceFormatted && (
                  <span className="text-3xl font-bold text-slate-900">
                    {pricing.priceFormatted}
                  </span>
                )}
                {pricing.monthlyRate && (
                  <span className="text-sm text-slate-600">
                    {pricing.monthlyRate}
                  </span>
                )}
              </div>
              {pricing.financingAvailable && (
                <p className="mt-1 text-sm text-slate-600">
                  Financing available
                </p>
              )}
            </div>
          )}
        </header>

        {description && (
          <div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Description
            </h3>
            <p className="leading-relaxed text-slate-600">{description}</p>
          </div>
        )}

        {highlights && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Vehicle Highlights
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {highlights.engineType && (
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Engine
                  </span>
                  <span className="mt-1 font-semibold text-slate-900">
                    {highlights.engineType}
                  </span>
                </div>
              )}
              {highlights.power && (
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Power
                  </span>
                  <span className="mt-1 font-semibold text-slate-900">
                    {highlights.power}
                  </span>
                </div>
              )}
              {highlights.range && (
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Range
                  </span>
                  <span className="mt-1 font-semibold text-slate-900">
                    {highlights.range}
                  </span>
                </div>
              )}
              {highlights.year && (
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Year
                  </span>
                  <span className="mt-1 font-semibold text-slate-900">
                    {highlights.year}
                  </span>
                </div>
              )}
              {highlights.mileage && (
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Mileage
                  </span>
                  <span className="mt-1 font-semibold text-slate-900">
                    {highlights.mileage}
                  </span>
                </div>
              )}
              {highlights.transmission && (
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Transmission
                  </span>
                  <span className="mt-1 font-semibold text-slate-900">
                    {highlights.transmission}
                  </span>
                </div>
              )}
              {highlights.drivetrain && (
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Drivetrain
                  </span>
                  <span className="mt-1 font-semibold text-slate-900">
                    {highlights.drivetrain}
                  </span>
                </div>
              )}
              {highlights.seats && (
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Seats
                  </span>
                  <span className="mt-1 font-semibold text-slate-900">
                    {highlights.seats}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {location && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Location
            </h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              {location.dealer && (
                <p className="font-semibold text-slate-900">{location.dealer}</p>
              )}
              {location.city && (
                <p className="text-slate-600">{location.city}</p>
              )}
              {location.distanceKm && (
                <p className="mt-1 text-sm text-slate-500">
                  {location.distanceKm} km away
                </p>
              )}
            </div>
          </div>
        )}

        {actions && (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white pt-6">
            <div className="flex flex-col gap-3">
              {actions.primary && (
                <a
                  href={actions.primary.url || "#"}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-elm-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-elm-700"
                >
                  {actions.primary.label || "View details"}
                </a>
              )}
              {actions.secondary && actions.secondary.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {actions.secondary.map((action, index) => (
                    <a
                      key={index}
                      href={action.url || "#"}
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {meta?.created_at && (
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
            Listed on {new Date(meta.created_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};
