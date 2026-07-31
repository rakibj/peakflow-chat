import { describe, expect, it } from "bun:test";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { SessionStore } from "@typebot.io/runtime-session-store";
import { parseDynamicTheme } from "./parseDynamicTheme";

const makeState = (
  dynamicTheme: SessionState["dynamicTheme"],
  variables: { id: string; name: string; value: unknown }[] = [],
): SessionState =>
  ({
    dynamicTheme,
    typebotsQueue: [
      {
        typebot: {
          variables: variables.map((v) => ({
            ...v,
            isSessionVariable: false,
          })),
        },
      },
    ],
  }) as unknown as SessionState;

describe("parseDynamicTheme", () => {
  it("returns undefined when there is no dynamicTheme in state", () => {
    expect(
      parseDynamicTheme({ state: undefined, sessionStore: new SessionStore() }),
    ).toBeUndefined();
  });

  it("resolves availableMessage and unavailableMessage against session variables", () => {
    const state = makeState(
      {
        availableMessage: "{{availableMessage}}",
        unavailableMessage: "{{unavailableMessage}}",
      },
      [
        {
          id: "v1",
          name: "availableMessage",
          value: "We are online now",
        },
        {
          id: "v2",
          name: "unavailableMessage",
          value: "We are offline",
        },
      ],
    );

    const result = parseDynamicTheme({
      state,
      sessionStore: new SessionStore(),
    });

    expect(result?.availableMessage).toBe("We are online now");
    expect(result?.unavailableMessage).toBe("We are offline");
  });

  it("leaves availableMessage and unavailableMessage undefined when not set", () => {
    const state = makeState({ hostAvatarUrl: "{{avatarUrl}}" });

    const result = parseDynamicTheme({
      state,
      sessionStore: new SessionStore(),
    });

    expect(result?.availableMessage).toBeUndefined();
    expect(result?.unavailableMessage).toBeUndefined();
  });

  it("resolves headerStatus and headerTagline against session variables", () => {
    const state = makeState(
      {
        headerStatus: "{{headerStatus}}",
        headerTagline: "{{headerTagline}}",
      },
      [
        {
          id: "v1",
          name: "headerStatus",
          value: "En línea",
        },
        {
          id: "v2",
          name: "headerTagline",
          value: "Normalmente responde al instante",
        },
      ],
    );

    const result = parseDynamicTheme({
      state,
      sessionStore: new SessionStore(),
    });

    expect(result?.headerStatus).toBe("En línea");
    expect(result?.headerTagline).toBe("Normalmente responde al instante");
  });

  it("leaves headerStatus and headerTagline undefined when not set", () => {
    const state = makeState({ hostAvatarUrl: "{{avatarUrl}}" });

    const result = parseDynamicTheme({
      state,
      sessionStore: new SessionStore(),
    });

    expect(result?.headerStatus).toBeUndefined();
    expect(result?.headerTagline).toBeUndefined();
  });
});
