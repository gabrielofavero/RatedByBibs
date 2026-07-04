/**
 * Service Worker — CORS fix for CDN images.
 *
 * Some CDNs (like SteamGridDB) don't send Access-Control-Allow-Origin
 * headers, which prevents html2canvas from rendering those images on a
 * <canvas>.  This service worker intercepts CORS-mode requests to known
 * CDN domains and adds the missing headers.
 *
 * IMPORTANT: We only intercept requests with mode "cors" (from
 * crossOrigin="anonymous" images or fetch() calls).  Regular <img> tags
 * use mode "no-cors" — we let those pass through because we cannot
 * read opaque responses to add headers.
 *
 * For the actual image→dataURL conversion, the canvas module races
 * several image proxies (weserv.nl, wsrv.nl, etc.).  This SW is a
 * secondary fallback for direct CDN requests that slip through.
 */

/** CDN hostnames that need CORS headers injected */
const CORS_FIX_DOMAINS = [
    "cdn2.steamgriddb.com",
    "cdn.steamgriddb.com",
];

/**
 * Proxy hostnames that should NEVER be intercepted — the canvas code
 * handles these via its own proxy-race logic (raceProxies).
 */
const PROXY_HOSTNAMES = [
    "images.weserv.nl",
    "wsrv.nl",
    "corsproxy.io",
    "api.allorigins.win",
    "cors-anywhere.herokuapp.com",
    "cors.bridged.cc",
];

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Never intercept requests to proxy services — the canvas code
    // handles those itself.
    if (PROXY_HOSTNAMES.includes(url.hostname)) return;

    if (!CORS_FIX_DOMAINS.includes(url.hostname)) return;
    if (!isImageRequest(event.request, url)) return;

    // Only intercept CORS-mode requests (crossOrigin / fetch).
    // Regular <img> tags use "no-cors" — we let those through
    // because opaque responses can't be modified.
    if (event.request.mode !== "cors") return;

    event.respondWith(
        fetch(event.request.url)
            .then((response) => {
                if (response.headers.has("Access-Control-Allow-Origin")) {
                    return response;
                }

                const headers = new Headers(response.headers);
                headers.set("Access-Control-Allow-Origin", "*");

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers,
                });
            })
            .catch((err) => {
                // The CDN is unreachable — don't retry (the fallback
                // fetch would fail identically and spam the console).
                console.debug(`[SW] CDN fetch failed for ${url.hostname}: ${err.message}`);
                return new Response("", { status: 502, statusText: "Bad Gateway" });
            })
    );
});

/**
 * Heuristic: treat the request as an image if either (a) the URL path
 * ends with a common image extension, or (b) the request's Accept
 * header asks for an image MIME type.
 */
function isImageRequest(request, url) {
    const imageExtensions = /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)(\?|$)/i;
    if (imageExtensions.test(url.pathname)) return true;

    const accept = request.headers.get("Accept") || "";
    if (/image\//.test(accept)) return true;

    return false;
}
