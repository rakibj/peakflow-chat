import { describe, expect, it } from "bun:test";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import type { InputBlock } from "@typebot.io/blocks-inputs/schema";
import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import {
  appendConversationHistory,
  extractPlainTextFromBubbleMessage,
  summarizePresentedInput,
} from "./appendConversationHistory";

const makeState = (
  conversationHistory?: SessionState["conversationHistory"],
): SessionState => ({ conversationHistory }) as unknown as SessionState;

describe("appendConversationHistory", () => {
  it("appends a new entry to an empty history", () => {
    const state = makeState(undefined);
    const newState = appendConversationHistory(state, {
      role: "bot",
      content: "Hi there!",
      blockId: "b1",
    });
    expect(newState.conversationHistory).toEqual([
      { role: "bot", content: "Hi there!", blockId: "b1" },
    ]);
  });

  it("is a no-op when content is undefined or empty", () => {
    const state = makeState([{ role: "bot", content: "existing" }]);
    const newState = appendConversationHistory(state, {
      role: "human",
      content: undefined,
    });
    expect(newState).toBe(state);
    const newState2 = appendConversationHistory(state, {
      role: "human",
      content: "",
    });
    expect(newState2).toBe(state);
  });

  it("caps the history to the last 60 entries", () => {
    const existing = Array.from({ length: 60 }, (_, i) => ({
      role: "bot" as const,
      content: `msg-${i}`,
    }));
    const state = makeState(existing);
    const newState = appendConversationHistory(state, {
      role: "human",
      content: "latest",
    });
    expect(newState.conversationHistory).toHaveLength(60);
    expect(newState.conversationHistory?.at(0)?.content).toBe("msg-1");
    expect(newState.conversationHistory?.at(-1)?.content).toBe("latest");
  });
});

describe("extractPlainTextFromBubbleMessage", () => {
  it("extracts markdown from a markdown text message", () => {
    const message = {
      id: "b1",
      type: "text",
      content: { type: "markdown", markdown: "Hello **world**" },
    } as unknown as ContinueChatResponse["messages"][number];
    expect(extractPlainTextFromBubbleMessage(message)).toBe("Hello **world**");
  });

  it("extracts a url from an image message", () => {
    const message = {
      id: "b1",
      type: "image",
      content: { url: "https://example.com/pic.png" },
    } as unknown as ContinueChatResponse["messages"][number];
    expect(extractPlainTextFromBubbleMessage(message)).toBe(
      "https://example.com/pic.png",
    );
  });

  it("returns undefined for an embed message", () => {
    const message = {
      id: "b1",
      type: "embed",
      content: {},
    } as unknown as ContinueChatResponse["messages"][number];
    expect(extractPlainTextFromBubbleMessage(message)).toBeUndefined();
  });
});

describe("summarizePresentedInput", () => {
  it("joins choice item labels", () => {
    const block = {
      id: "b1",
      type: InputBlockType.CHOICE,
    } as InputBlock;
    const input = {
      id: "b1",
      items: [
        { id: "i1", content: "Yes" },
        { id: "i2", content: "No" },
      ],
    } as unknown as ContinueChatResponse["input"];
    expect(summarizePresentedInput(block, input)).toBe(
      "Presented options: Yes, No",
    );
  });

  it("joins card item titles", () => {
    const block = {
      id: "b1",
      type: InputBlockType.CARDS,
    } as InputBlock;
    const input = {
      id: "b1",
      items: [{ id: "i1", title: "Rose bouquet" }],
    } as unknown as ContinueChatResponse["input"];
    expect(summarizePresentedInput(block, input)).toBe(
      "Presented options: Rose bouquet",
    );
  });

  it("returns undefined for a text input", () => {
    const block = { id: "b1", type: InputBlockType.TEXT } as InputBlock;
    const input = { id: "b1" } as unknown as ContinueChatResponse["input"];
    expect(summarizePresentedInput(block, input)).toBeUndefined();
  });
});
