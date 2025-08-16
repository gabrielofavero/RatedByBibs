import { downloadCanvas, getH1, getH2, getPlatformText } from "../../canvas.js";
import { disableBack, hideNext, loadStars } from "../forms.js";
import { PLATFORM, getPlatformProperties, updatePlatformIcon } from "./step-2.js";
import { COVER, RATING } from "./step-3.js";
import { resetSteps } from "./step-navigation.js";

export function loadStep5() {
    loadCover();
    loadTitles();
    loadPlatform();
    loadStars(document.querySelectorAll('.rating-step-5'), RATING);

    hideNext();
    disableBack();
}

export function loadStep5Listeners() {
    document.getElementById('download').addEventListener('click', downloadCanvas);
    document.getElementById('restart').addEventListener('click', resetSteps);
}

function loadCover() {
    document.getElementById('step-5-image').src = COVER;
}

function loadTitles() {
    document.getElementById('step-5-h1').textContent = getH1();
    document.getElementById('step-5-h2').textContent = getH2();
}

function loadPlatform() {
    if (!PLATFORM) return;
    loadPlatformLabel();
    loadPlatformIcon();
}

function loadPlatformLabel() {
    document.getElementById('step-5-platform').textContent = getPlatformText();
}

function loadPlatformIcon() {
    const internalIcon = document.getElementById('step-5-internal-icon');
    const externalIcon = document.getElementById('step-5-external-icon');
    const properties = getPlatformProperties(PLATFORM, 'icon-canvas-mini');
    updatePlatformIcon(internalIcon, externalIcon, PLATFORM, properties);
}