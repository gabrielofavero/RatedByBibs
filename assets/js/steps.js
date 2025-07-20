import { TYPE } from "./forms.js";
import { translate } from "./translation.js";

export function nextStep() {
    transitionStep('next');
}

export function previousStep() {
    transitionStep('back');
}

function transitionStep(direction) {
    const next = document.getElementById('next');
    const back = document.getElementById('back');
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

    animate(from, to, direction);
    loadStepButtonsVisibility(to.id, back, next);
}

function animate(from, to, direction) {
    const hideClass = direction === 'next' ? 'hidden-left' : 'hidden-right';

    // Prepare the incoming step
    to.classList.remove('hidden', 'hidden-left', 'hidden-right');
    to.style.display = 'block'; // Ensure it's rendered

    // Force a reflow to make sure the next style change gets transitioned
    void to.offsetWidth;

    // Show incoming step
    to.classList.add('visible');

    // Animate the outgoing step
    from.classList.remove('visible');
    from.classList.add(hideClass);

    // After animation, hide the outgoing step
    from.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'transform') {
            from.style.display = 'none';
            from.classList.remove(hideClass); // optional: clean up
            from.removeEventListener('transitionend', handler);
        }
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