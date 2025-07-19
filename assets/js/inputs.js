import { generateCanvas, shareCanvas, downloadCanvas } from "./canvas.js";

export let UPLOAD_IMAGE = null;
export let STARS = 0;

export function updateInputsWithLocalStorage() {
    document.getElementById('title').value = localStorage.getItem('title') || '';
    document.getElementById('platform-select').value = localStorage.getItem('selectedPlatform') || '';
    document.getElementById('gaming-id').value = localStorage.getItem('gamingId') || '';
    updatePlatformProperties(document.getElementById('platform-select').value);
}

export function loadEventListeners() {
    loadStarsListeners();
    document.getElementById('title').onchange = e => localStorage.setItem('title', e.target.value);
    document.getElementById('platform-select').onchange = e => updatePlatform(e.target.value);
    document.getElementById('gaming-id').oninput = e => localStorage.setItem('gamingId', e.target.value);
    document.getElementById('upload').onchange = e => upload(e.target.files[0]);
    document.getElementById('generate-canvas').addEventListener('click', generateCanvas);
    document.getElementById('share').addEventListener('click', shareCanvas);
    document.getElementById('download').addEventListener('click', downloadCanvas);
}

function updatePlatform(value) {
    localStorage.setItem('selectedPlatform', value);
    updatePlatformProperties(value);
}

function updatePlatformProperties(value) {
    let placeholder;
    let length;

    switch (value) {
        case 'xbox':
            placeholder = 'Gamertag';
            length = 12;
            break;
        case 'switch':
        case 'switch2':
            placeholder = 'Nintendo Account';
            length = 20;
            break;
        case 'steam':
            placeholder = 'Steam ID';
            length = 32;
            break;
        case 'playstation':
            placeholder = 'PSN ID';
            length = 16;
            break;
        default:
            placeholder = 'Gaming ID';
            length = 32;
    }

    const gamingIdInput = document.getElementById('gaming-id');
    gamingIdInput.placeholder = `${placeholder} (optional)`;
    gamingIdInput.maxLength = length;
}

function upload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        UPLOAD_IMAGE = event.target.result;
        document.getElementById('cover').style.backgroundImage = `url(${UPLOAD_IMAGE})`;
    };
    reader.readAsDataURL(file);
    document.getElementById('upload-instructions').style.display = 'none';
    document.getElementById('upload-success').style.display = 'block';
}

function loadStarsListeners() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            STARS = parseInt(star.dataset.value);
            stars.forEach(star => {
                const val = parseInt(star.dataset.value);
                star.classList.toggle('selected', val <= STARS);
                updateStarRatingLabel();
            });
        });
    });
}

function updateStarRatingLabel() {
    let label;

    switch (STARS) {
        case 1:
            label = 'Terrible';
            break;
        case 2:
            label = 'Bad';
            break;
        case 3:
            label = 'Okay';
            break;
        case 4:
            label = 'Good';
            break;
        case 5:
            label = 'Excellent';
            break;
        default:
            label = 'Select a Rating';
    }

    document.getElementById('star-rating-label').textContent = label;
}