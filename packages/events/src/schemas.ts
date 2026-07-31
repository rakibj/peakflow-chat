import { z } from "zod";
import { EventType } from "./constants";

const eventBaseSchema = z.object({
  id: z.string(),
  outgoingEdgeId: z.string().optional(),
  graphCoordinates: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const startEventSchema = eventBaseSchema.extend({
  type: z.literal(EventType.START),
});
export type StartEvent = z.infer<typeof startEventSchema>;

export const commandEventSchema = eventBaseSchema.extend({
  type: z.literal(EventType.COMMAND),
  options: z
    .object({
      command: z.string().optional(),
      // TODO: remove and use Return block instead.
      resumeAfter: z.boolean().optional(),
    })
    .optional(),
});
export type CommandEvent = z.infer<typeof commandEventSchema>;

const replyEventOptionsSchema = z.object({
  contentVariableId: z.string().optional(),
  inputNameVariableId: z.string().optional(),
  inputTypeVariableId: z.string().optional(),
});

export const replyEventSchema = eventBaseSchema.extend({
  type: z.literal(EventType.REPLY),
  options: replyEventOptionsSchema.optional(),
});
export type ReplyEvent = z.infer<typeof replyEventSchema>;

export const invalidReplyEventSchema = eventBaseSchema.extend({
  type: z.literal(EventType.INVALID_REPLY),
  options: replyEventOptionsSchema.optional(),
});
export type InvalidReplyEvent = z.infer<typeof invalidReplyEventSchema>;

export const interruptionEventSchema = eventBaseSchema.extend({
  type: z.literal(EventType.INTERRUPTION),
  options: z
    .object({
      isEnabled: z.boolean().optional(),
      provider: z.string().optional(),
      credentialsId: z.string().optional(),
      model: z.string().optional(),
      instructions: z.string().optional(),
      historyWindow: z.number().optional(),
      locationVariableId: z.string().optional(),
      languageVariableId: z.string().optional(),
      supportedLanguages: z.array(z.string()).optional(),
    })
    .optional(),
});
export type InterruptionEvent = z.infer<typeof interruptionEventSchema>;

const draggableEventSchemas = [
  commandEventSchema,
  replyEventSchema,
  invalidReplyEventSchema,
  interruptionEventSchema,
] as const;

export const eventSchema = z.discriminatedUnion("type", [
  startEventSchema,
  ...draggableEventSchemas,
]);

export type TEvent = z.infer<typeof eventSchema>;

export type TEventWithOptions = Extract<TEvent, { options?: any }>;

export const draggableEventSchema = z.discriminatedUnion("type", [
  ...draggableEventSchemas,
]);

export type TDraggableEvent = z.infer<typeof draggableEventSchema>;
