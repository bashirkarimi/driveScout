export const getInitialToolOutput = () => {
  const toolOutput = window.openai?.toolOutput ?? {};
  const results = Array.isArray(toolOutput.results) ? toolOutput.results : [];
  const summary = typeof toolOutput.summary === "string" ? toolOutput.summary : "";
  return { results, summary };
};

export const formatMeta = (car) => {
  const parts = [];
  if (car.model) parts.push(car.model);
  if (car.engineType) parts.push(car.engineType);
  if (car.price?.formatted) parts.push(car.price.formatted);
  return parts.join(" • ");
};

export const normalizeEngineType = (engineType) => {
  if (!engineType || engineType === "any") return undefined;
  return engineType.toLowerCase();
};

export const buildVehicleKey = (car, index) => {
  if (car?.id) return car.id;
  if (car?.name) return `${car.name}-${index}`;
  return `vehicle-${index}`;
};
