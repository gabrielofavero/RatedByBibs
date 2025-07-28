import { generateCanvas, shareCanvas, downloadCanvas } from "./canvas.js";
import { nextStep, previousStep } from "./steps/steps.js";
import { isNextDisabled } from "./steps/steps.js";

export let TYPE;
export let PLATFORM;
export const TYPES = ['movie', 'tv', 'game', 'music', 'book', 'other']
export let UPLOAD_IMAGE = null;
export let STARS = 0;

export function loadEventListeners() {
    loadGridListeners();
    loadInputListeners();
    loadStarsListeners();

    document.getElementById('next').addEventListener('click', nextStep);
    document.getElementById('back').addEventListener('click', previousStep);

    document.getElementById('upload').onchange = e => upload(e.target.files[0]);
    document.getElementById('generate-canvas').addEventListener('click', generateCanvas);
    document.getElementById('share').addEventListener('click', shareCanvas);
    document.getElementById('download').addEventListener('click', downloadCanvas);

    Array.from(document.getElementsByClassName('required-input')).forEach(input => {
        input.addEventListener('input', () => {
            const isDisabled = isNextDisabled();
            disableIfInactive(isDisabled);
        });
    });


}

export function disableIfInactive(isDisabled, div = document.getElementById('next')) {
    if (isDisabled) {
        if (div.classList.contains('disabled')) return;
        div.classList.add('disabled');
    } else {
        div.classList.remove('disabled');
    }
}

function loadGridListeners() {
    const types = document.getElementsByClassName('grid-item type');
    for (const type of types) {
        type.addEventListener('click', () => {
            const isDisabling = TYPE === type.id;
            const newType = isDisabling ? '' : type.id;
            TYPE = newType;

            for (const innerDiv of types) {
                const criteria = isDisabling ? false : innerDiv.id === type.id;
                innerDiv.classList.toggle('selected', criteria);
            }

            const next = document.getElementById('next');
            if (TYPE) {
                next.classList.remove('disabled')
            } else {
                next.classList.add('disabled')
            }
        });
    };

    const platforms = document.getElementsByClassName('grid-item platform');
    for (const div of platforms) {
        div.addEventListener('click', () => {
            const platform = div.getAttribute('platform');
            const isDisabling = PLATFORM === platform;
            const newPlatform = isDisabling ? '' : platform;
            PLATFORM = newPlatform;

            for (const innerDiv of platforms) {
                const criteria = isDisabling ? false : innerDiv.getAttribute('platform') === platform;
                innerDiv.classList.toggle('selected', criteria);
            }

            disableIfInactive(isNextDisabled());
        });
    };
}

function loadInputListeners() {
    document.getElementById('tv-season').onchange = () => blockTVShowNumber('tv-season');
    document.getElementById('tv-episode').onchange = () => blockTVShowNumber('tv-episode');
}

function blockTVShowNumber(id) {
    const input = document.getElementById(id);
    const value = parseInt(input.value);
    if (isNaN(value) || value < 1) {
        input.value = '';
    }
}

function upload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        UPLOAD_IMAGE = event.target.result;
        document.getElementById('canvas-cover').style.backgroundImage = `url(${UPLOAD_IMAGE})`;
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