import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "zod";
import { BubbleBlockType } from "../constants";

export const linkPreviewDataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  siteName: z.string().optional(),
  favicon: z.string().optional(),
});

export const linkBubbleContentSchema = z.object({
  url: z.string().optional(),
  label: z.string().optional(),
  openInNewTab: z.boolean().optional(),
  showPreview: z.boolean().optional(),
  previewFallbackUrl: z.string().optional(),
  previewTitle: z.string().optional(),
  previewData: linkPreviewDataSchema.optional(),
});

export type LinkPreviewData = z.infer<typeof linkPreviewDataSchema>;

export const linkBubbleBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([BubbleBlockType.LINK]),
    content: linkBubbleContentSchema.optional(),
  }),
);

export type LinkBubbleBlock = z.infer<typeof linkBubbleBlockSchema>;
export type LinkBubbleContent = z.infer<typeof linkBubbleContentSchema>;
