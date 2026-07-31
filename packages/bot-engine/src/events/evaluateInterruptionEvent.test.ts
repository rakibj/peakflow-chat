import { describe, expect, it } from "bun:test";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { EventType } from "@typebot.io/events/constants";
import { evaluateInterruptionEvent } from "./evaluateInterruptionEvent";

const makeState = (
  events: SessionState["typebotsQueue"][0]["typebot"]["events"],
  conversationHistory: SessionState["conversationHistory"] = [
    { role: "human", content: "I want to speak to someone" },
  ],
): SessionState =>
  ({
    workspaceId: "workspace1",
    conversationHistory,
    typebotsQueue: [{ typebot: { events } }],
  }) as unknown as SessionState;

describe("evaluateInterruptionEvent - gating", () => {
  it("returns false with no log when there is no interruption event", async () => {
    const state = makeState([{ id: "e1", type: EventType.START } as any]);
    expect(await evaluateInterruptionEvent(state)).toEqual({
      shouldInterrupt: false,
    });
  });

  it("returns false with no log when the event is disabled", async () => {
    const state = makeState([
      {
        id: "e1",
        type: EventType.INTERRUPTION,
        options: {
          isEnabled: false,
          provider: "open-router",
          credentialsId: "c1",
          model: "gpt-5",
        },
      } as any,
    ]);
    expect(await evaluateInterruptionEvent(state)).toEqual({
      shouldInterrupt: false,
    });
  });

  it("returns false with a log when the event has no outgoing edge", async () => {
    const state = makeState([
      {
        id: "e1",
        type: EventType.INTERRUPTION,
        options: {
          isEnabled: true,
          provider: "open-router",
          credentialsId: "c1",
          model: "gpt-5",
        },
      } as any,
    ]);
    const result = await evaluateInterruptionEvent(state);
    expect(result.shouldInterrupt).toBe(false);
    expect(result.log?.description).toContain("no outgoing edge");
  });

  it("falls back to the default provider/credentials/model when unset, and skips once those default credentials can't be found in this workspace", async () => {
    const state = makeState([
      {
        id: "e1",
        type: EventType.INTERRUPTION,
        outgoingEdgeId: "edge1",
        options: {
          isEnabled: true,
        },
      } as any,
    ]);
    const result = await evaluateInterruptionEvent(state);
    expect(result.shouldInterrupt).toBe(false);
    expect(result.log?.description).toContain(
      "could not find the selected credentials",
    );
  });

  it("returns false with a log when conversation history is empty", async () => {
    const state = makeState(
      [
        {
          id: "e1",
          type: EventType.INTERRUPTION,
          outgoingEdgeId: "edge1",
          options: {
            isEnabled: true,
            provider: "open-router",
            credentialsId: "c1",
            model: "gpt-5",
          },
        } as any,
      ],
      [],
    );
    const result = await evaluateInterruptionEvent(state);
    expect(result.shouldInterrupt).toBe(false);
    expect(result.log?.description).toContain("no conversation history");
  });
});
