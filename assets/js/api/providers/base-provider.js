/**
 * Base provider class — all API providers MUST extend this.
 * Each provider handles one or more media types and exposes:
 *  - search(query)  → [{ id, title, year, poster, subtitle }]
 *  - getPoster(id)  → poster URL (string)
 *  - getPosters(id) → poster URL[] (for providers with multiple images)
 *  - getDetails(id) → full metadata object (optional)
 *
 * Providers are registered in api-manager.js per media type and tried
 * in order; the first one that returns results wins.
 */

export class BaseProvider {
    /**
     * @param {object} config
     * @param {string} config.name        - Human-readable name (e.g. "TMDB")
     * @param {string} config.key         - Unique provider key (e.g. "tmdb")
     * @param {string[]} config.mediaTypes - Which types this provider handles
     * @param {boolean} [config.searchReturnsImage=true] - Whether search() returns poster URLs directly
     * @param {boolean} [config.hasMultipleImages=false] - Whether getPosters() can return multiple image options
     * @param {boolean} [config.showSubtitle=true] - Whether to show the subtitle in autocomplete dropdown
     */
    constructor({ name, key, mediaTypes, searchReturnsImage = true, hasMultipleImages = false, showSubtitle = true }) {
        this.name = name;
        this.key = key;
        this.mediaTypes = mediaTypes;
        this.searchReturnsImage = searchReturnsImage;
        this.hasMultipleImages = hasMultipleImages;
        this.showSubtitle = showSubtitle;
    }

    /**
     * Whether this provider is currently usable (has credentials, etc.)
     * @returns {boolean}
     */
    get enabled() {
        return true;
    }

    /**
     * Search for media by query string.
     * @param {string} query - The user's search text
     * @param {string} mediaType - e.g. "movie", "tv", "game"
     * @returns {Promise<Array<{id: string, title: string, year?: number, poster?: string, subtitle?: string}>>}
     */
    async search(query, mediaType) {
        throw new Error(`Provider "${this.name}" must implement search()`);
    }

    /**
     * Fetch a poster URL for a given result ID.
     * @param {string} id - The result ID returned by search()
     * @param {string} mediaType
     * @returns {Promise<string|null>} - URL to the poster image
     */
    async getPoster(id, mediaType) {
        throw new Error(`Provider "${this.name}" must implement getPoster()`);
    }

    /**
     * Fetch all poster URLs for a given result ID.
     * Default implementation wraps getPoster() in an array.
     * Providers with multiple images (hasMultipleImages=true) should override this.
     *
     * @param {string} id - The result ID returned by search()
     * @param {string} mediaType
     * @returns {Promise<string[]>} - Array of poster URLs
     */
    async getPosters(id, mediaType) {
        const poster = await this.getPoster(id, mediaType);
        return poster ? [poster] : [];
    }

    /**
     * (Optional) Get full metadata for a result.
     * @param {string} id
     * @param {string} mediaType
     * @returns {Promise<object|null>}
     */
    async getDetails(id, mediaType) {
        return null;
    }
}
