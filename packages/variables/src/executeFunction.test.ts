import { SessionStore } from "@typebot.io/runtime-session-store";
import { afterEach, describe, expect, it } from "vitest";
import { executeFunction } from "./executeFunction";

describe("executeFunction", () => {
  let sessionStore: SessionStore;

  afterEach(() => {
    sessionStore?.dispose();
  });

  it("exposes injected credentials as a global `credentials` object", async () => {
    sessionStore = new SessionStore();
    const { output, error } = await executeFunction({
      variables: [],
      body: "return credentials.SHOPIFY_TOKEN;",
      sessionStore,
      credentials: { SHOPIFY_TOKEN: "shpat_abc123" },
    });

    expect(error).toBeUndefined();
    expect(output).toBe("shpat_abc123");
  });

  it("does not expose a `credentials` global when none are provided", async () => {
    sessionStore = new SessionStore();
    const { output } = await executeFunction({
      variables: [],
      body: "return typeof credentials;",
      sessionStore,
    });

    expect(output).toBe("undefined");
  });
});
