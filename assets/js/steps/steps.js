import { TYPE, setNexButtontVisibility, setBackButtontVisibility } from "../forms.js";
import { translate } from "../translation.js";
import { loadStep2, isStep2NextDisabled } from "./step-2.js";

export let CURRENT_STEP = 1;
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
    loadStepActions(newStep);
    animate(newStep);
    loadStepButtonsVisibility(newStep);
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

function loadStepButtonsVisibility(step) {
    document.getElementById('next').textContent = getStepTextContent(step);
    setNexButtontVisibility();
    setBackButtontVisibility();
}

function getStepTextContent(step) {
    switch (step) {
        case 1:
            return translate('navigation.begin');
        case 4:
            return translate('navigation.finish');
        default:
            return translate('navigation.next');
    }
}

function loadStepActions(step) {
    switch (step) {
        case 2:
            loadStep2();
    }
}