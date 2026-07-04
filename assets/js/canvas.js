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
export async function generateCanvas() {
    loadRadioValues();
    renderCover();

    renderText('h1-display', getH1());
    renderText('h2-display', getH2());

    renderPlatformIcon();
    renderPlatformLabel();

    renderStars();

    await renderCanvas();
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
    img.crossOrigin = "anonymous";  // SW injects CORS headers for CDN images
    img.src = COVER;
}

async function renderCanvas() {
    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.style.display = 'flex';

    renderInlineSvgUses(canvasContainer);
    fixHalfStarGradients(canvasContainer);
    await ensureCoverCompatible();

    const canvas = await html2canvas(canvasContainer, {
        useCORS: true,  // Enables crossOrigin for all images; SW adds CORS headers
    });
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
    // Dedicated image proxies (try first — CDNs are less likely to block these)
    { name: "weserv",       build: (u) => `https://images.weserv.nl/?url=${encodeURIComponent(u)}` },
    { name: "wsrv",         build: (u) => `https://wsrv.nl/?url=${encodeURIComponent(u)}` },
    // General-purpose CORS proxies (fallback)
    { name: "corsproxy.io",  build: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
    { name: "allorigins",    build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
    { name: "corsanywhere",  build: (u) => `https://cors-anywhere.herokuapp.com/${u}` },
    { name: "corsbridge",    build: (u) => `https://cors.bridged.cc/${u}` },
];

/**
 * Ensure the cover image is a data: URL so html2canvas can render it
 * without CORS tainting.
 *
 * Races all proxies with a generous timeout (image proxies like weserv.nl
 * are tried first).  If every attempt fails we hide the cover image so the
 * rest of the card still renders correctly.
 */
async function ensureCoverCompatible() {
    const img = document.getElementById('canvas-cover');
    const src = img?.src;
    if (!src || src.startsWith('data:')) return;

    console.debug("[Canvas] Cover is remote URL, converting to data URL…");

    const dataUrl = await raceProxies(src, 15_000);
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
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    // Accept any non-empty blob — some proxies return valid images
    // without an image/* MIME type.
    if (!blob.size) throw new Error("Empty response");
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

