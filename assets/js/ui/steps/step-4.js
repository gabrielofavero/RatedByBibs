import { generateCanvas } from "../../canvas.js";
import { disableBack, hideNext } from "../forms.js";
import { nextStep, resetSteps } from "./step-navigation.js";
import { showError } from "../alert-bottomsheet.js";
import { translate } from "../../translation/translation.js";

/** Maximum time (ms) the entire generation can take before we abort */
const GENERATION_TIMEOUT = 45_000;

export function loadStep4() {
  disableBack();
  hideNext();
  startLoading();
}


function startLoading() {
  const header = document.getElementById('header');
  const container = document.getElementById('loading-container');
  const bar = document.getElementById('loaderBar');
  const label = container.querySelector('.loading-label');
  header.style.visibility = 'hidden';

  // Reset the loading bar if a previous run left a timeout
  if (bar._loadingTimeout) {
    clearTimeout(bar._loadingTimeout);
  }
  if (bar._generationTimeout) {
    clearTimeout(bar._generationTimeout);
  }

  // Show the loading UI
  container.classList.add('visible');
  bar.style.transition = 'none';
  bar.style.width = '0%';
  label.textContent = translate('label.loading_starting');

  // Animate bar to initial "started" state
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.transition = 'width 0.4s ease';
      bar.style.width = '5%';
    });
  });

  // Track progress from canvas generation — bar moves, label stays static
  let lastPct = 5;

  const onProgress = (_status, pct) => {
    if (pct < lastPct) pct = lastPct;
    lastPct = pct;

    bar.style.transition = `width 0.4s ease`;
    bar.style.width = `${pct}%`;
  };

  // Global safety timeout — if generation hangs, show error
  const timeoutPromise = new Promise((_, reject) => {
    bar._generationTimeout = setTimeout(() => {
      reject(new Error("Generation timed out"));
    }, GENERATION_TIMEOUT);
  });

  Promise.race([
    generateCanvas({ onProgress }),
    timeoutPromise,
  ])
    .then(() => {
      clearTimeout(bar._generationTimeout);

      // Final animation to 100%
      bar.style.transition = 'width 0.3s ease';
      bar.style.width = '100%';

      // Brief pause so the user sees the completed bar
      bar._loadingTimeout = setTimeout(() => {
        header.style.visibility = 'visible';
        container.classList.remove('visible');
        nextStep();
      }, 600);
    })
    .catch((err) => {
      clearTimeout(bar._generationTimeout);
      header.style.visibility = 'visible';
      container.classList.remove('visible');

      console.error("[Step4] Canvas generation failed:", err);

      showError(
        translate('label.error.canvas'),
        { buttonLabel: translate('label.ok'), onDismiss: resetSteps }
      );
    });
}