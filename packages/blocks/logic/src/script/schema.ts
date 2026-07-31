import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "zod";
import { LogicBlockType } from "../constants";

export const scriptOptionsSchema = z.object({
  name: z.string().optional(),
  content: z.string().optional(),
  isExecutedOnClient: z.boolean().optional(),
  isUnsafe: z
    .boolean()
    .optional()
    .describe(
      "Enabled by default for imported bots to prevent code to be executed in preview with priviledged access",
    ),
  shouldExecuteInParentContext: z.boolean().optional(),
  credentialsId: z
    .string()
    .optional()
    .describe(
      "References an `apiCredentials` row. Only used for server-side execution — secrets are decrypted at runtime and injected as `credentials`, never stored in `content`.",
    ),
});

export const scriptBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([LogicBlockType.SCRIPT]),
    options: scriptOptionsSchema.optional(),
  }),
);

export type ScriptBlock = z.infer<typeof scriptBlockSchema>;
