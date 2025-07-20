import { updateInputsWithLocalStorage, loadEventListeners } from "./forms.js";

document.addEventListener("DOMContentLoaded", function () {

    updateInputsWithLocalStorage();
    loadEventListeners();
});
