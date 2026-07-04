
## 🔌 API Setup (Autocomplete & Poster Fetching)

When the user types a title in step 2, a dropdown appears with search suggestions fetched from external APIs. Selecting a suggestion auto-fills the poster image in step 3.

### Configuration

1. Open `assets/js/api/api-config.js`
2. Add your API keys:

```js
export const API_CONFIG = {
    tmdb: "your-tmdb-key",   // https://www.themoviedb.org/settings/api
    rawg: "your-rawg-key",   // https://rawg.io/apidocs
};
```

| Media Type | Provider                        | Needs Key? | Sign-up Link                            |
| ---------- | ------------------------------- | ---------- | --------------------------------------- |
| Movies, TV | TMDB                            | Yes        | https://www.themoviedb.org/settings/api |
| Games      | RAWG                            | Yes        | https://rawg.io/apidocs                 |
| Books      | OpenLibrary                     | No         | —                                      |
| Music      | MusicBrainz + Cover Art Archive | No         | —                                      |

**Leaving a key empty is fine.** That provider will simply be skipped and no autocomplete will appear for that media type. The normal manual flow (type title → upload poster) remains unchanged.

### Flow

1. User starts typing a title → 350ms debounce → API call
2. Dropdown shows up to 6 results (title, year, thumbnail, provider name)
3. User clicks or presses Enter on a result → title is filled, poster is fetched as a high-res `data:` URL
4. User can still change the poster manually in step 3 (it's never locked)
5. If no API is configured or no results found → the normal manual flow is used

### Adding a New Provider

1. Create `assets/js/api/providers/your-provider.js` extending `BaseProvider`
2. Implement `search(query, mediaType)` → returns `[{ id, title, year, poster, subtitle }]`
3. Implement `getPoster(id, mediaType)` → returns a poster URL
4. Register it in `assets/js/api/api-manager.js`:
   ```js
   this.#register(new YourProvider(config), ["your-type"]);
   ```

---

## 🔐 Exposing API Keys on a Public GitHub Repo

**Yes, this is a problem.** Since the site is hosted on GitHub Pages (static, client-side only), any key placed in `api-config.js` is visible in the browser's DevTools → Sources tab. Anyone can copy it.

That said, here's the risk assessment and your options:

### How bad is it, really?

| Factor                                                                      | Reality                                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| TMDB / RAWG keys are**free** and **read-only**                  | Worst case: someone uses your key and burns through your daily rate limit (TMDB: ~50 req/sec). They can't charge you money or delete data. |
| Many open-source projects do this                                           | It's common in the PWA / static-site world. Not best practice, but pragmatic.                                                              |
| GitHub will**not** revoke or alert on leaked keys from these services | Unlike AWS / Stripe tokens, these are low-severity.                                                                                        |

### Alternatives (from simplest to most secure)

| # | Approach                                                           | Effort | Security | How                                                                                                                                                                                                                                                                                  |
| - | ------------------------------------------------------------------ | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | **Accept the risk**                                          | None   | ❌       | Just commit the keys. Rate limits are the only concern.                                                                                                                                                                                                                              |
| 2 | **Use only keyless providers**                               | None   | ✅       | OpenLibrary and MusicBrainz already work without keys. You'd only lose autocomplete for movies, TV, and games.                                                                                                                                                                       |
| 3 | **Serverless proxy** (recommended if you want full coverage) | Medium | ✅✅     | Deploy a tiny proxy on Cloudflare Workers / Netlify Functions / Vercel Edge. The client calls`your-proxy.workers.dev/search?type=movie&q=...` and the proxy forwards to TMDB/RAWG with the key stored as an environment variable on the server. The key never reaches the browser. |
| 4 | **GitHub Actions + build step**                              | High   | ✅       | Add a bundler (Vite, esbuild) and inject keys at build time via GitHub Secrets. However, the keys still end up in the final JS bundle — this only hides them from the repo source, not from the deployed page.                                                                      |

### Recommendation

For this project, **option 1 (accept risk)** or **option 2 (keyless only)** are the most practical. The data is read-only, the keys are free, and the blast radius is tiny.

If you want to go with option 3 later, the architecture I built already supports it — you'd just replace the provider implementations to point at your proxy URL instead of the API directly. No other files need to change.

- 🏆 **F029:** Add search bar to platform
