import { updateInputsWithLocalStorage, loadEventListeners } from "./forms.js";
import { loadUserLanguage } from "./translation.js";

document.addEventListener("DOMContentLoaded", async function () {
    await loadUserLanguage();
    updateInputsWithLocalStorage();
    loadEventListeners();
});
