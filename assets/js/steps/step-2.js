import { translate } from "../translation.js";
import { TYPE, TYPES, PLATFORM } from "../forms.js";
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

export function isStep2NextDisabled() {
    const titleValue = document.getElementById(`${TYPE}-title`).value.trim();

    if (TYPE === 'book' || TYPE === 'other') {
        return !titleValue;
    } else {
        return !titleValue || !PLATFORM;
    }
}

function loadStep2Platforms() {
    const platforms = PLATFORMS?.[TYPE]?.[USER_LANGUAGE];
    if (!Array.isArray(platforms) || platforms.length === 0) return;

    for (let j = 1; j <= 5; j++) {
        const platform = platforms[j - 1];
        const elements = getPlatformElements(j);
        resetPlatformSlot(elements);

        if (platform) {
            const macroType = getMacroType(TYPE);
            const properties = getPlatformProperties(macroType, platform);
            updatePlatformSlot(elements, platform, properties);
        }
    }
}

function getMacroType(type) {
    return ['movies', 'tv'].includes(type) ? 'video' : type;
}

function getPlatformProperties(macroType, platform) {
    return PLATFORMS?.properties?.[macroType]?.[platform] || {};
}

function getPlatformElements(index) {
    return {
        div: document.getElementById(`platform-${index}`),
        background: document.getElementById(`platform-background-${index}`),
        internalIcon: document.getElementById(`platform-internal-icon-${index}`),
        externalIcon: document.getElementById(`platform-external-icon-${index}`),
        label: document.getElementById(`platform-label-${index}`)
    };
}

function resetPlatformSlot({ div, background, internalIcon, externalIcon, label }) {
    div.removeAttribute('platform');
    background.className = 'background';
    label.textContent = '';

    internalIcon.style.display = 'none';
    internalIcon.querySelector('use').setAttribute('href', '');

    externalIcon.style.display = 'none';
    externalIcon.src = '';
}

function updatePlatformSlot({ div, background, internalIcon, externalIcon, label }, platform, properties) {
    div.setAttribute('platform', platform);
    label.textContent = translate(`label.${TYPE}.platform.${platform}`);

    background.classList.add(properties.background || platform);

    updatePlatformIcon(internalIcon, externalIcon, platform, properties);
}

function updatePlatformIcon(internalIcon, externalIcon, platform, properties) {
    const hasSvg = properties['has-svg'] === true;

    if (hasSvg) {
        externalIcon.src = `/assets/icons/${platform}.svg`;

        if (properties.svg?.width) {
            externalIcon.setAttribute("width", properties.svg.width);
        } else {
            externalIcon.removeAttribute("width");
        }

        if (properties.svg?.height) {
            externalIcon.setAttribute("height", properties.svg.height);
        } else {
            externalIcon.removeAttribute("height");
        }

        externalIcon.setAttribute('class', `icon ${properties.icon || platform}`);
        externalIcon.style.display = 'block';
    } else {
        const use = internalIcon.querySelector('use');
        if (use) use.setAttribute('href', `#icon-${platform}`);

        internalIcon.setAttribute('class', `icon ${properties.icon || platform}`);
        internalIcon.style.display = 'block';
    }
}