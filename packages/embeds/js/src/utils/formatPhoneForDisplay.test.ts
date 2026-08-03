import { describe, expect, it } from "bun:test";
import { formatPhoneForDisplay } from "./formatPhoneForDisplay";

describe("formatPhoneForDisplay", () => {
  it("formats a US E.164 number for display", () => {
    expect(formatPhoneForDisplay("+19548748383")).toBe("+1 (954) 874-8383");
  });

  it("returns the input unchanged when it doesn't match the expected shape", () => {
    expect(formatPhoneForDisplay("+44123456789")).toBe("+44123456789");
    expect(formatPhoneForDisplay("not a phone")).toBe("not a phone");
  });
});
