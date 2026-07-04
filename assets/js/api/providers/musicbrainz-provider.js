/**
 * MusicBrainz + Cover Art Archive provider — covers music (albums).
 *
 * MusicBrainz API: https://musicbrainz.org/doc/MusicBrainz_API
 * Cover Art Archive: https://coverartarchive.org/
 *
 * Both are completely free, no API key required.
 * Rate limit: ~1 req/sec for MusicBrainz (we debounce on the client).
 */

import { BaseProvider } from "./base-provider.js";

const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";

export class MusicBrainzProvider extends BaseProvider {
    constructor() {
        super({
            name: "MusicBrainz",
            key: "musicbrainz",
            mediaTypes: ["music"],
            searchReturnsImage: false,
            hasMultipleImages: false,
        });
    }

    /** @override */
    async search(query) {
        if (query.length < 2) return [];

        // Search for release groups (albums) — most relevant for our use case
        const url = `${MB_BASE}/release-group/?query=${encodeURIComponent(query)}&limit=6&fmt=json`;

        try {
            const res = await fetch(url, {
                headers: { "Accept": "application/json" },
            });
            if (!res.ok) return [];

            const data = await res.json();
            if (!data["release-groups"]?.length) return [];

            return data["release-groups"].map(item => ({
                id: item.id, // MBID
                title: item.title,
                year: item["first-release-date"]
                    ? new Date(item["first-release-date"]).getFullYear()
                    : undefined,
                poster: null, // we fetch this later via getPoster()
                subtitle: this.#artistCredit(item) || item["primary-type"] || "Music",
                _raw: item,
            }));
        } catch {
            return [];
        }
    }

    /** @override */
    async getPoster(mbid) {
        if (!mbid) return null;

        try {
            // Cover Art Archive doesn't need auth
            const url = `${CAA_BASE}/release-group/${mbid}/front`;
            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            const front = data.images?.find(img =>
                img.front && img.approved
            ) ?? data.images?.[0];

            return front?.image ?? null;
        } catch {
            return null;
        }
    }

    #artistCredit(item) {
        const credits = item["artist-credit"];
        if (!credits?.length) return null;
        return credits.map(c => c.name + (c.joinphrase ?? "")).join("").trim();
    }
}
