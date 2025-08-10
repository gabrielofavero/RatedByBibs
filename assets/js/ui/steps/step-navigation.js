import { loadStep1 } from "./step-1.js";
import { loadStep2 } from "./step-2.js";
import { loadStep3 } from "./step-3.js";
import { loadStep4 } from "./step-4.js";
import { loadStep5 } from "./step-5.js";

export let CURRENT_STEP = 1;

let IS_ANIMATING = false;

export function nextStep() {
    transitionStep('next');
}

export function previousStep() {
    transitionStep('back');
}

export function resetSteps() {
    const previousStep = CURRENT_STEP;
    CURRENT_STEP = 1;
    loadStepActions();
    animate(previousStep);
}

function transitionStep(direction) {
    const target = document.getElementById(direction);
    if (target.classList.contains('disabled')) return;

    const previousStep = CURRENT_STEP;
    const currentStep = direction === 'next' ? CURRENT_STEP + 1 : CURRENT_STEP - 1

    if (currentStep < 1 || currentStep > 5) {
        console.error('Cannot navigate to an inexistent step');
        return;
    }

    CURRENT_STEP = currentStep;

    loadStepActions();
    animate(previousStep);
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

function loadStepActions() {
    switch (CURRENT_STEP) {
        case 1:
            loadStep1();
            break;
        case 2:
            loadStep2();
            break;
        case 3:
            loadStep3();
            break;
        case 4:
            loadStep4();
            break;
        case 5:
            loadStep5();
    }
}