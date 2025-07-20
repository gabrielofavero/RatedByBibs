import { generateCanvas, shareCanvas, downloadCanvas } from "./canvas.js";
import { translate } from "./translation.js";

export let TYPE;
export let UPLOAD_IMAGE = null;
export let STARS = 0;

export function loadEventListeners() {
    loadTypeListeners();

    loadStarsListeners();

    document.getElementById('next').addEventListener('click', nextStep);
    document.getElementById('back').addEventListener('click', previousStep);

    document.getElementById('platform-select').onchange = e => updatePlatformProperties(e.target.value);
    document.getElementById('upload').onchange = e => upload(e.target.files[0]);
    document.getElementById('generate-canvas').addEventListener('click', generateCanvas);
    document.getElementById('share').addEventListener('click', shareCanvas);
    document.getElementById('download').addEventListener('click', downloadCanvas);
}

function loadTypeListeners() {
    const divs = document.getElementsByClassName('type-button');
    for (const div of divs) {
        div.addEventListener('click', () => {
            TYPE = div.id;
            for (const innerDiv of divs) {
                innerDiv.classList.toggle('selected', innerDiv.id === div.id);
            }
            const next = document.getElementById('next');
            if (TYPE) {
                next.classList.remove('disabled')
            }
        });
    };
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

function transitionStep(direction) {
    const next = document.getElementById('next');
    const back = document.getElementById('next');
    const target = direction === 'next' ? next : back;

    if (target.classList.contains('disabled')) return;

    let from, to;
    let j = 1;
 
    while (!from && !to) {
        const step = document.getElementById(`step-${j}`);
        if (!step) break;

        if (step.classList.contains('visible')) {
            from = step;
            const offset = direction === 'next' ? 1 : -1;
            to = document.getElementById(`step-${j + offset}`);
        } else {
            j++;
        }
    }

    if (!from || !to) return;
 
    const hideClass = direction === 'next' ? 'hidden-left' : 'hidden-right';

    from.classList.remove('visible');
    from.classList.add(hideClass);

    to.classList.remove('hidden', 'hidden-left', 'hidden-right');
    to.classList.add('visible');

    const stepID = to.id;
    next.textContent = getStepTextContent(stepID);

    if (isStepRequired(stepID)) {
        next.classList.add('disabled');
    } else {
        next.classList.remove('disabled');
    }

    if (isStepReturnable(stepID)) {
        back.classList.add('disabled');
    } else {
        back.classList.remove('disabled');
    }
}

function nextStep() {
    transitionStep('next');
}

function previousStep() {
    transitionStep('back');
}


function getStepTextContent(stepID) {
    switch (stepID) {
        case 'step-1':
            return translate('begin');
        case 'step-4':
            return translate('finish');
        default:
            return translate('next');
    }
}

function isStepRequired(stepID) {
    switch (stepID) {
        case 'step-1':
        case 'step-4':
            return true;
        default:
            return false;
    }
}

function isStepReturnable(stepID) {
    switch (stepID) {
        case 'step-1':
        case 'step-4':
            return false;
        default:
            return true;
    }
}