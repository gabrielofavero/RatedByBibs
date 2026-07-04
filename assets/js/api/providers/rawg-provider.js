/**
 * RAWG provider — covers video games.
 *
 * API docs: https://rawg.io/apidocs
 * Free tier, requires an API key.
 */

import { BaseProvider } from "./base-provider.js";

const BASE_URL = "https://api.rawg.io/api";

export class RAWGProvider extends BaseProvider {
    #apiKey;

    constructor(apiKey) {
        super({
            name: "RAWG",
            key: "rawg",
            mediaTypes: ["game"],
            searchReturnsImage: true,
            hasMultipleImages: false,
        });
        this.#apiKey = apiKey;
    }

    get enabled() {
        return !!this.#apiKey;
    }

    /** @override */
    async search(query) {
        if (!this.enabled || query.length < 2) return [];

        const url = `${BASE_URL}/games?key=${this.#apiKey}&search=${encodeURIComponent(query)}&page_size=6`;

        try {
            const res = await fetch(url);
            if (!res.ok) return [];

            const data = await res.json();
            if (!data.results?.length) {
                console.debug("[RAWG] search → no matches");
                return [];
            }

            console.debug(`[RAWG] search → ${data.results.length} result(s)`);
            return data.results.map(item => ({
                id: String(item.id),
                title: item.name,
                year: item.released ? new Date(item.released).getFullYear() : undefined,
                poster: item.background_image || null,
                subtitle: this.#platformsString(item),
                _raw: item,
            }));
        } catch {
            return [];
        }
    }

    /** @override */
    async getPoster(id) {
        if (!this.enabled) return null;

        const url = `${BASE_URL}/games/${id}?key=${this.#apiKey}`;

        try {
            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            return data.background_image || data.background_image_additional || null;
        } catch {
            return null;
        }
    }

    #platformsString(item) {
        if (!item.platforms?.length) return "Game";
        const names = item.platforms
            .slice(0, 3)
            .map(p => p.platform?.name)
            .filter(Boolean);
        return names.length ? names.join(", ") : "Game";
    }
}
