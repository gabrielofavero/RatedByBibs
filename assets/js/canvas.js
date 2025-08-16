import { TYPE } from "./ui/steps/step-1.js";
import { PLATFORM } from "./ui/steps/step-2.js";
import { COVER, RATING } from "./ui/steps/step-3.js";
import { getRadioCheckedID } from "./ui/forms.js";

let GENERATED_IMAGE = '';

// Main Functions
export async function generateCanvas() {
    renderCover();
    
    renderText('h1-display', getH1());
    renderText('h2-display', getH2());
    renderText('h3-display', getH3());
    
    renderPlatformIcon();
    renderText('platform-text-display', getPlatformText());

    renderText('star-rating', getRating());
    
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
                text: `I rated a game ${RATING}/5 on ${document.getElementById('platform-select').value}! 🎮`
            });
        } catch (err) {
            alert("Sharing failed: " + err.message);
        }
    } else {
        alert("Sharing not supported on this browser/device.");
    }
}

// Renderers
function renderCover() {
    document.getElementById('canvas-cover').style.backgroundImage = `url(${COVER})`;
}

export async function renderCanvas() {
    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.style.display = 'flex';

    const canvas = await html2canvas(canvasContainer, { backgroundColor: null });
    const dataUrl = canvas.toDataURL('image/png');
    GENERATED_IMAGE = dataUrl;

    const img = document.createElement('img');
    img.src = dataUrl;
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    preview.appendChild(img);

    canvasContainer.style.display = 'none';
    document.getElementById('download-share-buttons').style.display = 'block';
}

function renderText(id, value) {
    if (value) {
        const div = document.getElementById(id);
        div.textContent = value;
        div.style.display = 'block';
    }
}

function renderPlatformIcon() {
    const platformIcon = document.createElement('img');
    platformIcon.src = `assets/icons/${PLATFORM}.png`;
    platformIcon.style.height = '40px';
    document.getElementById('platform-display').innerHTML = '';
    document.getElementById('platform-display').appendChild(platformIcon);
}

// Getters
function getH1() {
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

function getH2() {
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
        const album = document.getElementById('music-album-title').value.trim();
        switch (getRadioCheckedID('.radios.music')) {
            case 'music-radio-album':
                return artist;
            case 'music-radio-song':
                return album || artist;
            default:
                return '';
        }
    }
}

function getH3() {
    switch (TYPE) {
        case "music":
            return getMusicH3();
        default:
            return '';
    }

    function getMusicH3() {
        switch (getRadioCheckedID('.radios.music')) {
            case 'music-radio-song':
                return document.getElementById('music-album-title').value.trim();
            default:
                return '';
        }
    }
}

function getPlatformText() {

}


function getRating() {
    return '★'.repeat(RATING) + '☆'.repeat(5 - RATING);
}