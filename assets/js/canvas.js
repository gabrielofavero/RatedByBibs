import { translate } from "./translation/translation.js";
import { getRadioCheckedID, loadStars } from "./ui/forms.js";
import { MACROTYPE, TYPE } from "./ui/steps/step-1.js";
import { PLATFORM, getPlatformProperties, updateInternalIcon } from "./ui/steps/step-2.js";
import { COVER, RATING } from "./ui/steps/step-3.js";

let GENERATED_IMAGE = '';
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
    a.download = 'rated-content.png';
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

