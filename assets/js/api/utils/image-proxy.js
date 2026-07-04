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
    // Dedicated image proxies (try first — CDNs are less likely to block these)
    { name: "weserv",       build: (u) => `https://images.weserv.nl/?url=${encodeURIComponent(u)}` },
    { name: "wsrv",         build: (u) => `https://wsrv.nl/?url=${encodeURIComponent(u)}` },
    // General-purpose CORS proxies (fallback)
    { name: "corsproxy.io",  build: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
    { name: "allorigins",    build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
    { name: "corsanywhere",  build: (u) => `https://cors-anywhere.herokuapp.com/${u}` },
    { name: "corsbridge",    build: (u) => `https://cors.bridged.cc/${u}` },
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
    const controllers = CORS_PROXIES.map(() => new AbortController());

    const attempts = CORS_PROXIES.map((proxy, i) =>
        tryOneProxy(proxy, imageUrl, controllers[i]).then(dataUrl => {
            // Abort all other in-flight requests — we already have a winner
            controllers.forEach((c, j) => { if (j !== i) c.abort(); });
            return dataUrl;
        })
    );

    // Global deadline — if no proxy responds in time, give up
    const deadline = new Promise((_, reject) =>
        setTimeout(() => {
            controllers.forEach(c => c.abort());
            reject(new Error("Proxy race timed out"));
        }, timeoutMs)
    );

    try {
        return await Promise.race([...attempts, deadline]);
    } catch {
        return null;
    }
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
