import { TYPE, disableIfInactive } from "../forms.js";
import { translate } from "../translation.js";
import { loadStep2, isStep2NextDisabled } from "./step-2.js";

let CURRENT_STEP = 1;
let IS_ANIMATING = false;

export function nextStep() {
    transitionStep('next');
}

export function previousStep() {
    transitionStep('back');
}

export function isNextDisabled(stepID) {
    if (!stepID) {
        stepID = `step-${CURRENT_STEP}`;
    }
    switch (stepID) {
        case 'step-1':
            return !TYPE;
        case 'step-2':
            return isStep2NextDisabled();
        default:
            return true;
    }
}

function transitionStep(direction) {
    const target = document.getElementById(direction);
    if (target.classList.contains('disabled')) return;

    const newStep = direction === 'next' ? CURRENT_STEP + 1 : CURRENT_STEP - 1
    const stepID = `step-${newStep}`;
    loadStepActions(stepID);
    animate(newStep);
    loadStepButtonsVisibility(stepID);
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

function loadStepButtonsVisibility(stepID) {
    next.textContent = getStepTextContent(stepID);
    disableIfInactive(isNextDisabled(stepID), 'next');
    disableIfInactive(isBackDisabled(stepID), 'back');
}

function getStepTextContent(stepID) {
    switch (stepID) {
        case 'step-1':
            return translate('navigation.begin');
        case 'step-4':
            return translate('navigation.finish');
        default:
            return translate('navigation.next');
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

function loadStepActions(stepID) {
    switch (stepID) {
        case 'step-2':
            loadStep2();
    }
}