import { CURRENT_STEP } from "./steps/step-navigation.js";
import { translate } from "../translation/translation.js";

export const NAVIAGATION_LABELS = {
    begin: '',
    next: '',
    finish: ''
}

export function setNavigationLabels() {
    NAVIAGATION_LABELS.begin = translate('label.begin');
    NAVIAGATION_LABELS.next = translate('label.next');
    NAVIAGATION_LABELS.finish = translate('label.finish');
}

export function adaptPageHeight() {
    const userHeight = window.innerHeight;
    const bodyPaddingUp = parseInt(getComputedStyle(document.body).paddingTop);
    const header = document.getElementById('header').offsetHeight;
    const step = document.getElementById(`step-${CURRENT_STEP}-content`).offsetHeight;
    const safezone = 16;
    const nextContainer = document.getElementById('next-container').offsetHeight;

    const neededHeight = bodyPaddingUp + header + step + safezone + nextContainer;

    if (userHeight < neededHeight) {
        document.body.style.height = `${neededHeight}px`;
    } else {
        document.body.style.height = `${userHeight - bodyPaddingUp}px`;
    }
}

export function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}