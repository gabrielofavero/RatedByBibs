import { setNexButtontVisibility, setBackButtontVisibility } from "../forms.js";
import { translate } from "../translation.js";
import { loadStep2 } from "./step-2.js";
import { loadStep3 } from "./step-3.js";

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

    const previousStep = CURRENT_STEP;
    CURRENT_STEP = direction === 'next' ? CURRENT_STEP + 1 : CURRENT_STEP - 1

    loadStepActions();
    animate(previousStep);
    loadStepButtonsVisibility();
}

function animate(previousStep) {
    const slider = document.getElementById('slider');
    const steps = slider.querySelectorAll('.step');

    if (IS_ANIMATING || previousStep === CURRENT_STEP) return;
    IS_ANIMATING = true;

    const i = previousStep - 1;
    const j = CURRENT_STEP - 1;

    // Show both previous and current box
    steps[i].style.visibility = 'visible';
    steps[j].style.visibility = 'visible';

    slider.style.transform = `translateX(-${j * 100}vw)`;

    // Wait for transition to end
    slider.addEventListener('transitionend', function handler() {
        steps[i].style.visibility = 'hidden';
        IS_ANIMATING = false;
        slider.removeEventListener('transitionend', handler);
    });
}

function loadStepButtonsVisibility() {
    document.getElementById('next').textContent = getStepTextContent();
    setNexButtontVisibility();
    setBackButtontVisibility();
}

function getStepTextContent() {
    switch (CURRENT_STEP) {
        case 1:
            return translate('navigation.begin');
        case 3:
            return translate('navigation.finish');
        default:
            return translate('navigation.next');
    }
}

function loadStepActions() {
    switch (CURRENT_STEP) {
        case 2:
            loadStep2();
        case 3:
            loadStep3();
    }
}