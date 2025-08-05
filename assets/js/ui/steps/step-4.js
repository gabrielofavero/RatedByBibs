import { nextStep } from "./step-navigation.js";
import { hideNext, disableBack } from "../forms.js";

export function loadStep4() {
    disableBack();
    hideNext();
    startLoading();
}


function startLoading() {
    const bar = document.getElementById('loaderBar');

    // Cancel any existing alert timeout
    if (bar._loadingTimeout) {
      clearTimeout(bar._loadingTimeout);
    }

    // Reset instantly
    bar.style.transition = 'none';
    bar.style.width = '0%';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = 'width 1.5s ease';
        bar.style.width = '100%';

        // Trigger alert after 2s
        bar._loadingTimeout = setTimeout(() => {
            nextStep();
        }, 2000);
      });
    });
  }