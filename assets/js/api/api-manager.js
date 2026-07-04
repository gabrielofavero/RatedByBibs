/**
 * API Manager — central registry of all providers per media type.
 *
 * How it works:
 * 1. On app init, we instantiate all enabled providers.
 * 2. Each media type maps to an ordered list of providers.
 * 3. When the user types, we call search() on each provider in order;
 *    the first one that returns results wins.
 * 4. The autocomplete component uses this manager exclusively.
 *
 * To add a new provider:
 *   1. Create it in providers/ extending BaseProvider
 *   2. Import and register it here in the constructor
 */

import { API_CONFIG } from "./api-config.js";
import { TMDBProvider } from "./providers/tmdb-provider.js";
import { SteamGridDBProvider } from "./providers/steamgriddb-provider.js";
import { RAWGProvider } from "./providers/rawg-provider.js";
import { OpenLibraryProvider } from "./providers/openlibrary-provider.js";
import { MusicBrainzProvider } from "./providers/musicbrainz-provider.js";
import { fetchImageAsDataURL } from "./utils/image-proxy.js";

class ApiManager {
    /** @type {Map<string, BaseProvider[]>} */
    #providersByType = new Map();

    /** @type {BaseProvider[]} */
    #allProviders = [];

    constructor() {
        // Register providers here — order matters (first = preferred)
        this.#register(new TMDBProvider(API_CONFIG.tmdb),     ["movie", "tv"]);
        this.#register(new SteamGridDBProvider(API_CONFIG.steamgriddb), ["game"]);
        this.#register(new RAWGProvider(API_CONFIG.rawg),     ["game"]);
        this.#register(new OpenLibraryProvider(),              ["book"]);
        this.#register(new MusicBrainzProvider(),              ["music"]);
    }

    /**
     * Search across all registered providers for a given media type.
     * Returns results from the first provider that responds successfully.
     *
     * @param {string} mediaType - e.g. "movie", "tv", "game", "music", "book"
     * @param {string} query     - The user's search text
     * @returns {Promise<Array<{id, title, year, poster, subtitle, providerKey}>>}
     */
    async search(mediaType, query) {
        const providers = this.#providersByType.get(mediaType) ?? [];
        if (!providers.length || query.length < 2) return [];

        // Try each provider in order, stop at the first that returns results
        for (const provider of providers) {
            if (!provider.enabled) continue;

            console.debug(`[ApiManager] Trying ${provider.name} for "${query}"…`);

            try {
                const results = await provider.search(query, mediaType);
                if (results.length) {
                    console.debug(`[ApiManager] ${provider.name} → ${results.length} result(s)`);
                    // Tag each result with the provider that produced it and its image capabilities
                    return results.map(r => ({
                        ...r,
                        providerKey: provider.key,
                        searchReturnsImage: provider.searchReturnsImage,
                        hasMultipleImages: provider.hasMultipleImages,
                    }));
                }
                console.debug(`[ApiManager] ${provider.name} → no results, trying next…`);
            } catch {
                console.debug(`[ApiManager] ${provider.name} → error, trying next…`);
            }
        }

        console.debug(`[ApiManager] No provider returned results for "${query}"`);
        return [];
    }

    /**
     * Fetch a poster as a data: URL (ready to set as COVER) for a given result.
     *
     * @param {string} mediaType
     * @param {string} providerKey - Which provider produced this result
     * @param {string} id          - The result ID
     * @returns {Promise<string|null>} - data: URL or null
     */
    async fetchPoster(mediaType, providerKey, id) {
        const provider = this.#findProvider(providerKey);
        if (!provider) return null;

        console.debug(`[ApiManager] fetchPoster via ${provider.name} (id=${id})`);

        try {
            const posterUrl = await provider.getPoster(id, mediaType);
            if (!posterUrl) {
                console.debug(`[ApiManager] ${provider.name} → no poster returned`);
                return null;
            }

            console.debug(`[ApiManager] ${provider.name} → poster fetched, converting to data URL…`);
            // Convert external URL → data: URL so it works everywhere
            return await fetchImageAsDataURL(posterUrl);
        } catch {
            console.debug(`[ApiManager] ${provider.name} → poster fetch failed`);
            return null;
        }
    }

    /**
     * Fetch ALL posters as data: URLs for a given result.
     * Used by providers with hasMultipleImages=true.
     *
     * @param {string} mediaType
     * @param {string} providerKey - Which provider produced this result
     * @param {string} id          - The result ID
     * @returns {Promise<string[]>} - Array of data: URLs
     */
    async fetchPosters(mediaType, providerKey, id) {
        const provider = this.#findProvider(providerKey);
        if (!provider) return [];

        console.debug(`[ApiManager] fetchPosters via ${provider.name} (id=${id})`);

        try {
            const posterUrls = await provider.getPosters(id, mediaType);
            if (!posterUrls.length) {
                console.debug(`[ApiManager] ${provider.name} → no posters returned`);
                return [];
            }

            console.debug(`[ApiManager] ${provider.name} → ${posterUrls.length} poster(s), converting to data URLs…`);
            const dataUrls = await Promise.all(
                posterUrls.map(async (url, i) => {
                    try {
                        return await fetchImageAsDataURL(url);
                    } catch {
                        console.debug(`[ApiManager] ${provider.name} → poster ${i} conversion failed`);
                        return null;
                    }
                })
            );
            return dataUrls.filter(Boolean);
        } catch {
            console.debug(`[ApiManager] ${provider.name} → fetchPosters failed`);
            return [];
        }
    }

    /**
     * Check if any provider is available for a given media type.
     * @param {string} mediaType
     * @returns {boolean}
     */
    hasProviders(mediaType) {
        const providers = this.#providersByType.get(mediaType) ?? [];
        return providers.some(p => p.enabled);
    }

    // ---- internal ----

    #register(provider, mediaTypes) {
        this.#allProviders.push(provider);
        for (const type of mediaTypes) {
            if (!this.#providersByType.has(type)) {
                this.#providersByType.set(type, []);
            }
            this.#providersByType.get(type).push(provider);
        }
    }

    #findProvider(key) {
        return this.#allProviders.find(p => p.key === key) ?? null;
    }
}

// Singleton
export const apiManager = new ApiManager();
