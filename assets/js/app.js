import { loadFormEventListeners } from "./forms.js";
import { loadUserLanguage } from "./translation.js";

export let PLATFORMS;

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
    PLATFORMS = await getJson('./assets/data/platforms.json');
}

function loadEventListeners() {
    loadFormEventListeners();
}