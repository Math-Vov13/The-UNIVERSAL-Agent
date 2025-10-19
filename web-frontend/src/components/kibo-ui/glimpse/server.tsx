const TITLE_REGEX = /<title[^>]*>([^<]+)<\/title>/;
const OG_TITLE_REGEX = /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/;
const DESCRIPTION_REGEX = /<meta[^>]*name="description"[^>]*content="([^"]+)"/;
const OG_DESCRIPTION_REGEX =
  /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/;
const OG_IMAGE_REGEX = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/;
const OG_URL_IMAGE_REGEX = /<meta[^>]*property="og:image:url"[^>]*content="([^"]+)"/;

export const glimpse = async (url: string) => {
  const params = new URLSearchParams({
    url: url,
    token: process.env.NEXT_PUBLIC_GLIMPSE_TOKEN || "123456789012345678",
    captureTags: "all",
  });
  const response = await fetch(`/proxy/fetch?${params.toString()}`, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'max-age=3600',
    },
  });
  const data = await response.text();
  const titleMatch = data.match(TITLE_REGEX) || data.match(OG_TITLE_REGEX);
  const descriptionMatch =
    data.match(DESCRIPTION_REGEX) || data.match(OG_DESCRIPTION_REGEX);
  const imageMatch = data.match(OG_IMAGE_REGEX) || data.match(OG_URL_IMAGE_REGEX);

  return {
    title: titleMatch?.at(1) ?? null,
    description: descriptionMatch?.at(1) ?? null,
    image: imageMatch?.at(1) ?? null,
  };
};
