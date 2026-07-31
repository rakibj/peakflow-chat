const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

// Normalises the output of `parseJsonArrayInput` into a list of variant ID
// strings. Plain strings are kept as-is; object elements yield their
// `variantId` (falling back to `id`) so raw Fetch Products output can be passed
// directly. Non-string / empty values are dropped.
export const coerceVariantIds = (items: unknown[]): string[] =>
  items
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item)) return item.variantId ?? item.id;
      return undefined;
    })
    .filter((id): id is string => typeof id === "string" && id.length > 0);
