import type { LinkPreviewData } from "@typebot.io/blocks-bubbles/link/schema";

const getMetaProperty = (html: string, property: string): string | undefined =>
  (html.match(
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  ) ??
    html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
        "i",
      ),
    ))?.[1];

const getMetaName = (html: string, name: string): string | undefined =>
  (html.match(
    new RegExp(
      `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  ) ??
    html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
        "i",
      ),
    ))?.[1];

const getPageTitle = (html: string): string | undefined =>
  html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();

const getFaviconUrl = (html: string, origin: string): string => {
  const href = (html.match(
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
  ) ??
    html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    ))?.[1];
  if (!href) return `${origin}/favicon.ico`;
  if (href.startsWith("http")) return href;
  return `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
};

const minimalPreview = (url: string): LinkPreviewData => {
  const { hostname, origin } = new URL(url);
  return { siteName: hostname, favicon: `${origin}/favicon.ico` };
};

const isRich = (data: LinkPreviewData): boolean =>
  !!(data.title ?? data.description ?? data.image);

const fetchFromUrl = async (
  url: string,
  signal: AbortSignal,
): Promise<LinkPreviewData> => {
  try {
    const response = await fetch(url, {
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Peakflow/1.0; bot) AppleWebKit/537.36",
      },
    });
    const html = await response.text();
    const { origin, hostname } = new URL(url);
    return {
      title: getMetaProperty(html, "og:title") ?? getPageTitle(html),
      description:
        getMetaProperty(html, "og:description") ??
        getMetaName(html, "description"),
      image: getMetaProperty(html, "og:image"),
      siteName: getMetaProperty(html, "og:site_name") ?? hostname,
      favicon: getFaviconUrl(html, origin),
    };
  } catch {
    return minimalPreview(url);
  }
};

export const fetchOgPreview = async (
  url: string,
  fallbackUrl?: string,
): Promise<LinkPreviewData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const data = await fetchFromUrl(url, controller.signal);
    if (!isRich(data) && fallbackUrl) {
      const fallbackData = await fetchFromUrl(fallbackUrl, controller.signal);
      if (isRich(fallbackData)) return fallbackData;
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};
