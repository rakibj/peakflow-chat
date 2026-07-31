export type ProductVariant = {
  id: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
};

export type ProductNode = {
  title: string;
  description: string;
  productType: string;
  handle: string;
  images: { edges: { node: { url: string } }[] };
  variants: { edges: { node: ProductVariant }[] };
};

export const PRODUCTS_QUERY = `
  query FetchProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          title
          description
          productType
          handle
          images(first: 1) { edges { node { url } } }
          variants(first: 50) {
            edges {
              node {
                id
                availableForSale
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
  }
`;

// Picks the lowest-priced variant for a product. Available variants are always
// preferred; when none are available, the product is skipped unless
// `onlyAvailableForSale` is false (then any variant is considered).
export const pickLowestPricedVariant = (
  product: ProductNode,
  onlyAvailableForSale: boolean,
): ProductVariant | undefined => {
  const variants = product.variants.edges.map((edge) => edge.node);
  if (variants.length === 0) return undefined;
  const available = variants.filter((variant) => variant.availableForSale);
  const pool =
    available.length > 0 ? available : onlyAvailableForSale ? [] : variants;
  if (pool.length === 0) return undefined;
  return pool.reduce((lowest, variant) =>
    Number(variant.price.amount) < Number(lowest.price.amount)
      ? variant
      : lowest,
  );
};
