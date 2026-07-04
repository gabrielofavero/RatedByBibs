import { translate } from "./translation/translation.js";
import { getRadioCheckedID, loadStars } from "./ui/forms.js";
import { MACROTYPE, TYPE } from "./ui/steps/step-1.js";
import { PLATFORM, getPlatformProperties, updateInternalIcon } from "./ui/steps/step-2.js";
import { COVER, RATING } from "./ui/steps/step-3.js";

let GENERATED_IMAGE = '';

export function resetCanvasState() {
    GENERATED_IMAGE = '';
}
const RADIO_VALUES = {
    music: {
        type: '',
        subtype: ''
    },
    tv: {
        type: '',
        subtype: ''
    }
}

// Main Functions

/**
 * Generate the final canvas image.
 *
 * @param {object} [options]
 * @param {(status: string, pct: number) => void} [options.onProgress]
 *        Called with a human-readable status and 0-100 percentage.
 * @returns {Promise<void>} Resolves when GENERATED_IMAGE is ready.
 */
export async function generateCanvas({ onProgress } = {}) {
    const progress = (status, pct) => {
        console.debug(`[Canvas] ${status} (${pct}%)`);
        onProgress?.(status, pct);
    };

    progress("Preparing layout…", 5);
    loadRadioValues();
    renderCover();
    renderText('h1-display', getH1());
    renderText('h2-display', getH2());
    renderPlatformIcon();
    renderPlatformLabel();
    renderStars();

    progress("Rendering canvas…", 20);
    await renderCanvas(progress);

    progress("Done!", 100);
}

export async function downloadOrShareCanvas() {
    if (window.innerWidth < 1200) {
        await shareCanvas();
    } else {
        await downloadCanvas();
    }
}

async function downloadCanvas() {
    if (!GENERATED_IMAGE) {
        await generateCanvas();
    }
    const a = document.createElement('a');
    a.href = GENERATED_IMAGE;
    a.download = `rated-${TYPE}.png`;
    a.click();
}

async function shareCanvas() {
    if (!GENERATED_IMAGE) {
        await generateCanvas();
    }

    const res = await fetch(GENERATED_IMAGE);
    const blob = await res.blob();
    const file = new File([blob], 'game-story.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Rated! By Bibs',
                text: getShareText(),
                url: 'https://gabrielofavero.github.io/RatedByBibs/',
            });
        } catch (err) {
            downloadCanvas();
        }
    } else {
        downloadCanvas();
    }
}

function loadRadioValues() {
    loadRadioValue('music', '.radios.music');
    loadRadioValue('tv', '.radios.tv');

    function loadRadioValue(id, className) {
        const value = getRadioCheckedID(className);
        const parts = value.split('-');
        RADIO_VALUES[id].type = parts[0];
        RADIO_VALUES[id].subtype = parts[parts.length - 1];
    }
}

// Renderers
function renderCover() {
    const img = document.getElementById('canvas-cover');
    img.crossOrigin = "anonymous";
    img.src = COVER;
}

async function renderCanvas(onProgress) {
    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.style.display = 'flex';

    onProgress?.("Inlining SVG icons…", 25);
    renderInlineSvgUses(canvasContainer);
    fixHalfStarGradients(canvasContainer);

    onProgress?.("Converting cover image…", 35);

    // Wait for the cover image to finish loading (or fail / time out).
    const coverImg = document.getElementById('canvas-cover');
    const coverPromise = new Promise((resolve) => {
        if (!coverImg || coverImg.complete) {
            // Already loaded (or no image element)
            resolve();
            return;
        }
        coverImg.addEventListener('load', () => resolve(), { once: true });
        coverImg.addEventListener('error', () => resolve(), { once: true });
    });

    // Safety net — if cover conversion stalls, don't block forever.
    // We clean up the timer when coverPromise resolves first so we
    // don't get a stale "timed out" message after success.
    const COVER_TIMEOUT = 30_000;
    let timerId;
    const coverTimeout = new Promise((resolve) => {
        timerId = setTimeout(() => {
            console.debug("[Canvas] Cover conversion timed out, proceeding without it");
            resolve();
        }, COVER_TIMEOUT);
    });
    // If coverPromise wins, cancel the timeout
    coverPromise.then(() => clearTimeout(timerId));

    await Promise.race([coverPromise, coverTimeout]);
    onProgress?.("Cover ready", 50);

    // Convert SteamGridDB CDN URLs to data URLs via Cloudflare Worker.
    // Non-SteamGridDB images are already data URLs — this returns immediately.
    onProgress?.("Proxying cover for canvas…", 52);
    await ensureCoverCompatible();

    onProgress?.("Capturing with html2canvas…", 55);
    const canvas = await html2canvas(canvasContainer, {
        useCORS: true,  // Enables crossOrigin for all images
    });

    onProgress?.("Encoding final image…", 90);
    const dataUrl = canvas.toDataURL('image/png');
    GENERATED_IMAGE = dataUrl;

    canvasContainer.style.display = 'none';
}

function renderInlineSvgUses(root = document) {
    const uses = root.querySelectorAll("svg use");
    uses.forEach(use => {
        const href = use.getAttribute("href") || use.getAttribute("xlink:href");
        if (href && href.startsWith("#")) {
            const symbol = document.querySelector(href);
            if (symbol) {
                const parentSvg = use.closest("svg");
                if (symbol.getAttribute("viewBox")) {
                    parentSvg.setAttribute("viewBox", symbol.getAttribute("viewBox"));
                }
                const cloned = symbol.cloneNode(true);
                while (cloned.firstChild) {
                    parentSvg.appendChild(cloned.firstChild);
                }
                use.remove();
            }
        }
    });
}

/**
 * html2canvas cannot resolve cross-element SVG gradient references
 * (e.g. fill: url(#half-star-fill) when the gradient is defined in a
 * separate hidden SVG).  This function clones the half-star gradient
 * definitions directly into each .half star SVG so the references stay
 * self-contained during canvas serialisation.
 */
function fixHalfStarGradients(root = document) {
    const halfStars = root.querySelectorAll("svg.icon.star.half");
    halfStars.forEach((svg, index) => {
        // Already patched — skip
        if (svg.querySelector("defs > linearGradient[id^='_hsf']")) return;

        const NS = "http://www.w3.org/2000/svg";
        const defs = document.createElementNS(NS, "defs");

        const fillId = `_hsf-fill-${index}`;
        const strokeId = `_hsf-stroke-${index}`;

        defs.innerHTML =
            `<linearGradient id="${fillId}" x1="0" y1="0" x2="1" y2="0">` +
            `<stop offset="50%" stop-color="#E5A000"/>` +
            `<stop offset="50%" stop-color="transparent"/>` +
            `</linearGradient>` +
            `<linearGradient id="${strokeId}" x1="0" y1="0" x2="1" y2="0">` +
            `<stop offset="50%" stop-color="#E5A000"/>` +
            `<stop offset="50%" stop-color="#E3E3E3"/>` +
            `</linearGradient>`;

        svg.insertBefore(defs, svg.firstChild);

        // Override CSS-driven fill/stroke with inline styles that point to
        // the local gradients — inline styles beat author CSS.
        const path = svg.querySelector("path");
        if (path) {
            path.style.fill = `url(#${fillId})`;
            path.style.stroke = `url(#${strokeId})`;
        }
    });
}

/** @type {Array<{name: string, build: (url: string) => string}>} */
const CORS_PROXIES = [
    // Cloudflare Worker — reliable, free, you control it
    { name: "my-worker", build: (u) => `https://img-proxy.gabriel-o-favero.workers.dev/?url=${encodeURIComponent(u)}` },
];

/**
 * Returns true if the URL points to a SteamGridDB CDN domain.
 * Only SteamGridDB images need CORS proxying; all other providers
 * (TMDB, OpenLibrary, MusicBrainz) send proper CORS headers.
 */
function isSteamGridDBUrl(url) {
    try {
        const host = new URL(url).host;
        return host.endsWith("steamgriddb.com");
    } catch {
        return false;
    }
}

/**
 * Ensure the cover image is a data: URL so html2canvas can render it
 * without CORS tainting.
 *
 * Only SteamGridDB CDN URLs go through the Cloudflare Worker proxy.
 * All other providers already have data URLs at this point and return
 * immediately.  If the proxy fails, the cover is hidden so the rest
 * of the card still renders correctly.
 */
async function ensureCoverCompatible() {
    const img = document.getElementById('canvas-cover');
    const src = img?.src;
    if (!src || src.startsWith('data:')) return;

    console.debug("[Canvas] Cover is remote URL, converting to data URL…");

    // 30 s timeout — large images (e.g. 851 KB SteamGridDB PNGs) can
    // take 15–25 s through image proxies on slower connections.
    const dataUrl = await raceProxies(src, 30_000);
    if (dataUrl) {
        img.src = dataUrl;
        await img.decode().catch(() => {});
        console.debug("[Canvas] Cover converted to data URL successfully");
    } else {
        // All proxies failed — hide the cover so html2canvas can still
        // render the rest of the card without a SecurityError.
        console.debug("[Canvas] All proxies failed, hiding cover for canvas render");
        img.style.display = 'none';
    }
}

/**
 * Fire every proxy in parallel; return the first successful data: URL.
 * If none respond within `timeoutMs`, abort all and return null.
 */
async function raceProxies(imageUrl, timeoutMs) {
    // Only SteamGridDB CDN URLs need CORS proxying — skip for everything else
    if (!isSteamGridDBUrl(imageUrl)) return null;

    const controllers = CORS_PROXIES.map(() => new AbortController());

    const attempts = CORS_PROXIES.map((proxy, i) =>
        tryOneProxy(proxy, imageUrl, controllers[i]).then(dataUrl => {
            controllers.forEach((c, j) => { if (j !== i) c.abort(); });
            return dataUrl;
        })
    );

    const deadline = new Promise((_, reject) =>
        setTimeout(() => {
            controllers.forEach(c => c.abort());
            reject(new Error("Proxy race timed out"));
        }, timeoutMs)
    );

    try {
        return await Promise.race([...attempts, deadline]);
    } catch {
        return null;
    }
}

async function tryOneProxy(proxy, imageUrl, controller) {
    const url = proxy.build(imageUrl);
    console.debug(`[Canvas] Racing ${proxy.name}…`);
    let res;
    try {
        res = await fetch(url, { signal: controller.signal });
    } catch (err) {
        // AbortError → another proxy already won or deadline fired.
        // Silently re-throw so we don't log a confusing "won" after
        // the race is already over.
        if (err.name === "AbortError") throw err;
        console.debug(`[Canvas] ${proxy.name} → fetch failed: ${err.message}`);
        throw err;
    }
    if (!res.ok) {
        console.debug(`[Canvas] ${proxy.name} → HTTP ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
    }
    const blob = await res.blob();
    if (!blob.size) {
        console.debug(`[Canvas] ${proxy.name} → empty response`);
        throw new Error("Empty response");
    }
    console.debug(`[Canvas] ${proxy.name} → won (${blob.size} bytes, type=${blob.type || "none"})`);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function renderText(id, value) {
    const div = document.getElementById(id);
    if (!value) {
        div.style.display = 'none';
        return;
    }
    div.textContent = value;
    div.style.display = 'block';
}

export function renderPlatformIcon(type = 'canvas') {
    const id = `${type}-icon`;
    const icon = document.getElementById(id);
    icon.innerHTML = '<use href="" />';
    const canvas = getPlatformProperties(PLATFORM)?.canvas ?? {};
    const platform = canvas?.['has-canvas-icon'] ? `${PLATFORM}-canvas` : PLATFORM;
    const widthMultiplier = canvas?.['width-multiplier'];
    updateInternalIcon(icon, platform, id, widthMultiplier);

    if (canvas.hide) {
        document.getElementById(`${type}-platform-container`).style.display = 'none';
        return;
    }
}

export function renderPlatformLabel(id = 'platform-text-display') {
    if (!PLATFORM) {
        renderText(id, '');
        return;
    }

    const canvas = getPlatformProperties(PLATFORM)?.canvas ?? {};
    const hideLabel = canvas['hide-default-label'] ?? false;
    const customPlatform = document.getElementById(`${TYPE}-id`)?.value;

    let text = '';
    if (!hideLabel) {
        text = customPlatform || translate(canvas.label || `type.${MACROTYPE}.platform.${PLATFORM}`);
    }

    renderText(id, text);
}

function renderStars() {
    loadStars(document.querySelectorAll('.rating-canvas'), RATING);
}

// Getters
export function getH1() {
    switch (TYPE) {
        case "music":
            return getMusicH1();
        default:
            return document.getElementById(`${TYPE}-title`).value.trim();
    }

    function getMusicH1() {
        if (!RADIO_VALUES.music.type || !RADIO_VALUES.music.subtype) {
            return '';
        }
        return document.getElementById(`${RADIO_VALUES.music.type}-${RADIO_VALUES.music.subtype}`).value.trim();
    }
}

export function getH2() {
    switch (TYPE) {
        case "tv":
            return getTvH2();
        case "music":
            return getMusicH2();
        case "book":
            return document.getElementById('book-author').value.trim()
        default:
            return '';
    }

    function getTvH2() {
        const season = document.getElementById('tv-season').value.trim();
        const episode = document.getElementById('tv-episode').value.trim();
        switch (RADIO_VALUES.tv.subtype) {
            case 'episode':
                return getSeasonEpisode(season, episode);
            case 'season':
                return `${translate('type.tv.season')} ${season}`
            default:
                return '';
        }
    }

    function getMusicH2() {
        const artist = document.getElementById('music-artist').value.trim();
        switch (RADIO_VALUES.music.subtype) {
            case 'album':
            case 'song':
                return artist;
            default:
                return '';
        }
    }
}

function getShareText() {
    const content = getShareContent();
    const rating = '★'.repeat(RATING) + '☆'.repeat(5 - RATING);
    const emoji = getShareEmoji();
    return translate('label.share-text', { content, rating, emoji });

    function getShareContent() {
        switch (TYPE) {
            case "book":
                return getBookContent();
            case "game":
                return getGameContent();
            case "music":
                return getMusicContent();
            case "tv":
                return getTvContent();
            case "movie":
            case "other":
                return getTitleContent();
            default:
                return '';
        }

        function getBookContent() {
            const title = document.getElementById('book-title').value.trim();
            const author = document.getElementById('book-author').value.trim();
            return translate('type.book.share-content', { title, author });
        }

        function getGameContent() {
            const title = document.getElementById('game-title').value.trim();
            const platform = translate(`type.${TYPE}.platform.${PLATFORM}`);
            return translate('type.game.share-content', { title, platform });
        }

        function getTitleContent() {
            const title = document.getElementById(`${TYPE}-title`).value.trim();
            return translate(`type.${TYPE}.share-content`, { title });
        }

        function getMusicContent() {
            const song = document.getElementById('music-song').value.trim();
            const artist = document.getElementById('music-artist').value.trim();
            const album = document.getElementById('music-album').value.trim();
            return translate(`type.music.share-content.${RADIO_VALUES.music.subtype}`, { song, artist, album });
        }

        function getTvContent() {
            const title = document.getElementById('tv-title').value.trim();
            const season = document.getElementById('tv-season').value.trim();
            const episode = document.getElementById('tv-episode').value.trim();
            return translate(`type.tv.share-content.${RADIO_VALUES.tv.subtype}`, { title, season, episode });
        }

    }

    function getShareEmoji() {
        switch (RATING) {
            case 1:
                return '💀';
            case 2:
                return '😵‍💫';
            case 3:
                return '😊';
            case 4:
                return '😎';
            case 5:
                return '🤩';
            default:
                return '';
        }
    }
}

function getSeasonEpisode(seasonValue, episodeValue) {
    const season = String(parseInt(seasonValue)).padStart(2, '0');
    const episode = String(parseInt(episodeValue)).padStart(2, '0');
    return translate('type.tv.full-season-episode', { season, episode });
}

