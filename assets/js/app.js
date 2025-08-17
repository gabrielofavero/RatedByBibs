import { loadUserLanguage, translate } from "./translation/translation.js";
import { loadBottomsheetEventListeners } from "./ui/bottomsheet.js";
import { loadFormsListeners } from "./ui/forms.js";
import { loadStep1Listeners } from "./ui/steps/step-1.js";
import { loadStep2Listeners, setPlatforms } from "./ui/steps/step-2.js";
import { loadStep3Listeners } from "./ui/steps/step-3.js";
import { loadStep5Listeners } from "./ui/steps/step-5.js";

export const NAVIAGATION_LABELS = {
    begin: '',
    next: '',
    finish: ''
}

document.addEventListener("DOMContentLoaded", async function () {
    await loadUserLanguage();
    loadStaticData();
    loadEventListeners();
});

export async function getJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return response.json();
}

async function loadStaticData() {
    setPlatforms(await getJson('./assets/data/platforms.json'));
    NAVIAGATION_LABELS.begin = translate('label.begin');
    NAVIAGATION_LABELS.next = translate('label.next');
    NAVIAGATION_LABELS.finish = translate('label.finish');
}

function loadEventListeners() {
    loadFormsListeners();
    loadStep1Listeners();
    loadStep2Listeners();
    loadStep3Listeners();
    loadStep5Listeners();
    loadBottomsheetEventListeners();
}