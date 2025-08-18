import { loadUserLanguage } from "./translation/translation.js";
import { loadBottomsheetEventListeners } from "./ui/bottomsheet.js";
import { loadFormsListeners } from "./ui/forms.js";
import { loadStep1Listeners } from "./ui/steps/step-1.js";
import { loadStep2Listeners, setPlatforms } from "./ui/steps/step-2.js";
import { loadStep3Listeners } from "./ui/steps/step-3.js";
import { loadStep5Listeners } from "./ui/steps/step-5.js";
import { loadStepNavigation } from "./ui/steps/step-navigation.js";
import { setNavigationLabels } from "./ui/ui.js";

document.addEventListener("DOMContentLoaded", async function () {
    await loadUserLanguage();
    loadStaticData();
    loadEventListeners();
    loadStepNavigation();
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
    setNavigationLabels();
}

function loadEventListeners() {
    loadFormsListeners();
    loadStep1Listeners();
    loadStep2Listeners();
    loadStep3Listeners();
    loadStep5Listeners();
    loadBottomsheetEventListeners();
}