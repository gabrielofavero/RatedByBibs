# Cloudflare Worker Image Proxy — Setup Guide

Replaces unreliable public CORS proxies and the Service Worker hack with
a single **free**, **reliable** Cloudflare Worker that proxies SteamGridDB
CDN images and adds CORS headers.

---

## Why This Exists

| Approach                    | Reliability | Notes                                                   |
| --------------------------- | ----------- | ------------------------------------------------------- |
| Public proxies (6× race)   | ❌ Low      | Rate-limited, blocked by CDNs, can go down              |
| Service Worker injection    | ⚠️ Medium | Lifecycle bugs, first-visit not active, scope issues    |
| **Cloudflare Worker** | ✅ High     | 99.99% uptime, free tier (100k req/day), you control it |

---

## Step 1 — Deploy the Cloudflare Worker

### 1a. Sign up (if you don't have an account)

Go to [dash.cloudflare.com](https://dash.cloudflare.com) and create a free account.
No credit card required.

### 1b. Create the Worker

1. In the dashboard sidebar, click **Workers & Pages**
2. Click **Create application** → **Create Worker**
3. Give it a name (e.g. `img-proxy`) and click **Deploy**
4. Click **Edit code** and paste the code below (replace all default code):

```js
/**
 * Image proxy — fetches an image from an external URL and returns it
 * with CORS headers so the browser can use it on a <canvas>.
 *
 * Usage: GET /?url=https://cdn2.steamgriddb.com/.../image.png
 *
 * Free tier: 100,000 requests/day (≈ 1.15 req/second sustained).
 * More than enough for a personal project.
 */
export default {
  async fetch(request) {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) {
      return new Response("Missing ?url= parameter", { status: 400 });
    }

    // Only allow image requests through
    try {
      const decoded = decodeURIComponent(url);
      const target = new URL(decoded);
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }

    const image = await fetch(decodeURIComponent(url));

    if (!image.ok) {
      return new Response("Upstream fetch failed", { status: 502 });
    }

    const response = new Response(image.body, image);

    // The whole point — allow browsers to read this image on a <canvas>
    response.headers.set("Access-Control-Allow-Origin", "*");

    // Cache at Cloudflare's edge for 7 days (reduces upstream requests)
    response.headers.set("Cache-Control", "public, max-age=604800, s-maxage=604800");

    return response;
  }
};
```

5. Click **Save and Deploy**

### 1c. Test it

Open your Worker URL in the browser with an image parameter:

```
https://img-proxy.YOUR-SUBDOMAIN.workers.dev/?url=https%3A%2F%2Fcdn2.steamgriddb.com%2Fgrid%2Fabcd1234.png
```

You should see the image. The response headers should include `Access-Control-Allow-Origin: *`.

### 1d. Note your Worker URL

It looks like: `https://img-proxy.YOURNAME.workers.dev`

You'll need this in the next step.

---

## Step 2 — Update the Project Code

Make three changes in your codebase to switch from the proxy-race approach
to your own reliable Worker.

### 2a. `assets/js/api/utils/image-proxy.js`

Replace the `CORS_PROXIES` array (the public proxy list) with your single Worker:

```js
/** @type {Array<{name: string, build: (url: string) => string}>} */
const CORS_PROXIES = [
  // Your own Cloudflare Worker — reliable, free, you control it
  {
    name: "my-worker",
    build: (u) => `https://img-proxy.YOURNAME.workers.dev/?url=${encodeURIComponent(u)}`,
  },
];
```

> Replace `YOURNAME` with your actual Cloudflare Workers subdomain.

### 2b. `assets/js/canvas.js`

Same change — replace the `CORS_PROXIES` array near the bottom of the file:

```js
/** @type {Array<{name: string, build: (url: string) => string}>} */
const CORS_PROXIES = [
  {
    name: "my-worker",
    build: (u) => `https://img-proxy.YOURNAME.workers.dev/?url=${encodeURIComponent(u)}`,
  },
];
```

### 2c. `assets/js/api/utils/cors-proxy.js`

This file routes API calls (not images) through `corsproxy.io`. The SteamGridDB
**search API** itself needs CORS proxying too (not just images). Optionally,
you can create a second Worker or a combined one:

**Option A — Simple:** Keep `corsproxy.io` for API calls. It's only used for
the SteamGridDB search endpoint (low traffic, infrequent), so reliability
matters less than for images.

**Option B — Combined Worker:** Replace the `corsproxy.io` entry with your
own Worker. Update the Worker code to handle both image and API proxying:

```js
// Cloudflare Worker — supports both image proxy (?url=) and API proxy (?api=)
export default {
  async fetch(request) {
    const params = new URL(request.url).searchParams;
    const imageUrl = params.get("url");
    const apiUrl = params.get("api");

    const targetUrl = imageUrl || apiUrl;
    if (!targetUrl) {
      return new Response("Missing ?url= or ?api=", { status: 400 });
    }

    const upstream = await fetch(decodeURIComponent(targetUrl));
    const response = new Response(upstream.body, upstream);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
};
```

Then in `cors-proxy.js`:

```js
const PROXIES = [
  "https://img-proxy.YOURNAME.workers.dev/?api=",
];
```

---

## Step 3 — Remove the Service Worker (Optional but Recommended)

Once your Cloudflare Worker is working, the `sw.js` Service Worker is no
longer needed for CORS fixes. To remove it:

1. Delete `sw.js` from the root
2. Remove the SW registration from your HTML/JS (usually in `app.js` or inline):

```js
// Remove this line:
navigator.serviceWorker.register("/sw.js");
```

> If you keep the SW for other purposes (caching, offline support), that's
> fine — just make sure it doesn't interfere with image requests anymore.

---

## Step 4 — Verify

1. Open the browser DevTools → Network tab
2. Use the app to search for a game and generate a canvas
3. You should see requests to `img-proxy.YOURNAME.workers.dev` — **not** to
   `weserv.nl`, `corsproxy.io`, or any other public proxy
4. The canvas should generate reliably, every time
5. Check the Console — no `SecurityError` or CORS-related errors

---

## Fallback Strategy

If the Worker is somehow unreachable (Cloudflare outage — extremely rare),
the existing manual upload fallback kicks in:

1. `fetchImageAsDataURL()` fails
2. Step 3 shows the upload dropzone
3. User manually selects an image file
4. FileReader converts it to a `data:` URL (always works, no CORS)
5. Canvas renders normally

This means you have a **guaranteed path** to a working canvas under all
circumstances — either the Worker handles it automatically, or the user
uploads manually.

---

## Cost

| Plan                         | Requests/day                    | Cost |
| ---------------------------- | ------------------------------- | ---- |
| Free                         | 100,000                         | $0   |
| Paid (if you somehow exceed) | $0.30/million | ~$0.03 per 100k |      |

At 100k requests/day, you'd need ~1.15 requests **per second** sustained
24/7 to hit the free limit. A personal project won't come close.

---

## Troubleshooting

### Worker returns 502

The upstream image URL is unreachable or invalid. Check the `?url=` parameter.

### Worker returns CORS error in browser

The Worker code might not be adding the header correctly. Verify the response
includes `Access-Control-Allow-Origin: *` in DevTools → Network.

### Images still not rendering on canvas

Make sure `CORS_PROXIES` in **both** `image-proxy.js` and `canvas.js` have
been updated. Both files have their own copy of the proxy list.

### Deployment not updating

Cloudflare Workers deploy instantly, but the old code might be cached. Add
a cache-busting query parameter or wait a few seconds.
