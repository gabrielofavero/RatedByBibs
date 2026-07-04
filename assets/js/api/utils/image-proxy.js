/**
 * Image proxy helper.
 *
 * Converts an external image URL into a data: URL so it can be used as
 * the COVER value in step-3 without CORS issues during canvas rendering.
 *
 * Falls back to the original URL if the conversion fails quickly so the
 * step-3 preview never hangs — canvas generation will retry conversion
 * later with a longer timeout.
 */

/**
 * Fetch an external image and return it as a data: URL.
 * Falls back to the raw URL if all conversion attempts fail
 * (<img> tags can display cross-origin URLs without CORS).
 *
 * @param {string} imageUrl - External URL of the image
 * @returns {Promise<string>} - data: URL, or the raw URL as fallback
 */
export async function fetchImageAsDataURL(imageUrl) {
    // Attempt 1 — direct fetch (works when the server sends CORS headers,
    // or when the service worker injects them for known CDN domains)
    try {
        const res = await fetch(imageUrl, { mode: "cors" });
        if (res.ok) {
            const blob = await res.blob();
            console.debug("[ImageProxy] Direct fetch → OK");
            return await blobToDataURL(blob);
        }
    } catch { /* fall through */ }

    // Attempt 2 — <img> + <canvas> (works with CORS headers; SW enables this)
    try {
        const dataUrl = await imgToDataURL(imageUrl);
        console.debug("[ImageProxy] img+canvas → OK");
        return dataUrl;
    } catch { /* fall through */ }

    // Attempt 3 — race all proxies (image proxies first, general CORS last).
    // Use a short timeout so the step-3 spinner doesn't hang.
    const dataUrl = await raceProxies(imageUrl, 8_000);
    if (dataUrl) return dataUrl;

    // All attempts failed — return the raw URL.
    // <img> tags can display cross-origin images without CORS, so the
    // step-3 preview still works.  Canvas generation will retry later.
    console.debug("[ImageProxy] All attempts failed, using raw URL");
    return imageUrl;
}

// ---------------------------------------------------------------------------
// Proxy racing
// ---------------------------------------------------------------------------

/** @type {Array<{name: string, build: (url: string) => string}>} */
const CORS_PROXIES = [
    // No proxies configured at selection time.
    // SteamGridDB CORS proxying is handled at render time by canvas.js
    // (ensureCoverCompatible via Cloudflare Worker).
    // Raw CDN URLs work fine in <img> tags for the step-3 preview.
];

/**
 * Fire every proxy in parallel and return the first successful data: URL.
 * If none respond within `timeoutMs`, abort all and return null.
 *
 * @param {string} imageUrl
 * @param {number} timeoutMs
 * @returns {Promise<string|null>}
 */
async function raceProxies(imageUrl, timeoutMs) {
    // CORS proxying is deferred to canvas.js (ensureCoverCompatible).
    // At selection time, raw CDN URLs work fine in <img> previews.
    // The Cloudflare Worker is only invoked during canvas rendering.
    return null;
}

async function tryOneProxy(proxy, imageUrl, controller) {
    const url = proxy.build(imageUrl);
    console.debug(`[ImageProxy] Racing ${proxy.name}…`);
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    // Accept any non-empty blob — some proxies return valid images
    // without an image/* MIME type.
    if (!blob.size) throw new Error("Empty response");
    console.debug(`[ImageProxy] ${proxy.name} → won (${blob.size} bytes, type=${blob.type || "none"})`);
    return blobToDataURL(blob);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the URL points to a SteamGridDB CDN domain.
 * Only SteamGridDB images need CORS proxying; all other providers
 * (TMDB, OpenLibrary, MusicBrainz) send proper CORS headers.
 */
function isSteamGridDBUrl(url) {
    try {
        const host = new URL(url).host;
        return host.endsWith("steamgriddb.com");
    } catch {
        return false;
    }
}

/**
 * Convert a Blob to a data: URL.
 */
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Convert an image URL to a data: URL using an <img> + <canvas>.
 * Handles cross-origin images when the server sends proper CORS headers.
 */
function imgToDataURL(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.9));
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
    });
}
