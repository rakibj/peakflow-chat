import {
  blockBaseSchema,
  itemBaseSchemas,
  optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { conditionSchema } from "@typebot.io/conditions/schemas";
import { z } from "zod";
import { InputBlockType } from "../constants";
import { cardMappableFields } from "./constants";

const cardsOptionsSchema = optionBaseSchema.extend({
  saveResponseMapping: z
    .array(
      z.object({
        field: z.enum(cardMappableFields).optional(),
        variableId: z.string().optional(),
      }),
    )
    .optional(),
  dynamicItems: z
    .object({
      imageUrlVariableId: z.string().optional(),
      titleVariableId: z.string().optional(),
      descriptionVariableId: z.string().optional(),
      extraDescriptionVariableIds: z.array(z.string()).optional(),
      buttonVariableId: z.string().optional(),
      extraButtons: z
        .array(
          z.object({
            variableId: z.string().optional(),
            type: z.enum(["player-choice", "link"]).optional(),
            text: z.string().optional(),
          }),
        )
        .optional(),
      internalValueVariableId: z.string().optional(),
    })
    .optional(),
  freeTextInput: z
    .object({
      enabled: z.boolean().default(false),
      placeholder: z.string().optional(),
      variableId: z.string().optional(),
    })
    .optional(),
  cardClickedOutgoingEdgeId: z.string().optional(),
  freeTextOutgoingEdgeId: z.string().optional(),
  skipButton: z
    .object({
      enabled: z.boolean().default(false),
      label: z.string().optional(),
      outgoingEdgeId: z.string().optional(),
    })
    .optional(),
  jsonArraySource: z
    .object({
      variableId: z.string().optional(),
      imageUrlKey: z.string().optional(),
      titleKey: z.string().optional(),
      descriptionKey: z.string().optional(),
      extraDescriptionKeys: z.array(z.string()).optional(),
      buttonKey: z.string().optional(),
      internalValueKey: z.string().optional(),
      extraButtons: z
        .array(
          z.object({
            key: z.string().optional(),
            type: z.enum(["player-choice", "link"]).optional(),
            text: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const cardsItemPathSchema = z.object({
  id: z.string(),
  text: z.string().optional(),
  outgoingEdgeId: z.string().optional(),
  type: z.enum(["player-choice", "link"]).optional(),
  linkUrl: z.string().optional(),
});
export type CardsItemPath = z.infer<typeof cardsItemPathSchema>;

export const cardsItemSchema = itemBaseSchemas.v6.extend({
  options: z
    .object({
      displayCondition: z
        .object({
          isEnabled: z.boolean().optional(),
          condition: conditionSchema.optional(),
        })
        .optional(),
      internalValue: z.string().nullish(),
    })
    .optional(),
  imageUrl: z.string().nullish(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  extraDescriptions: z.array(z.string()).optional(),
  paths: z.array(cardsItemPathSchema).optional(),
});
export type CardsItem = z.infer<typeof cardsItemSchema>;

export const cardsBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.literal(InputBlockType.CARDS),
    items: z.array(cardsItemSchema),
    options: cardsOptionsSchema.optional(),
  }),
);
export type CardsBlock = z.infer<typeof cardsBlockSchema>;
