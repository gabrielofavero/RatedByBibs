import { generateCanvas } from "../../canvas.js";
import { disableBack, hideNext } from "../forms.js";
import { nextStep } from "./step-navigation.js";

export function loadStep4() {
  disableBack();
  hideNext();
  startLoading();
}


function startLoading() {
  const header = document.getElementById('header');
  const container = document.getElementById('loading-container');
  const bar = document.getElementById('loaderBar');
  header.style.visibility = 'hidden';

  // Reset the loading bar if it exists
  if (bar._loadingTimeout) {
    clearTimeout(bar._loadingTimeout);
  }

  generateCanvas();
  bar.style.transition = 'none';
  bar.style.width = '0%';
  container.classList.add('visible');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.transition = 'width 1.5s ease';
      bar.style.width = '100%';

      bar._loadingTimeout = setTimeout(() => {
        header.style.visibility = 'visible';
        container.classList.remove('visible');
        nextStep();
      }, 1500);
    });
  });
}