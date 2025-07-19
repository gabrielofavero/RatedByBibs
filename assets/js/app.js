import { updateInputsWithLocalStorage, loadEventListeners } from "./inputs.js";

document.addEventListener("DOMContentLoaded", function () {

    updateInputsWithLocalStorage();
    loadEventListeners();
});
