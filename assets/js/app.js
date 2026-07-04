import { loadUserLanguage } from "./translation/translation.js";
import { loadBottomsheetEventListeners } from "./ui/bottomsheet.js";
import { loadFormsListeners } from "./ui/forms.js";
import { loadStep1Listeners } from "./ui/steps/step-1.js";
import { loadStep2Listeners, setPlatforms } from "./ui/steps/step-2.js";
import { loadStep3Listeners } from "./ui/steps/step-3.js";
import { loadStep5Listeners } from "./ui/steps/step-5.js";
import { loadStepNavigation, resetSteps } from "./ui/steps/step-navigation.js";
import { setNavigationLabels } from "./ui/ui.js";
import { loadBrandIcons } from "./ui/icons-loader.js";

document.addEventListener("DOMContentLoaded", async function () {
    await loadUserLanguage();
    await loadBrandIcons();
    setNavigationLabels();
    registerServiceWorker();
    loadStaticData();
    loadEventListeners();
    loadStepNavigation();
    resetSteps();
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
}

function loadEventListeners() {
    loadFormsListeners();
    loadStep1Listeners();
    loadStep2Listeners();
    loadStep3Listeners();
    loadStep5Listeners();
    loadBottomsheetEventListeners();
}

/**
 * Register the service worker that injects CORS headers for CDN images
 * (SteamGridDB etc.).  Without this, html2canvas cannot render those
 * images because the CDNs don't send Access-Control-Allow-Origin.
 */
function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
        .register("./sw.js")
        .then((reg) => {
            console.debug("[SW] Registered, scope:", reg.scope);

            // If there's an updated worker waiting, let the user get it
            // on the next page load (skipWaiting + reload).
            if (reg.waiting) {
                reg.waiting.postMessage({ type: "SKIP_WAITING" });
            }
            reg.addEventListener("updatefound", () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener("statechange", () => {
                    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                        console.debug("[SW] New version available — reload to activate");
                    }
                });
            });
        })
        .catch((err) => {
            console.debug("[SW] Registration failed:", err.message);
        });
}