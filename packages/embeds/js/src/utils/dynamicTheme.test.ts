import { describe, expect, it } from "bun:test";
import type { Theme } from "@typebot.io/theme/schemas";
import { mergeThemes } from "./dynamicTheme";

const baseTheme: Theme = {
  chat: {
    contact: {
      businessHours: { timeZone: "UTC", startHour: 9, endHour: 17, days: [1] },
      availableMessage: "Static available",
      unavailableMessage: "Static unavailable",
    },
    header: {
      status: "Online",
      tagline: "Typically replies instantly",
    },
  },
};

describe("mergeThemes", () => {
  it("keeps the static contact messages when no dynamicTheme is provided", () => {
    const merged = mergeThemes(baseTheme, undefined);
    expect(merged.chat?.contact?.availableMessage).toBe("Static available");
    expect(merged.chat?.contact?.unavailableMessage).toBe("Static unavailable");
  });

  it("overrides only the provided contact message", () => {
    const merged = mergeThemes(baseTheme, {
      availableMessage: "Resolved available",
    });
    expect(merged.chat?.contact?.availableMessage).toBe("Resolved available");
    expect(merged.chat?.contact?.unavailableMessage).toBe("Static unavailable");
  });

  it("overrides both contact messages when both are provided", () => {
    const merged = mergeThemes(baseTheme, {
      availableMessage: "Resolved available",
      unavailableMessage: "Resolved unavailable",
    });
    expect(merged.chat?.contact?.availableMessage).toBe("Resolved available");
    expect(merged.chat?.contact?.unavailableMessage).toBe(
      "Resolved unavailable",
    );
  });

  it("does nothing when the initial theme has no contact configured", () => {
    const merged = mergeThemes(
      { chat: {} },
      { availableMessage: "Resolved available" },
    );
    expect(merged.chat?.contact).toBeUndefined();
  });

  it("keeps the static header status/tagline when no dynamicTheme is provided", () => {
    const merged = mergeThemes(baseTheme, undefined);
    expect(merged.chat?.header?.status).toBe("Online");
    expect(merged.chat?.header?.tagline).toBe("Typically replies instantly");
  });

  it("overrides header status and tagline when both are provided", () => {
    const merged = mergeThemes(baseTheme, {
      headerStatus: "En línea",
      headerTagline: "Normalmente responde al instante",
    });
    expect(merged.chat?.header?.status).toBe("En línea");
    expect(merged.chat?.header?.tagline).toBe(
      "Normalmente responde al instante",
    );
  });

  it("overrides only the provided header field", () => {
    const merged = mergeThemes(baseTheme, {
      headerTagline: "Normalmente responde al instante",
    });
    expect(merged.chat?.header?.status).toBe("Online");
    expect(merged.chat?.header?.tagline).toBe(
      "Normalmente responde al instante",
    );
  });

  it("does nothing when the initial theme has no header configured", () => {
    const merged = mergeThemes({ chat: {} }, { headerStatus: "En línea" });
    expect(merged.chat?.header).toBeUndefined();
  });
});
