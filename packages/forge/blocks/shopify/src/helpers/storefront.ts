import { ky } from "@typebot.io/lib/ky";
import { defaultApiVersion } from "../constants";

type ShopifyGraphqlCredentials = {
  storeDomain: string;
  apiType?: "storefront" | "admin";
  storefrontAccessToken?: string;
  usePrivateToken?: boolean;
  adminAccessToken?: string;
  apiVersion?: string;
};

type StorefrontGraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

// Posts a GraphQL document to the Shopify Storefront or Admin API and unwraps `data`.
// Throws when the response contains top-level GraphQL errors or no data.
// `customFetch` is overridable so handlers (and tests) can stub the network.
// Admin API (`apiType: "admin"`) sends `X-Shopify-Access-Token` against `/admin/api/...`.
// Storefront API sends a private token via `Shopify-Storefront-Private-Token`,
// otherwise the classic `X-Shopify-Storefront-Access-Token`, against `/api/...`.
export const shopifyGraphqlRequest = async <T>({
  storeDomain,
  apiType,
  storefrontAccessToken,
  usePrivateToken,
  adminAccessToken,
  apiVersion,
  query,
  variables,
  customFetch,
}: ShopifyGraphqlCredentials & {
  query: string;
  variables: Record<string, unknown>;
  customFetch?: typeof globalThis.fetch;
}): Promise<T> => {
  const isAdmin = apiType === "admin";
  const endpoint = isAdmin
    ? `https://${storeDomain}/admin/api/${apiVersion ?? defaultApiVersion}/graphql.json`
    : `https://${storeDomain}/api/${apiVersion ?? defaultApiVersion}/graphql.json`;
  const authHeader = isAdmin
    ? { "X-Shopify-Access-Token": adminAccessToken ?? "" }
    : {
        [usePrivateToken
          ? "Shopify-Storefront-Private-Token"
          : "X-Shopify-Storefront-Access-Token"]: storefrontAccessToken ?? "",
      };

  const response = await ky
    .post(endpoint, {
      json: { query, variables },
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      fetch: customFetch ?? globalThis.fetch,
    })
    .json<StorefrontGraphQLResponse<T>>();

  if (response.errors && response.errors.length > 0)
    throw new Error(
      `Shopify API errors: ${response.errors.map((error) => error.message).join("; ")}`,
    );

  if (!response.data) throw new Error("Shopify API returned no data");

  return response.data;
};
