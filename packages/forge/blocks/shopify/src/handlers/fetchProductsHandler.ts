import { createActionHandler } from "@typebot.io/forge";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import { fetchProducts } from "../actions/fetchProducts";
import { productsPageSize } from "../constants";
import {
  PRODUCTS_QUERY,
  type ProductNode,
  pickLowestPricedVariant,
} from "../helpers/products";
import { storefrontRequest } from "../helpers/storefront";

type ProductsQueryData = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { node: ProductNode }[];
  };
};

type ProductOutput = {
  title: string;
  price: string;
  productType: string;
  url: string;
  description: string;
  image: string | null;
  variantId: string;
};

export const fetchProductsHandler = createActionHandler(fetchProducts, {
  server: async ({
    credentials: {
      storeDomain,
      storefrontAccessToken,
      storeUrl,
      apiVersion,
      usePrivateToken,
    },
    options: {
      productType,
      maxProducts,
      onlyAvailableForSale,
      outputVariableId,
    },
    variables,
    logs,
  }) => {
    if (!storeDomain || !storefrontAccessToken)
      return logs.add("Store domain and Storefront access token are required");
    if (!outputVariableId)
      return logs.add("An output variable is required to save the products");

    const onlyAvailable = onlyAvailableForSale ?? true;
    const cap =
      typeof maxProducts === "number" && maxProducts > 0
        ? maxProducts
        : undefined;
    const storeBaseUrl = (storeUrl ?? `https://${storeDomain}`).replace(
      /\/$/,
      "",
    );

    try {
      const products: ProductOutput[] = [];
      let cursor: string | null = null;
      let hasNextPage = true;

      while (hasNextPage) {
        const data: ProductsQueryData = await storefrontRequest({
          storeDomain,
          storefrontAccessToken,
          apiVersion,
          usePrivateToken,
          query: PRODUCTS_QUERY,
          variables: {
            first: cap
              ? Math.min(productsPageSize, cap - products.length)
              : productsPageSize,
            after: cursor,
            query: productType
              ? `product_type:${JSON.stringify(productType)}`
              : null,
          },
        });

        for (const edge of data.products.edges) {
          const product = edge.node;
          const variant = pickLowestPricedVariant(product, onlyAvailable);
          if (!variant) continue;
          products.push({
            title: product.title,
            price: variant.price.amount,
            productType: product.productType,
            url: `${storeBaseUrl}/products/${product.handle}`,
            description: product.description,
            image: product.images.edges[0]?.node.url ?? null,
            variantId: variant.id,
          });
          if (cap && products.length >= cap) break;
        }

        hasNextPage =
          data.products.pageInfo.hasNextPage && (!cap || products.length < cap);
        cursor = data.products.pageInfo.endCursor;
      }

      variables.set([
        { id: outputVariableId, value: JSON.stringify(products) },
      ]);
    } catch (error) {
      logs.add(
        await parseUnknownError({
          err: error,
          context: "While fetching Shopify products",
        }),
      );
    }
  },
});
