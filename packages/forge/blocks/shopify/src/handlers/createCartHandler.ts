import { createActionHandler } from "@typebot.io/forge";
import { parseJsonArrayInput } from "@typebot.io/lib/parseJsonArray";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import { createCart } from "../actions/createCart";
import { shopifyGraphqlRequest } from "../helpers/storefront";
import { coerceVariantIds } from "../helpers/variantIds";

type CartCreateData = {
  cartCreate: {
    cart: { id: string; checkoutUrl: string } | null;
    userErrors: {
      field: string[] | null;
      message: string;
      code: string;
    }[];
  };
};

const CART_CREATE_MUTATION = `
  mutation CreateCart($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { id checkoutUrl }
      userErrors { field message code }
    }
  }
`;

export const createCartHandler = createActionHandler(createCart, {
  server: async ({
    credentials: {
      storeDomain,
      apiType,
      storefrontAccessToken,
      adminAccessToken,
      apiVersion,
      usePrivateToken,
    },
    options: { variantIdsVariableId, responseMapping },
    variables,
    logs,
  }) => {
    const isAdmin = apiType === "admin";
    if (!storeDomain || (isAdmin ? !adminAccessToken : !storefrontAccessToken))
      return logs.add(
        isAdmin
          ? "Store domain and Admin API access token are required"
          : "Store domain and Storefront access token are required",
      );
    if (!variantIdsVariableId)
      return logs.add("A variable holding variant IDs is required");

    const parsedArray = parseJsonArrayInput(
      variables.get(variantIdsVariableId),
    );
    if (!parsedArray || parsedArray.length === 0)
      return logs.add(
        "The variant IDs variable does not contain a JSON array of IDs",
      );

    const variantIds = coerceVariantIds(parsedArray);
    if (variantIds.length === 0)
      return logs.add("No valid variant IDs were found in the variable");

    try {
      const data = await shopifyGraphqlRequest<CartCreateData>({
        storeDomain,
        apiType,
        storefrontAccessToken,
        adminAccessToken,
        apiVersion,
        usePrivateToken,
        query: CART_CREATE_MUTATION,
        variables: {
          lines: variantIds.map((id) => ({ merchandiseId: id, quantity: 1 })),
        },
      });

      if (data.cartCreate.userErrors.length > 0) {
        for (const error of data.cartCreate.userErrors)
          logs.add(`${error.field?.join(".") ?? "cart"}: ${error.message}`);
        return;
      }

      const cart = data.cartCreate.cart;
      if (!cart) return logs.add("Cart creation returned no cart");

      responseMapping?.forEach((mapping) => {
        if (!mapping.item || !mapping.variableId) return;
        if (mapping.item === "Cart ID")
          variables.set([{ id: mapping.variableId, value: cart.id }]);
        if (mapping.item === "Checkout URL")
          variables.set([{ id: mapping.variableId, value: cart.checkoutUrl }]);
      });
    } catch (error) {
      logs.add(
        await parseUnknownError({
          err: error,
          context: "While creating Shopify cart",
        }),
      );
    }
  },
});
