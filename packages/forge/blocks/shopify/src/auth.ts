import { createAuth, option } from "@typebot.io/forge";
import { defaultApiVersion } from "./constants";

export const auth = createAuth({
  type: "encryptedCredentials",
  name: "Shopify account",
  schema: option.object({
    storeDomain: option.string.meta({
      layout: {
        label: "Store API domain",
        isRequired: true,
        placeholder: "your-store.myshopify.com",
        helperText:
          "The *.myshopify.com domain used for Storefront API calls (no protocol).",
        withVariableButton: false,
        isDebounceDisabled: true,
      },
    }),
    storefrontAccessToken: option.string.meta({
      layout: {
        label: "Storefront access token",
        isRequired: true,
        inputType: "password",
        helperText:
          "Create a Storefront API access token in your Shopify admin under Apps → Headless (or Apps → Sales channels).",
        withVariableButton: false,
        isDebounceDisabled: true,
      },
    }),
    usePrivateToken: option.boolean.meta({
      layout: {
        label: "Use private access token",
        defaultValue: false,
        helperText:
          "Enable for a private Storefront token (shpat_…). Sends the Shopify-Storefront-Private-Token header instead of X-Shopify-Storefront-Access-Token.",
        isDebounceDisabled: true,
      },
    }),
    storeUrl: option.string.meta({
      layout: {
        label: "Storefront URL",
        isRequired: true,
        placeholder: "https://your-store.com",
        helperText:
          "Public storefront URL used to build product links. Can differ from the API domain.",
        withVariableButton: false,
        isDebounceDisabled: true,
      },
    }),
    apiVersion: option.string.meta({
      layout: {
        label: "API version",
        defaultValue: defaultApiVersion,
        helperText:
          "Shopify Storefront API version, e.g. 2025-07. Leave blank to use the pinned default.",
        withVariableButton: false,
        isDebounceDisabled: true,
      },
    }),
  }),
});
