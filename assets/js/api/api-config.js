/**
 * API configuration.
 *
 * Add your API keys here.  All keys are optional — providers that need a key
 * and don't have one will simply be skipped at runtime (graceful degradation).
 *
 * SECURITY NOTE:
 * This is a client-side app hosted on GitHub Pages.  These keys will be
 * visible in the bundled source.  For free-tier read-only keys this is
 * generally acceptable.  If you need to protect keys, proxy requests through
 * a serverless function (Cloudflare Workers, Netlify Functions, etc.).
 */

export const API_CONFIG = {
    /**
     * TMDB — movies & TV
     * Get a key at: https://www.themoviedb.org/settings/api
     */
    tmdb: "090080a8be700efbccba78fc3b7f0869",

    /**
     * SteamGridDB — game posters (600×900 grids)
     * Get a key at: https://www.steamgriddb.com/profile/preferences/api
     */
    steamgriddb: "69b80f3720c8e8a43500610a322e62cc",

    /**
     * RAWG — games (fallback when SteamGridDB doesn't find a match)
     * Get a key at: https://rawg.io/apidocs
     *
     * NOTE: Disabled — wasn't returning good results.
     */
    rawg: "",

    // OpenLibrary and MusicBrainz don't need keys.
};
