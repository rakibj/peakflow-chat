import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "zod";
import { LogicBlockType } from "../constants";

export const jsonRemapTransformationSchema = z.object({
  key: z.string().optional(),
  expression: z.string().optional(),
});

export const jsonRemapOptionsSchema = z.object({
  inputVariableId: z.string().optional(),
  outputVariableId: z.string().optional(),
  transformations: z.array(jsonRemapTransformationSchema).optional(),
  pickOnly: z.boolean().optional(),
});

export const jsonRemapBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([LogicBlockType.JSON_REMAP]),
    options: jsonRemapOptionsSchema.optional(),
  }),
);

export type JsonRemapBlock = z.infer<typeof jsonRemapBlockSchema>;
export type JsonRemapTransformation = z.infer<
  typeof jsonRemapTransformationSchema
>;
