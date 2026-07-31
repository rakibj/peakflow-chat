import { describe, expect, it } from "bun:test";
import { coerceVariantIds } from "./variantIds";

describe("coerceVariantIds", () => {
  it("keeps plain variant ID strings", () => {
    expect(coerceVariantIds(["gid://shopify/1", "gid://shopify/2"])).toEqual([
      "gid://shopify/1",
      "gid://shopify/2",
    ]);
  });

  it("extracts variantId from object elements", () => {
    expect(
      coerceVariantIds([{ variantId: "gid://1" }, { variantId: "gid://2" }]),
    ).toEqual(["gid://1", "gid://2"]);
  });

  it("falls back to id when variantId is absent", () => {
    expect(coerceVariantIds([{ id: "gid://3" }])).toEqual(["gid://3"]);
  });

  it("prefers variantId over id", () => {
    expect(coerceVariantIds([{ variantId: "gid://v", id: "gid://p" }])).toEqual(
      ["gid://v"],
    );
  });

  it("drops empty strings, nulls, numbers and objects without an id", () => {
    expect(
      coerceVariantIds([
        "gid://keep",
        "",
        null,
        { variantId: "" },
        5,
        { title: "no id" },
      ]),
    ).toEqual(["gid://keep"]);
  });

  it("handles a mixed array of strings and objects", () => {
    expect(coerceVariantIds(["gid://1", { variantId: "gid://2" }])).toEqual([
      "gid://1",
      "gid://2",
    ]);
  });
});
