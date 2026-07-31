// Parses a variable value that is expected to hold a JSON array, tolerating the
// various forms `updateVariablesInSession` can produce:
//   - a JSON string holding an array (e.g. `'[{"a":1}]'`)
//   - an array whose elements are JSON-stringified objects (e.g. `['{"a":1}']`)
//   - a plain array value
// Returns `undefined` when the value is not a JSON array.
export const parseJsonArrayInput = (
  value: string | (string | null)[] | null | undefined,
): Record<string, unknown>[] | undefined => {
  try {
    if (typeof value === "string") {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return undefined;
      return parsed as Record<string, unknown>[];
    }
    if (Array.isArray(value))
      return value.map((item) => {
        if (typeof item !== "string")
          return item as unknown as Record<string, unknown>;
        try {
          return JSON.parse(item) as Record<string, unknown>;
        } catch {
          return item as unknown as Record<string, unknown>;
        }
      });
    return undefined;
  } catch {
    return undefined;
  }
};
