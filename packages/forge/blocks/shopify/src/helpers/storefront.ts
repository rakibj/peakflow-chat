import { ky } from "@typebot.io/lib/ky";
import { defaultApiVersion } from "../constants";

type StorefrontCredentials = {
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion?: string;
  usePrivateToken?: boolean;
};

type StorefrontGraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

// Posts a GraphQL document to the Shopify Storefront API and unwraps `data`.
// Throws when the response contains top-level GraphQL errors or no data.
// `customFetch` is overridable so handlers (and tests) can stub the network.
// A private Storefront token is sent via `Shopify-Storefront-Private-Token`;
// otherwise the classic `X-Shopify-Storefront-Access-Token` header is used.
export const storefrontRequest = async <T>({
  storeDomain,
  storefrontAccessToken,
  apiVersion,
  usePrivateToken,
  query,
  variables,
  customFetch,
}: StorefrontCredentials & {
  query: string;
  variables: Record<string, unknown>;
  customFetch?: typeof globalThis.fetch;
}): Promise<T> => {
  const response = await ky
    .post(
      `https://${storeDomain}/api/${apiVersion ?? defaultApiVersion}/graphql.json`,
      {
        json: { query, variables },
        headers: {
          "Content-Type": "application/json",
          [usePrivateToken
            ? "Shopify-Storefront-Private-Token"
            : "X-Shopify-Storefront-Access-Token"]: storefrontAccessToken,
        },
        fetch: customFetch ?? globalThis.fetch,
      },
    )
    .json<StorefrontGraphQLResponse<T>>();

  if (response.errors && response.errors.length > 0)
    throw new Error(
      `Shopify Storefront API errors: ${response.errors.map((error) => error.message).join("; ")}`,
    );

  if (!response.data)
    throw new Error("Shopify Storefront API returned no data");

  return response.data;
};
