/**
 * CORS proxy helper.
 *
 * Some APIs (like SteamGridDB) don't send Access-Control-Allow-Origin headers,
 * which blocks browser-based fetch() calls. This utility routes requests
 * through a public CORS proxy so the browser allows reading the response.
 *
 * Proxy services tried in order (first successful one is cached):
 *  - corsproxy.io
 */

const PROXIES = [
    "https://corsproxy.io/?",
];

let _workingProxy = null;

/**
 * Returns the cached working proxy base URL (e.g. "https://corsproxy.io/?"),
 * or null if no proxy has been validated yet.
 * @returns {string|null}
 */
export function getWorkingProxy() {
    return _workingProxy;
}

/**
 * Fetch a URL through a CORS proxy.
 * Behaves like fetch() but routes the request through a proxy.
 *
 * @param {string} url - The target URL
 * @param {object} [options] - Standard fetch options (headers, etc.)
 * @returns {Promise<Response>}
 */
export async function proxyFetch(url, options = {}) {
    // If we already know which proxy works, use it
    if (_workingProxy) {
        const res = await fetch(_workingProxy + encodeURIComponent(url), options);
        if (res.ok || res.status === 401 || res.status === 404) return res;
    }

    // Try each proxy until one works
    for (const proxy of PROXIES) {
        try {
            const proxyUrl = proxy + encodeURIComponent(url);
            const res = await fetch(proxyUrl, options);
            if (res.ok || res.status === 401 || res.status === 404) {
                _workingProxy = proxy; // Cache for subsequent calls
                return res;
            }
        } catch {
            // Try next proxy
        }
    }

    // All proxies failed — try a direct call as last resort
    return fetch(url, options);
}
