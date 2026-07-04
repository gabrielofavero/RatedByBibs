/**
 * OpenLibrary provider — covers books.
 *
 * API docs: https://openlibrary.org/dev/docs/api/search
 * Completely free, no API key required.
 */

import { BaseProvider } from "./base-provider.js";

const BASE_URL = "https://openlibrary.org";
const COVERS_BASE = "https://covers.openlibrary.org/b";

export class OpenLibraryProvider extends BaseProvider {
    constructor() {
        super({
            name: "OpenLibrary",
            key: "openlibrary",
            mediaTypes: ["book"],
            searchReturnsImage: true,
            hasMultipleImages: false,
        });
    }

    /** @override */
    async search(query) {
        if (query.length < 2) return [];

        const url = `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=6`;

        try {
            const res = await fetch(url);
            if (!res.ok) return [];

            const data = await res.json();
            if (!data.docs?.length) return [];

            return data.docs.map(item => {
                const coverId = item.cover_i ?? item.cover_edition_key;
                return {
                    id: item.key,
                    title: item.title,
                    year: item.first_publish_year ?? undefined,
                    poster: coverId
                        ? `${COVERS_BASE}/id/${coverId}-M.jpg`
                        : null,
                    subtitle: item.author_name?.slice(0, 2).join(", ") || "Book",
                    _raw: item,
                };
            });
        } catch {
            return [];
        }
    }

    /** @override */
    async getPoster(id) {
        // id is the OL key, e.g. "/works/OL123W"
        try {
            const url = `${BASE_URL}${id}.json`;
            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            const coverIds = data.covers ?? [];
            if (!coverIds.length) return null;

            return `${COVERS_BASE}/id/${coverIds[0]}-L.jpg`;
        } catch {
            return null;
        }
    }
}
