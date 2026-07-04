/**
 * Image proxy helper.
 *
 * Converts an external image URL into a data: URL so it can be used as
 * the COVER value in step-3 without CORS issues during canvas rendering.
 *
 * Falls back to the original URL if the conversion fails (some use-cases
 * may still work with the raw URL).
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
    return new Promise((resolve, reject) => {
        // Try via fetch + Blob first (handles CORS if server allows)
        fetch(imageUrl, { mode: "cors" })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
            .then(blob => blobToDataURL(blob).then(resolve))
            .catch(() => {
                // Fallback 1: try via an <img> + <canvas> (works when the
                // server sends CORS headers but fetch() is blocked)
                imgToDataURL(imageUrl).then(resolve).catch(() => {
                    // Fallback 2: route through a CORS proxy (handles
                    // servers like SteamGridDB CDN that send no CORS headers).
                    // Note: some proxies return non-2xx but still serve the
                    // image in the body, so we skip the res.ok check.
                    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(imageUrl);
                    console.debug("[ImageProxy] Trying CORS proxy for image…");
                    fetch(proxyUrl)
                        .then(res => res.blob())
                        .then(blob => {
                            console.debug(`[ImageProxy] CORS proxy → blob ${blob.type} (${blob.size} bytes)`);
                            if (!blob.type.startsWith("image/")) {
                                throw new Error(`Proxy returned non-image: ${blob.type}`);
                            }
                            return blobToDataURL(blob).then(resolve);
                        })
                        .catch(err => {
                            // Final fallback: return the raw URL.
                            // <img> tags can display cross-origin images
                            // without CORS — only canvas export needs a
                            // data URL, which we'll handle separately.
                            console.debug("[ImageProxy] All conversions failed, using raw URL", err);
                            resolve(imageUrl);
                        });
                });
            });
    });
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
