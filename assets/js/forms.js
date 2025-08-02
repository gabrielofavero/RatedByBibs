import { generateCanvas, shareCanvas, downloadCanvas } from "./canvas.js";
import { CURRENT_STEP, nextStep, previousStep } from "./steps/steps.js";
import { isStep2NextDisabled } from "./steps/step-2.js";

export let TYPE;
export let PLATFORM;
export const TYPES = ['movie', 'tv', 'game', 'music', 'book', 'other']
export let UPLOAD_IMAGE = null;
export let STARS = 0;

export function loadFormEventListeners() {
    loadGridListeners();
    loadStarsListeners();

    document.getElementById('next').addEventListener('click', nextStep);
    document.getElementById('back').addEventListener('click', previousStep);

    document.getElementById('upload').onchange = e => upload(e.target.files[0]);
    document.getElementById('generate-canvas').addEventListener('click', generateCanvas);
    document.getElementById('share').addEventListener('click', shareCanvas);
    document.getElementById('download').addEventListener('click', downloadCanvas);
}

export function setNexButtontVisibility(customCriteria) {
    const isDisabled = customCriteria || isNextDisabled();
    setButtonVisibility(isDisabled, 'next');
}

export function setBackButtontVisibility(customCriteria) {
    const isDisabled = customCriteria || isBackDisabled();
    setButtonVisibility(isDisabled, 'back');
}

export function setButtonVisibility(isDisabled, divID) {
    const div = document.getElementById(divID);
    if (isDisabled) {
        if (div.classList.contains('disabled')) return;
        div.classList.add('disabled');
    } else {
        div.classList.remove('disabled');
    }
}

function isNextDisabled() {
    switch (CURRENT_STEP) {
        case 1:
            return !TYPE;
        case 2:
            return isStep2NextDisabled();
        default:
            return true;
    }
}

function isBackDisabled() {
    switch (CURRENT_STEP) {
        case 1:
        case 4:
            return true;
        default:
            return false;
    }
}

function loadGridListeners() {
    loadGridTypeListeners();
    loadGridPlatformListeners();
}

function loadGridTypeListeners() {
    const types = document.getElementsByClassName('grid-item type');
    for (const type of types) {
        type.addEventListener('click', () => {
            const unselected = TYPE === type.id;
            const newType = unselected ? '' : type.id;
            TYPE = newType;

            for (const innerDiv of types) {
                const criteria = unselected ? false : innerDiv.id === type.id;
                innerDiv.classList.toggle('selected', criteria);
            }

            setNexButtontVisibility(!TYPE)
        });
    };
}

export function loadGridPlatformListeners(platformID = 'platform', disableID = 'next') {
    const platforms = document.getElementsByClassName(`grid-item ${platformID}`);
    for (const div of platforms) {
        div.addEventListener('click', () => {
            const platform = div.getAttribute('platform');
            const unselected = PLATFORM === platform;
            PLATFORM = unselected ? '' : platform;

            for (const innerDiv of platforms) {
                const isSelected = unselected ? false : innerDiv.getAttribute('platform') === platform;
                innerDiv.classList.toggle('selected', isSelected);
            }

            const disableCriteria = disableID === 'next' ? isNextDisabled() : !PLATFORM;
            setButtonVisibility(disableCriteria, disableID);
        });
    };
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