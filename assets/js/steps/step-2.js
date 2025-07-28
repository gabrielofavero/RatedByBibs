import { TYPE, TYPES } from "../forms.js";
import { PLATFORMS } from "../app.js";
import { USER_LANGUAGE } from "../translation.js";

export function loadStep2() {
    for (const type of TYPES) {
        document.getElementById(`${type}-options`).style.display = type === TYPE ? 'flex' : 'none';
    }

    const platformContainer = document.getElementById('platform-container');

    if (['book', 'other'].includes(TYPE)) {
        platformContainer.style.display = 'none';
    } else {
        platformContainer.style.display = '';
        loadStep2Platforms();
    }
}

function loadStep2Platforms() {
    const platforms = PLATFORMS?.[TYPE]?.[USER_LANGUAGE];
    if (platforms && platforms.length > 0) {
        for (let j = 1; j <= 5; j++) {
            const platform = platforms[j - 1];
            const background = document.getElementById(`platform-background-${j}`);
            const icon = document.getElementById(`platform-icon-${j}`);
            const label = document.getElementById(`platform-label-${j}`);

            background.className = 'background';
            icon.setAttribute("class", "icon");
            label.textContent = '';

            if (platform) {
                background.classList.add(platform);
                icon.classList.add(platform);
                label.textContent = translate(`label.${TYPE}.platform.${platform}`)
                icon.querySelector("use").setAttribute("href", `#icon-${platform}`);
                document.getElementById(`platform-${j}`).setAttribute('platform', platform);
            }
        }
    }
}