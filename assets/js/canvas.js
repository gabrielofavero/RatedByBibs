import { getRadioCheckedID, loadStars } from "./ui/forms.js";
import { MACROTYPE, TYPE } from "./ui/steps/step-1.js";
import { PLATFORM, getPlatformProperties, updatePlatformIcon } from "./ui/steps/step-2.js";
import { COVER, RATING } from "./ui/steps/step-3.js";

let GENERATED_IMAGE = '';

// Main Functions
export async function generateCanvas() {
    renderCover();

    renderText('h1-display', getH1());
    renderText('h2-display', getH2());

    renderPlatformIcon();
    renderText('platform-text-display', getPlatformText());

    renderStars();

    await renderCanvas();
}

export async function downloadCanvas() {
    if (!GENERATED_IMAGE) {
        await generateCanvas();
    }
    const a = document.createElement('a');
    a.href = GENERATED_IMAGE;
    a.download = 'game-story.png';
    a.click();
}

export async function shareCanvas() {
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

    const svgElements = canvasContainer.querySelectorAll('svg');
    svgElements.forEach(function(item) {
        item.setAttribute("width", item.getBoundingClientRect().width);
        item.setAttribute("height", item.getBoundingClientRect().height);
        item.style.width = null;
        item.style.height= null;
    });

    const canvas = await html2canvas(canvasContainer);
    const dataUrl = canvas.toDataURL('image/png');
    GENERATED_IMAGE = dataUrl;

    canvasContainer.style.display = 'none';
}

function renderText(id, value) {
    if (value) {
        const div = document.getElementById(id);
        div.textContent = value;
        div.style.display = 'block';
    }
}

export function renderPlatformIcon(type = 'canvas') {
    const internalIcon = document.getElementById(`${type}-internal-icon`);
    const externalIcon = document.getElementById(`${type}-external-icon`);
    const properties = getPlatformProperties(PLATFORM, `${type}-icon`);
    updatePlatformIcon(internalIcon, externalIcon, PLATFORM, properties);
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

export function getPlatformText() {
    const id = document.getElementById(`${TYPE}-id`)?.value;
    return id || translate(`${MACROTYPE}.platform.${PLATFORM}`);
}

