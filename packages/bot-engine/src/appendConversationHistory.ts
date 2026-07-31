import { BubbleBlockType } from "@typebot.io/blocks-bubbles/constants";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import type { InputBlock } from "@typebot.io/blocks-inputs/schema";
import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { convertRichTextToMarkdown } from "@typebot.io/rich-text/convertRichTextToMarkdown";

const MAX_HISTORY_LENGTH = 60;

export const appendConversationHistory = (
  state: SessionState,
  entry: {
    role: "bot" | "human";
    content: string | undefined;
    blockId?: string;
  },
): SessionState => {
  if (!entry.content) return state;
  const conversationHistory = (state.conversationHistory ?? [])
    .concat({
      role: entry.role,
      content: entry.content,
      blockId: entry.blockId,
    })
    .slice(-MAX_HISTORY_LENGTH);
  return { ...state, conversationHistory };
};

export const extractPlainTextFromBubbleMessage = (
  message: ContinueChatResponse["messages"][number],
): string | undefined => {
  switch (message.type) {
    case BubbleBlockType.TEXT:
      return message.content.type === "richText"
        ? convertRichTextToMarkdown(message.content.richText)
        : message.content.markdown;
    case BubbleBlockType.IMAGE:
      return message.content?.url;
    case BubbleBlockType.VIDEO:
      return message.content?.url;
    case BubbleBlockType.AUDIO:
      return message.content?.url;
    case BubbleBlockType.LINK:
      return message.content?.url;
    case BubbleBlockType.EMBED:
      return undefined;
  }
};

export const summarizePresentedInput = (
  block: InputBlock,
  input: ContinueChatResponse["input"],
): string | undefined => {
  if (!input || !("items" in input)) return undefined;
  switch (block.type) {
    case InputBlockType.CHOICE:
    case InputBlockType.CARDS: {
      const labels = input.items
        .map((item) =>
          "content" in item
            ? item.content
            : "title" in item
              ? item.title
              : undefined,
        )
        .filter(
          (label): label is string =>
            typeof label === "string" && label.length > 0,
        );
      return labels.length > 0
        ? `Presented options: ${labels.join(", ")}`
        : undefined;
    }
    default:
      return undefined;
  }
};
