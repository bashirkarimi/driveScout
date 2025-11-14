import { FALLBACK_RESULTS } from "./fallback-data.js";

const pickFirstLocale = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "object") return value;
  const locales = Object.values(value);
  if (!locales.length) return undefined;
  return locales[0];
};

const buildImage = (field, assetsIndex) => {
  const ref = pickFirstLocale(field);
  if (!ref || !ref.sys?.id) return undefined;
  const asset = assetsIndex.get(ref.sys.id);
  if (!asset) return undefined;
  const file = pickFirstLocale(asset.fields?.file);
  if (!file?.url) return undefined;
  const url = file.url.startsWith("//") ? `https:${file.url}` : file.url;
  return { url, contentType: file.contentType, fileName: file.fileName };
};

export async function searchCars({
  query,
  engineType,
  limit = 9,
  spaceId = process.env.CONTENTFUL_SPACE_ID,
  environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID ?? "master",
  accessToken = process.env.CONTENTFUL_DELIVERY_TOKEN,
  contentType = process.env.CONTENTFUL_CAR_CONTENT_TYPE ?? "car",
}) {
  if (!query?.trim()) {
    return { results: [], summary: "Provide a search term to fetch inventory." };
  }

  if (!spaceId || !accessToken) {
    const filtered = FALLBACK_RESULTS.filter((item) => {
      if (!engineType) return true;
      return item.engineType?.toLowerCase() === engineType.toLowerCase();
    })
      .filter((item) => {
        const haystack = [item.name, item.model, item.description]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .slice(0, limit);
    return {
      results: filtered,
      summary: filtered.length
        ? `Showing ${filtered.length} curated demo vehicles. Configure Contentful credentials to see live data.`
        : "No demo vehicles matched. Configure Contentful credentials for live data.",
    };
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    content_type: contentType,
    query,
    limit: String(Math.min(Math.max(limit, 1), 24)),
    order: "-fields.updatedAt",
  });

  if (engineType) {
    params.set("fields.engineType", engineType);
  }

  const endpoint = `https://cdn.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries?${params.toString()}`;

  try {
    const response = await fetch(endpoint, {
      headers: { "content-type": "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Contentful request failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const assetsIndex = new Map();
    for (const asset of payload.includes?.Asset ?? []) {
      assetsIndex.set(asset.sys.id, asset);
    }

    const normalizePrice = (fields) => {
      const rawPrice = pickFirstLocale(fields?.price);
      if (rawPrice && typeof rawPrice === "number") {
        return {
          value: rawPrice,
          formatted: new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(rawPrice),
        };
      }
      const priceString = pickFirstLocale(fields?.priceFormatted);
      if (typeof priceString === "string") {
        return { formatted: priceString };
      }
      return undefined;
    };

    const mapped = (payload.items ?? []).map((entry) => {
      const fields = entry.fields ?? {};
      const price = normalizePrice(fields);
      const badge = pickFirstLocale(fields.statusBadge);
      const cta = pickFirstLocale(fields.cta);
      const ctaUrl = typeof cta === "object" && cta?.url ? cta.url : pickFirstLocale(fields.ctaUrl);
      const ctaLabel = typeof cta === "object" && cta?.label ? cta.label : pickFirstLocale(fields.ctaLabel);

      return {
        id: entry.sys?.id,
        name: pickFirstLocale(fields.name),
        model: pickFirstLocale(fields.model),
        engineType: pickFirstLocale(fields.engineType),
        description: pickFirstLocale(fields.description),
        badge: typeof badge === "string" ? badge : undefined,
        image: buildImage(fields.heroImage ?? fields.galleryImage, assetsIndex),
        price,
        ctaUrl: typeof ctaUrl === "string" ? ctaUrl : undefined,
        ctaLabel: typeof ctaLabel === "string" ? ctaLabel : undefined,
      };
    });

    const nonEmpty = mapped.filter((entry) => entry.name);
    const summary = nonEmpty.length
      ? `Surfaced ${nonEmpty.length} vehicles from Contentful.`
      : "Contentful returned no matching entries.";

    return { results: nonEmpty, summary };
  } catch (error) {
    console.error("Contentful search error", error);
    return {
      results: [],
      summary: "The inventory service is temporarily unavailable. Try again later.",
      error,
    };
  }
}
