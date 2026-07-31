import { createBlock } from "@typebot.io/forge";
import { createCart } from "./actions/createCart";
import { fetchProducts } from "./actions/fetchProducts";
import { auth } from "./auth";
import { ShopifyLogo } from "./logo";

export const shopifyBlock = createBlock({
  id: "shopify",
  name: "Shopify",
  tags: ["ecommerce", "shopify"],
  LightLogo: ShopifyLogo,
  auth,
  actions: [fetchProducts, createCart],
  docsUrl: "https://shopify.dev/docs/api/storefront",
});
