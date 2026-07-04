/**
 * Service Worker — CORS fix for CDN images.
 *
 * Some CDNs (like SteamGridDB) don't send Access-Control-Allow-Origin
 * headers, which prevents html2canvas from rendering those images on a
 * <canvas>.  This service worker intercepts requests to known CDN
 * domains and adds the missing CORS headers to every response.
 *
 * With this in place both fetch() and <img crossOrigin="anonymous">
 * work correctly for these domains, and html2canvas can render them
 * without needing unreliable third-party CORS proxies.
 */

/** CDN hostnames that need CORS headers injected */
const CORS_FIX_DOMAINS = [
    "cdn2.steamgriddb.com",
    "cdn.steamgriddb.com",
];

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (!CORS_FIX_DOMAINS.includes(url.hostname)) return;

    // Only intercept image requests (not the API itself)
    if (!isImageRequest(event.request, url)) return;

    event.respondWith(
        fetch(event.request).then((response) => {
            // If the server already sent CORS headers, return as-is
            if (response.headers.has("Access-Control-Allow-Origin")) {
                return response;
            }

            // Clone the response and inject the CORS header
            const headers = new Headers(response.headers);
            headers.set("Access-Control-Allow-Origin", "*");
            headers.set("Access-Control-Allow-Methods", "GET");

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        }).catch(() => {
            // Network error — let the browser handle it normally
            return fetch(event.request);
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
