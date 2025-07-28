import { TYPE, TYPES } from "./forms.js";
import { translate } from "./translation.js";
import { PLATFORMS, adjustPageHeight } from "./app.js";
import { USER_LANGUAGE } from "./translation.js";

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
        default:
            return true;
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
        default:
            adjustPageHeight();
    }
}

function loadStep2Options() {
    for (const type of TYPES) {
        document.getElementById(`${type}-options`).style.display = type === TYPE ? 'flex' : 'none';
    }

    const platformContainer = document.getElementById('platform-container');

    if (['book', 'other'].includes(TYPE)) {
        platformContainer.style.display = 'none';
    } else {
        platformContainer.style.display = '';
        loadStep2Platforms();
    }
}

function loadStep2Platforms() {
    const platforms = PLATFORMS?.[TYPE]?.[USER_LANGUAGE];
    if (platforms && platforms.length > 0) {
        for (let j = 1; j <= 5; j++) {
            const platform = platforms[j - 1];
            const background = document.getElementById(`platform-background-${j}`);
            const icon = document.getElementById(`platform-icon-${j}`);
            const label = document.getElementById(`platform-label-${j}`);

            background.className = 'background';
            icon.setAttribute("class", "icon");
            label.textContent = '';

            if (platform) {
                background.classList.add(platform);
                icon.classList.add(platform);
                label.textContent = translate(`label.${TYPE}.platform.${platform}`)
                icon.querySelector("use").setAttribute("href", `#icon-${platform}`);
                document.getElementById(`platform-${j}`).setAttribute('platform', platform);
            }
        }
    }
}