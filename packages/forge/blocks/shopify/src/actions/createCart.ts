import { createAction, option } from "@typebot.io/forge";
import { isDefined } from "@typebot.io/lib/utils";
import { auth } from "../auth";

export const createCart = createAction({
  auth,
  name: "Create cart",
  options: option.object({
    variantIdsVariableId: option.string.meta({
      layout: {
        label: "Variant IDs",
        inputType: "variableDropdown",
        helperText:
          "Variable holding a JSON array of Shopify variant ID strings.",
      },
    }),
    responseMapping: option
      .saveResponseArray(["Cart ID", "Checkout URL"] as const)
      .meta({ layout: { accordion: "Save response" } }),
  }),
  getSetVariableIds: ({ responseMapping }) =>
    responseMapping?.map((mapping) => mapping.variableId).filter(isDefined) ??
    [],
});
