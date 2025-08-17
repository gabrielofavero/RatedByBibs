import { translate } from "./translation/translation.js";
import { getRadioCheckedID, loadStars } from "./ui/forms.js";
import { MACROTYPE, TYPE } from "./ui/steps/step-1.js";
import { PLATFORM, getPlatformProperties, updateInternalIcon } from "./ui/steps/step-2.js";
import { COVER, RATING } from "./ui/steps/step-3.js";

let GENERATED_IMAGE = '';

// Main Functions
export async function generateCanvas() {
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
    a.download = 'rated-content.png';
    a.click();
}

async function shareCanvas() {
    if (!GENERATED_IMAGE) {
    }

    const res = await fetch(GENERATED_IMAGE);
    const blob = await res.blob();
    const file = new File([blob], 'game-story.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Rated! By Bibs',
                text: `I rated ${RATING}/5 on ${document.getElementById('h1-display').innerText}!`
            });
        } catch (err) {
            downloadCanvas();
        }
    } else {
        downloadCanvas();
    }
}

// Renderers
function renderCover() {
    document.getElementById('canvas-cover').src = COVER;
}

async function renderCanvas() {
    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.style.display = 'flex';

    renderInlineSvgUses(canvasContainer);

    const canvas = await html2canvas(canvasContainer);
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

function renderText(id, value) {
    const div = document.getElementById(id);
    if (!value) {
        div.style.display = 'none';
        return;
    }
    div.textContent = value;
    div.style.display = 'block';
}

export function renderPlatformIcon(id = 'canvas-icon') {
    const icon = document.getElementById(id);
    const canvas = getPlatformProperties(PLATFORM)?.canvas;
    const platform = canvas?.['has-canvas-icon'] ? `${PLATFORM}-canvas` : PLATFORM;
    const widthMultiplier = canvas?.['width-multiplier'];
    updateInternalIcon(icon, platform, id, widthMultiplier);
}

export function renderPlatformLabel(id = 'platform-text-display') {
    const hideLabel = getPlatformProperties(PLATFORM)?.canvas?.['hide-default-label'] || false;
    const customPlatform = document.getElementById(`${TYPE}-id`)?.value;
    const textContent = customPlatform || (hideLabel ? '' : translate(`${MACROTYPE}.platform.${PLATFORM}`));
    renderText(id, textContent);
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
        switch (getRadioCheckedID('.radios.music')) {
            case 'music-radio-album':
                return document.getElementById('music-album-title').value.trim();
            case 'music-radio-artist':
                return document.getElementById('music-artist-name').value.trim();
            case 'music-radio-song':
                return document.getElementById('music-song-title').value.trim();
            default:
                return '';
        }
    }
}

export function getH2() {
    switch (TYPE) {
        case "tv":
            return getTvH2();
        case "music":
            return getMusicH2();
        default:
            return '';
    }

    function getTvH2() {
        const season = document.getElementById('tv-season').value.trim();
        const episode = document.getElementById('tv-episode').value.trim();
        switch (getRadioCheckedID('.radios.tv')) {
            case 'tv-radio-episode':
                return translate('tv.subtitle.episode', { season, episode });
            case 'tv-radio-season':
                return `${translate('tv.season')} ${season}`
            default:
                return '';
        }
    }

    function getMusicH2() {
        const artist = document.getElementById('music-artist-name').value.trim();
        switch (getRadioCheckedID('.radios.music')) {
            case 'music-radio-album':
            case 'music-radio-song':
                return artist;
            default:
                return '';
        }
    }
}

