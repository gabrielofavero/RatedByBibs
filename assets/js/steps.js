import { TYPE, TYPES } from "./forms.js";
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
    const stepID = `step-${newStep}`;
    loadStepActions(stepID);
    animate(newStep);
    loadStepButtonsVisibility(stepID, back, next);
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
            return translate('navigation.begin');
        case 'step-4':
            return translate('navigation.finish');
        default:
            return translate('navigation.next');
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

function loadStepActions(stepID) {
    switch (stepID) {
        case 'step-2':
            loadStep2Options();
    }
}

function loadStep2Options() {
    for (const type of TYPES) {
        document.getElementById(`${type}-options`).style.display = type === TYPE ? 'flex' : 'none';
    }
    document.getElementById('platform-container').style.display = ['book', 'other'].includes(TYPE) ? 'none' : '';
}