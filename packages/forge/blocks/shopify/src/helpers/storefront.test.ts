import { describe, expect, it } from "bun:test";
import { storefrontRequest } from "./storefront";

const buildFetch = (data: unknown, errors?: { message: string }[]) => {
  const calls: { url: string; body: unknown; headers: Headers }[] = [];
  const fetchMock: typeof fetch = Object.assign(
    async (
      input: Parameters<typeof fetch>[0],
      init: Parameters<typeof fetch>[1],
    ) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      let body: unknown;
      if (typeof init?.body === "string") {
        body = JSON.parse(init.body);
      } else if (input instanceof Request) {
        const text = await input.clone().text();
        body = text ? JSON.parse(text) : undefined;
      }
      calls.push({
        url,
        body,
        headers: new Headers(
          init?.headers ??
            (input instanceof Request ? input.headers : undefined) ??
            {},
        ),
      });
      return new Response(JSON.stringify(errors ? { errors } : { data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
    { preconnect: () => undefined },
  );
  return { fetchMock, calls };
};

const baseArgs = {
  storeDomain: "example.myshopify.com",
  storefrontAccessToken: "shpat_xxx",
  query: "query { products { edges { node { id } } } }",
  variables: { first: 50 },
};

describe("storefrontRequest", () => {
  it("posts to the Storefront GraphQL endpoint", async () => {
    const { fetchMock, calls } = buildFetch({ products: { edges: [] } });
    await storefrontRequest({ ...baseArgs, customFetch: fetchMock });

    expect(calls[0]?.url).toBe(
      "https://example.myshopify.com/api/2025-07/graphql.json",
    );
  });

  it("sends the GraphQL query and variables as the JSON body", async () => {
    const { fetchMock, calls } = buildFetch({ ok: true });
    await storefrontRequest({ ...baseArgs, customFetch: fetchMock });

    expect(calls[0]?.body).toEqual({
      query: baseArgs.query,
      variables: { first: 50 },
    });
  });

  it("honours a custom API version", async () => {
    const { fetchMock, calls } = buildFetch({ ok: true });
    await storefrontRequest({
      ...baseArgs,
      apiVersion: "2024-10",
      customFetch: fetchMock,
    });

    expect(calls[0]?.url).toBe(
      "https://example.myshopify.com/api/2024-10/graphql.json",
    );
  });

  it("returns the unwrapped data", async () => {
    const { fetchMock } = buildFetch({ hello: "world" });
    const data = await storefrontRequest<{ hello: string }>({
      ...baseArgs,
      customFetch: fetchMock,
    });
    expect(data).toEqual({ hello: "world" });
  });

  it("sends the public access-token header by default", async () => {
    const { fetchMock, calls } = buildFetch({ ok: true });
    await storefrontRequest({ ...baseArgs, customFetch: fetchMock });

    expect(calls[0]?.headers.get("X-Shopify-Storefront-Access-Token")).toBe(
      "shpat_xxx",
    );
    expect(
      calls[0]?.headers.get("Shopify-Storefront-Private-Token"),
    ).toBeNull();
  });

  it("sends the private-token header when usePrivateToken is set", async () => {
    const { fetchMock, calls } = buildFetch({ ok: true });
    await storefrontRequest({
      ...baseArgs,
      usePrivateToken: true,
      customFetch: fetchMock,
    });

    expect(calls[0]?.headers.get("Shopify-Storefront-Private-Token")).toBe(
      "shpat_xxx",
    );
    expect(
      calls[0]?.headers.get("X-Shopify-Storefront-Access-Token"),
    ).toBeNull();
  });

  it("throws when the response contains top-level GraphQL errors", async () => {
    const { fetchMock } = buildFetch(undefined, [
      { message: "Invalid access token" },
    ]);
    await expect(
      storefrontRequest({ ...baseArgs, customFetch: fetchMock }),
    ).rejects.toThrow("Invalid access token");
  });
});
