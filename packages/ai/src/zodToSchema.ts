import { jsonSchema, type Schema } from "ai";
import type { z } from "zod";

type JSONSchema7 = Parameters<typeof jsonSchema>[0];

export const zodToSchema = <T extends z.ZodTypeAny>(
  schema: T,
): Schema<z.infer<T>> =>
  jsonSchema(
    assertJsonSchema7(
      requireAllProperties(schema.toJSONSchema({ target: "draft-07" })),
    ),
    {
      validate: (value) => {
        const result = schema.safeParse(value);
        if (result.success) return { success: true, value: result.data };
        return { success: false, error: result.error };
      },
    },
  );

// OpenAI structured outputs requires every property to appear in `required`,
// even optional/nullable ones. Optionality is conveyed via anyOf with null instead.
const requireAllProperties = (schema: unknown): unknown => {
  if (!isRecord(schema)) return schema;
  const result: Record<string, unknown> = { ...schema };
  if (isRecord(result.properties)) {
    const allKeys = Object.keys(result.properties);
    result.required = allKeys;
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([k, v]) => [
        k,
        requireAllProperties(v),
      ]),
    );
  }
  if (Array.isArray(result.anyOf))
    result.anyOf = result.anyOf.map(requireAllProperties);
  if (Array.isArray(result.oneOf))
    result.oneOf = result.oneOf.map(requireAllProperties);
  if (Array.isArray(result.allOf))
    result.allOf = result.allOf.map(requireAllProperties);
  if (isRecord(result.items)) result.items = requireAllProperties(result.items);
  return result;
};

const assertJsonSchema7 = (schema: unknown): JSONSchema7 => {
  if (isJsonSchema7(schema)) return schema;
  throw new Error("Failed to convert Zod schema to JSON Schema draft-07");
};

const isJsonSchema7 = (schema: unknown): schema is JSONSchema7 => {
  if (typeof schema === "boolean") return true;
  if (!isRecord(schema)) return false;
  const exclusiveMaximum = schema.exclusiveMaximum;
  if (typeof exclusiveMaximum === "boolean") return false;
  const exclusiveMinimum = schema.exclusiveMinimum;
  if (typeof exclusiveMinimum === "boolean") return false;
  return true;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
