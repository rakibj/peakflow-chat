import { describe, expect, it } from "bun:test";
import {
  type ProductNode,
  type ProductVariant,
  pickLowestPricedVariant,
} from "./products";

const buildProduct = (variants: ProductVariant[]): ProductNode => ({
  title: "Test",
  description: "",
  productType: "",
  handle: "test",
  images: { edges: [] },
  variants: { edges: variants.map((node) => ({ node })) },
});

const variant = (
  id: string,
  amount: string,
  availableForSale = true,
): ProductVariant => ({
  id,
  availableForSale,
  price: { amount, currencyCode: "USD" },
});

describe("pickLowestPricedVariant", () => {
  it("picks the lowest-priced available variant", () => {
    const product = buildProduct([
      variant("v1", "10.00"),
      variant("v2", "5.00"),
    ]);
    expect(pickLowestPricedVariant(product, true)?.id).toBe("v2");
  });

  it("ignores cheaper unavailable variants when an available one exists", () => {
    const product = buildProduct([
      variant("cheap-unavailable", "1.00", false),
      variant("pricy-available", "20.00", true),
    ]);
    expect(pickLowestPricedVariant(product, true)?.id).toBe("pricy-available");
  });

  it("returns undefined when onlyAvailableForSale is true and no variant is available", () => {
    const product = buildProduct([variant("v1", "1.00", false)]);
    expect(pickLowestPricedVariant(product, true)).toBeUndefined();
  });

  it("falls back to any variant when onlyAvailableForSale is false", () => {
    const product = buildProduct([variant("v1", "1.00", false)]);
    expect(pickLowestPricedVariant(product, false)?.id).toBe("v1");
  });

  it("still prefers an available variant when onlyAvailableForSale is false", () => {
    const product = buildProduct([
      variant("unavailable", "1.00", false),
      variant("available", "2.00", true),
    ]);
    expect(pickLowestPricedVariant(product, false)?.id).toBe("available");
  });

  it("returns undefined when the product has no variants", () => {
    const product = buildProduct([]);
    expect(pickLowestPricedVariant(product, true)).toBeUndefined();
  });

  it("compares prices numerically, not lexically", () => {
    const product = buildProduct([
      variant("v1", "9.00"),
      variant("v2", "10.00"),
    ]);
    expect(pickLowestPricedVariant(product, true)?.id).toBe("v1");
  });
});
