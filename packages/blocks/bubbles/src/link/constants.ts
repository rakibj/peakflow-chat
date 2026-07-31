import type { LinkBubbleBlock } from "./schema";

export const defaultLinkBubbleContent = {
  openInNewTab: true,
} as const satisfies LinkBubbleBlock["content"];
