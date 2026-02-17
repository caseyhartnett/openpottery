const ALLOWED_HOSTS = new Set([
  "makerworld.com",
  "www.makerworld.com",
  "printables.com",
  "www.printables.com",
]);

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function pickImageUrl(payload) {
  const candidates = [
    payload?.hybridGraph?.image,
    payload?.openGraph?.image,
    payload?.htmlInferred?.image,
    payload?.hybridGraph?.images?.[0],
    payload?.openGraph?.images?.[0],
    payload?.htmlInferred?.images?.[0],
  ];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
    if (item && typeof item.url === "string" && item.url.trim()) {
      return item.url.trim();
    }
    if (Array.isArray(item)) {
      for (const inner of item) {
        if (typeof inner === "string" && inner.trim()) {
          return inner.trim();
        }
        if (inner && typeof inner.url === "string" && inner.url.trim()) {
          return inner.url.trim();
        }
      }
    }
  }

  return "";
}

function buildCacheKey(request) {
  return new Request(request.url, { method: "GET" });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");

  if (!target) {
    return json({ error: "Missing url query parameter" }, 400);
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return json({ error: "Invalid target URL" }, 400);
  }

  if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return json({ error: "Host not allowed" }, 400);
  }

  const appId = env.OPEN_GRAPH_IO_KEY;
  if (!appId) {
    return json({ error: "Server missing OPEN_GRAPH_IO_KEY" }, 500);
  }

  const cache = caches.default;
  const cacheKey = buildCacheKey(request);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const endpoint =
    "https://opengraph.io/api/1.1/site/" + encodeURIComponent(targetUrl.toString()) +
    "?app_id=" + encodeURIComponent(appId) +
    "&use_proxy=true";

  let upstream;
  try {
    upstream = await fetch(endpoint, {
      headers: {
        "Accept": "application/json",
      },
    });
  } catch {
    return json({ error: "Preview provider fetch failed" }, 502);
  }

  if (!upstream.ok) {
    return json({ error: "Preview provider returned an error" }, 502);
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return json({ error: "Invalid preview provider response" }, 502);
  }

  const preview = {
    url: targetUrl.toString(),
    title: pickFirstString(
      payload?.hybridGraph?.title,
      payload?.openGraph?.title,
      payload?.htmlInferred?.title
    ),
    description: pickFirstString(
      payload?.hybridGraph?.description,
      payload?.openGraph?.description,
      payload?.htmlInferred?.description
    ),
    image: pickImageUrl(payload),
  };

  const response = json(preview, 200, {
    "Cache-Control": "public, max-age=0, s-maxage=604800",
  });

  context.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}
