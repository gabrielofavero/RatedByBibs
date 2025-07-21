import { TYPE } from "./forms.js";
import { translate } from "./translation.js";

let CURRENT_STEP = 1;
let IS_ANIMATING = false;

export function nextStep() {
    transitionStep('next');
}

export function previousStep() {
    transitionStep('back');
}

function transitionStep(direction) {
    const target = document.getElementById(direction);
    if (target.classList.contains('disabled')) return;

    const newStep = direction === 'next' ? CURRENT_STEP + 1 : CURRENT_STEP - 1
    animate(newStep);
    loadStepButtonsVisibility(`step-${newStep + 1}`, back, next);
}

function animate(newStep) {
    const slider = document.getElementById('slider');
    const steps = slider.querySelectorAll('.step');

    if (IS_ANIMATING || newStep === CURRENT_STEP) return;
    IS_ANIMATING = true;

    const i = CURRENT_STEP - 1;
    const j = newStep - 1;

    // Show both current and next box
    steps[i].style.visibility = 'visible';
    steps[j].style.visibility = 'visible';

    slider.style.transform = `translateX(-${j * 100}vw)`;

    // Wait for transition to end
    slider.addEventListener('transitionend', function handler() {
        steps[i].style.visibility = 'hidden';
        CURRENT_STEP = newStep;
        IS_ANIMATING = false;
        slider.removeEventListener('transitionend', handler);
    });
}

function loadStepButtonsVisibility(stepID, back, next) {
    next.textContent = getStepTextContent(stepID);
    disableIfInactive(isNextDisabled(stepID), next);
    disableIfInactive(isBackDisabled(stepID), back);
}

function disableIfInactive(isDisabled, div) {
    if (isDisabled) {
        div.classList.add('disabled');
    } else {
        div.classList.remove('disabled');
    }
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

function isNextDisabled(stepID) {
    switch (stepID) {
        case 'step-1':
            return !TYPE;
        case 'step-4':
            return true;
        default:
            return false;
    }
}

function isBackDisabled(stepID) {
    switch (stepID) {
        case 'step-1':
        case 'step-4':
            return true;
        default:
            return false;
    }
}