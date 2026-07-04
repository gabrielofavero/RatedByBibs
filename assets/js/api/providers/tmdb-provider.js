/**
 * TMDB (The Movie Database) provider — covers movies and TV shows.
 *
 * API docs: https://developer.themoviedb.org/reference/intro/getting-started
 * Free tier, requires an API key (read-only access key is fine for client-side).
 *
 * Rate limits: ~50 requests/sec. We debounce on the autocomplete side.
 */

import { BaseProvider } from "./base-provider.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export class TMDBProvider extends BaseProvider {
    #apiKey;

    constructor(apiKey) {
        super({
            name: "TMDB",
            key: "tmdb",
            mediaTypes: ["movie", "tv"],
            searchReturnsImage: true,
            hasMultipleImages: false,
        });
        this.#apiKey = apiKey;
    }

    get enabled() {
        return !!this.#apiKey;
    }

    /** @override */
    async search(query, mediaType) {
        if (!this.enabled || query.length < 2) return [];

        const endpoint = mediaType === "tv"
            ? `${BASE_URL}/search/tv`
            : `${BASE_URL}/search/movie`;

        const url = `${endpoint}?api_key=${this.#apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;

        try {
            const res = await fetch(url);
            if (!res.ok) return [];

            const data = await res.json();
            if (!data.results?.length) return [];

            const mapped = data.results.slice(0, 6).map(item => ({
                id: String(item.id),
                title: mediaType === "tv" ? item.name : item.title,
                year: this.#extractYear(item),
                poster: item.poster_path
                    ? `${IMAGE_BASE}/w185${item.poster_path}`
                    : null,
                subtitle: this.#buildSubtitle(item, mediaType),
                _raw: item, // preserve original for detail lookups
            }));
            return mapped;
        } catch {
            return [];
        }
    }

    /** @override */
    async getPoster(id, mediaType) {
        if (!this.enabled) return null;

        const endpoint = mediaType === "tv"
            ? `${BASE_URL}/tv/${id}`
            : `${BASE_URL}/movie/${id}`;

        const url = `${endpoint}?api_key=${this.#apiKey}&language=en-US`;

        try {
            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            return data.poster_path
                ? `${IMAGE_BASE}/w342${data.poster_path}`
                : null;
        } catch {
            return null;
        }
    }

    // ---- helpers ----

    #extractYear(item) {
        const date = item.release_date || item.first_air_date;
        return date ? new Date(date).getFullYear() : undefined;
    }

    #buildSubtitle(item, mediaType) {
        const year = this.#extractYear(item);
        const label = mediaType === "tv" ? "TV" : "Movie";
        const parts = [label];
        if (year) parts.push(String(year));
        return parts.join(" · ");
    }
}
