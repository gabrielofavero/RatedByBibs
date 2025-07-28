import { loadEventListeners } from "./forms.js";
import { loadUserLanguage } from "./translation.js";

export let PLATFORMS;

document.addEventListener("DOMContentLoaded", async function () {
    await loadUserLanguage();
    loadStaticData();
    loadEventListeners();
    adjustPageHeight();
    window.addEventListener('resize', adjustPageHeight);
});

export function adjustPageHeight() {
    const height = document.getElementById('slider').offsetHeight;
    document.getElementById('step-wrapper').style.height = `${height + 120}px`
}

export async function getJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return response.json();
}

async function loadStaticData() {
    PLATFORMS = await getJson('./assets/data/platforms.json');
}