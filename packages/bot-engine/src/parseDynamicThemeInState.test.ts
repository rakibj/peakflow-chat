import { describe, expect, it } from "bun:test";
import type { Theme } from "@typebot.io/theme/schemas";
import { parseDynamicThemeInState } from "./parseDynamicThemeInState";

const businessHours = { timeZone: "UTC", startHour: 9, endHour: 17, days: [1] };

const makeTheme = (
  contact: Partial<NonNullable<NonNullable<Theme["chat"]>["contact"]>>,
  header?: Partial<NonNullable<NonNullable<Theme["chat"]>["header"]>>,
): Theme => ({
  chat: {
    contact: { businessHours, ...contact },
    header,
  },
});

describe("parseDynamicThemeInState", () => {
  it("returns undefined when no dynamic field is present", () => {
    const theme = makeTheme({
      availableMessage: "We are online",
      unavailableMessage: "We are offline",
    });
    expect(parseDynamicThemeInState(theme)).toBeUndefined();
  });

  it("extracts availableMessage and unavailableMessage when they start with {{", () => {
    const theme = makeTheme({
      availableMessage: "{{availableMessage}}",
      unavailableMessage: "{{unavailableMessage}}",
    });

    const result = parseDynamicThemeInState(theme);

    expect(result?.availableMessage).toBe("{{availableMessage}}");
    expect(result?.unavailableMessage).toBe("{{unavailableMessage}}");
  });

  it("only extracts the dynamic one when only one of the two messages is dynamic", () => {
    const theme = makeTheme({
      availableMessage: "{{availableMessage}}",
      unavailableMessage: "We are offline",
    });

    const result = parseDynamicThemeInState(theme);

    expect(result?.availableMessage).toBe("{{availableMessage}}");
    expect(result?.unavailableMessage).toBeUndefined();
  });

  it("extracts headerStatus and headerTagline when they start with {{", () => {
    const theme = makeTheme(
      { availableMessage: "We are online" },
      { status: "{{headerStatus}}", tagline: "{{headerTagline}}" },
    );

    const result = parseDynamicThemeInState(theme);

    expect(result?.headerStatus).toBe("{{headerStatus}}");
    expect(result?.headerTagline).toBe("{{headerTagline}}");
  });

  it("leaves headerStatus and headerTagline undefined when static", () => {
    const theme = makeTheme(
      { availableMessage: "We are online" },
      { status: "Online", tagline: "Typically replies instantly" },
    );

    expect(parseDynamicThemeInState(theme)).toBeUndefined();
  });
});
