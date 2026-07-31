import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

export const fetchProducts = createAction({
  auth,
  name: "Fetch products",
  options: option.object({
    productType: option.string.meta({
      layout: {
        label: "Product type",
        helperText:
          'Optional. Filters products by their Shopify product type (e.g. "Shirts").',
      },
    }),
    maxProducts: option.number.meta({
      layout: {
        label: "Max products",
        helperText: "Optional cap on the number of products returned.",
      },
    }),
    onlyAvailableForSale: option.boolean.meta({
      layout: {
        label: "Only available for sale",
        defaultValue: true,
        helperText:
          "When on, products without any in-stock variant are skipped.",
      },
    }),
    outputVariableId: option.string.meta({
      layout: {
        label: "Save products to",
        inputType: "variableDropdown",
      },
    }),
  }),
  getSetVariableIds: ({ outputVariableId }) =>
    outputVariableId ? [outputVariableId] : [],
});
