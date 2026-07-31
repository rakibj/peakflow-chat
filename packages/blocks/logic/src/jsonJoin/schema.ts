import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "zod";
import { LogicBlockType } from "../constants";

export const jsonJoinOptionsSchema = z.object({
  input1Mode: z.enum(["array", "value"]).optional(),
  inputVariable1Id: z.string().optional(),
  inputVariable2Id: z.string().optional(),
  matchKey1: z.string().optional(),
  matchKey2: z.string().optional(),
  outputVariableId: z.string().optional(),
});

export const jsonJoinBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([LogicBlockType.JSON_JOIN]),
    options: jsonJoinOptionsSchema.optional(),
  }),
);

export type JsonJoinBlock = z.infer<typeof jsonJoinBlockSchema>;
