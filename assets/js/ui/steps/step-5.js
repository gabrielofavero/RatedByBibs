import { translate } from "../../translation/translation.js";
import { hideNext, disableBack, loadStars } from "../forms.js";
import { TYPE } from "./step-1.js";
import { PLATFORM, MACROTYPE, getPlatformProperties, updatePlatformIcon } from "./step-2.js";
import { COVER, RATING } from "./step-3.js";
import { resetSteps } from "./step-navigation.js";
import { shareCanvas } from "../../canvas.js";

export function loadStep5() {
    loadCover();
    loadTitle();
    loadPlatform();
    loadStars(document.querySelectorAll('.rating-step-5'), RATING);

    hideNext();
    disableBack();
}

export function loadStep5Listeners() {
    document.getElementById('download').addEventListener('click', shareCanvas);
    document.getElementById('restart').addEventListener('click', resetSteps);
}

function loadCover() {
    document.getElementById('step-5-image').src = COVER;
}

function loadTitle() {
    const title = document.getElementById(`${TYPE}-title`).value;
    document.getElementById('step-5-title').textContent = title;
}

function loadPlatform() {
    if (!PLATFORM) return;
    loadPlatformLabel();
    loadPlatformIcon();
}

function loadPlatformLabel() {
    const id = document.getElementById(`${TYPE}-id`)?.value;
    document.getElementById('step-5-platform').textContent = id || translate(`${MACROTYPE[TYPE]}.platform.${PLATFORM}`);
}

function loadPlatformIcon() {
    const internalIcon = document.getElementById('step-5-internal-icon');
    const externalIcon = document.getElementById('step-5-external-icon');
    const properties = getPlatformProperties(PLATFORM, 'icon-canvas-mini');
    updatePlatformIcon(internalIcon, externalIcon, PLATFORM, properties);
}