/**
 * SteamGridDB provider — fetches game posters (600×900 grids).
 *
 * API docs: https://www.steamgriddb.com/api/v2
 * Requires an API key (free tier available).
 *
 * Registered before RAWG for the "game" media type so that
 * proper vertical posters are used instead of landscape covers.
 * If SteamGridDB doesn't find the game, RAWG kicks in as fallback.
 */

import { BaseProvider } from "./base-provider.js";
import { proxyFetch } from "../utils/cors-proxy.js";

const BASE_URL = "https://www.steamgriddb.com/api/v2";

export class SteamGridDBProvider extends BaseProvider {
    #apiKey;

    constructor(apiKey) {
        super({
            name: "SteamGridDB",
            key: "steamgriddb",
            mediaTypes: ["game"],
            searchReturnsImage: false,
            hasMultipleImages: true,
        });
        this.#apiKey = apiKey;
    }

    get enabled() {
        return !!this.#apiKey;
    }

    /** @override */
    async search(query) {
        if (!this.enabled || query.length < 2) return [];

        const url = `${BASE_URL}/search/autocomplete/${encodeURIComponent(query)}`;

        try {
            const res = await proxyFetch(url, {
                headers: { "Authorization": `Bearer ${this.#apiKey}` },
            });
            if (!res.ok) return [];

            const json = await res.json();
            if (!json.success || !json.data?.length) {
                console.debug("[SteamGridDB] search → no matches");
                return [];
            }

            console.debug(`[SteamGridDB] search → ${json.data.length} match(es)`);
            return json.data.slice(0, 6).map(item => ({
                id: String(item.id),
                title: item.name,
                year: undefined,
                poster: null, // Poster is fetched on-demand via getPoster()
                subtitle: item.types?.length ? item.types.join(", ") : "Game",
                _raw: item,
            }));
        } catch {
            return [];
        }
    }

    /** @override */
    async getPoster(id) {
        if (!this.enabled) return null;

        // Fetch 600×900 grids (vertical poster format) for this game
        const url = `${BASE_URL}/grids/game/${id}?dimensions=600x900&limit=1`;

        try {
            const res = await proxyFetch(url, {
                headers: { "Authorization": `Bearer ${this.#apiKey}` },
            });
            if (!res.ok) return null;

            const json = await res.json();
            if (!json.success || !json.data?.length) {
                console.debug(`[SteamGridDB] getPoster → no 600×900 grid for id=${id}`);
                return null;
            }

            console.debug(`[SteamGridDB] getPoster → using first grid`);
            return json.data[0].url || null;
        } catch {
            return null;
        }
    }

    /** @override */
    async getPosters(id) {
        if (!this.enabled) return [];

        // Fetch ALL 600×900 grids for this game (up to 10)
        const url = `${BASE_URL}/grids/game/${id}?dimensions=600x900&limit=10`;

        try {
            const res = await proxyFetch(url, {
                headers: { "Authorization": `Bearer ${this.#apiKey}` },
            });
            if (!res.ok) return [];

            const json = await res.json();
            if (!json.success || !json.data?.length) {
                console.debug(`[SteamGridDB] getPosters → no grids for id=${id}`);
                return [];
            }

            console.debug(`[SteamGridDB] getPosters → ${json.data.length} grid(s)`);
            return json.data.map(g => g.url).filter(Boolean);
        } catch {
            return [];
        }
    }
}
