import { USER_LANGUAGE, translate } from "../../translation/translation.js";
import { closeSheet, openSheet } from "../bottomsheet.js";
import { disableButton, disableNext, enableBack, enableButton, enableNext, hasMissingRequiredInputs, restrictToPositiveInputs, updateNextTextContent } from "../forms.js";
import { NAVIAGATION_LABELS, adaptPageHeight } from "../ui.js";
import { MACROTYPE, TYPE, TYPES } from "./step-1.js";

export let PLATFORM;
let PLATFORMS;

const SUBTYPE = {
    tv: '',
    music: ''
}

let TYPE_PLATFORMS;

// Step Initialization and Reset
export function setPlatforms(value) {
    PLATFORMS = value;
}

export function loadStep2() {
    loadStep2Inputs();
    loadStep2Platforms();

    enableBack();
    setNextVisibility();
    updateNextTextContent(NAVIAGATION_LABELS.next);
}

export function loadStep2Listeners() {
    loadGridPlatformListeners();

    document.querySelectorAll(`.step-2.radio`).forEach(radio => {
        const type = radio.id.split("-")[0];
        radio.onchange = () => {
            loadCheckboxInput(type);
            setNextVisibility();
            setTimeout(adaptPageHeight, 300);
        }
    });

    document.querySelectorAll(`.step-2.input`).forEach(input => {
        input.addEventListener('input', () => {
            restrictToPositiveInputs(input);
            setNextVisibility();
            setTimeout(adaptPageHeight, 300);
        });
    });

    const more = document.getElementById('more');
    more.addEventListener('click', () => {
        loadMorePlatforms();
        openSheet();
        setTimeout(() => {
            more.classList.remove('selected');
        }, 1000);
    });

    document.getElementById('confirm-bottomsheet').addEventListener('click', () => {
        setNewPlatform();
        loadPlatformIdVisibility();
        closeSheet();
    });
}

export function resetStep2() {
    PLATFORM = undefined;
    const inputs = ['movie-title', 'tv-episode', 'tv-season', 'tv-title', 'game-title', 'game-id', 'music-song', 'music-album', 'music-artist', 'book-title', 'book-author', 'other-title', 'other-subtitle']
    const radios = ['tv-radio-episode', 'music-radio-song']
    const platforms = ['platform-1', 'platform-2', 'platform-3', 'platform-4', 'platform-5', 'more']

    for (const input of inputs) {
        document.getElementById(input).value = '';
    }

    for (const radio of radios) {
        document.getElementById(radio).checked = true;
    }

    for (const platform of platforms) {
        document.getElementById(platform).classList.remove('selected');
    }

    loadCheckboxInput('tv');
    loadCheckboxInput('music');
}


// Step Logic Control
function isNextDisabled() {
    if (!TYPE) return true;
    const emptyRequired = hasMissingRequiredInputs(`step-2.input.${TYPE}`);
    const isPlatformInvalid = ['book', 'other'].includes(TYPE) ? false : !PLATFORM;
    return emptyRequired || isPlatformInvalid;
}

function setNextVisibility() {
    if (isNextDisabled()) {
        disableNext();
    } else {
        enableNext();
    }
}

// Event Handling
function loadGridPlatformListeners(platformID = 'platform', buttonID = 'next') {
    const platforms = document.getElementsByClassName(`grid-item ${platformID}`);
    for (const div of platforms) {
        div.addEventListener('click', () => {
            const platform = div.getAttribute('platform');
            const unselected = PLATFORM === platform;
            PLATFORM = unselected ? '' : platform;

            for (const innerDiv of platforms) {
                const isSelected = unselected ? false : innerDiv.getAttribute('platform') === platform;
                innerDiv.classList.toggle('selected', isSelected);
            }

            const isDisabled = buttonID === 'next' ? isNextDisabled() : !PLATFORM;

            if (isDisabled) {
                disableButton(buttonID);
            } else {
                enableButton(buttonID);
            }
            loadPlatformIdVisibility();
        });
    };
}

function loadMorePlatforms() {
    const platforms = getAllPlatforms();
    const container = document.getElementById('platform-grid-container-more');

    container.innerHTML = '';
    document.getElementById('confirm-bottomsheet').classList.add('disabled');

    let innerHTML = '';
    for (let j = 1; j <= platforms.length; j++) {
        innerHTML += `
        <div class="grid-item more-platform" id="more-platform-${j}">
            <div id="more-platform-background-${j}" class="background">
            <div id="more-platform-icon-container-${j}">
                <svg id="more-platform-internal-icon-${j}" style="display: none">
                <use href="" />
                </svg>
                <img id="more-platform-external-icon-${j}" src="" style="display: none">
            </div>
            </div>
            <div class="grid-label" id="more-platform-label-${j}"></div>
        </div>`
    }
    container.innerHTML = innerHTML;

    processPlatformContainer(platforms, 'more-platform');
    loadGridPlatformListeners('more-platform', 'confirm-bottomsheet');
}

function setNewPlatform() {
    if (!PLATFORM) {
        return;
    }

    const platformIndex = TYPE_PLATFORMS.indexOf(PLATFORM);
    let platformID = `platform-${platformIndex + 1}`;

    if (platformIndex < 0) {
        processPlatform(PLATFORM, 1, 'platform');
        platformID = 'platform-1';
    }

    document.getElementById(platformID).classList.add('selected');
    setNextVisibility();
}

// Input Handling and Dynamic UI
function loadCheckboxInput(type) {
    const value = document.querySelector(`input[name="${type}-radio"]:checked`)?.value;

    if (!value) {
        SUBTYPE[type] = '';
        return;
    }

    const shouldBeVisible = getOptionVisibilityObject(type, value);
    const shouldBeRequired = getOptionRequiredObject(type, value);

    for (const key in shouldBeVisible) {
        const option = document.getElementById(`${type}-${key}-option`);
        const input = document.getElementById(`${type}-${key}`);

        option.classList.toggle('hidden', !shouldBeVisible[key]);
        input.required = shouldBeRequired[key];
        input.placeholder = translate(`label.${shouldBeRequired[key] ? 'required' : 'optional'}`);
    }

    SUBTYPE[type] = value;
}

function getOptionVisibilityObject(type, value) {
    switch (type) {
        case 'tv':
            return {
                title: true,
                season: ['episode', 'season'].includes(value),
                episode: value === 'episode'
            }
        case "music":
            return {
                song: value === 'song',
                artist: true,
                album: value === 'album'
            }
        default:
            return {}
    }
}

function getOptionRequiredObject(type, value) {
    switch (type) {
        case 'tv':
            return {
                title: true,
                season: ['episode', 'season'].includes(value),
                episode: value === 'episode'
            }
        case "music":
            return {
                song: value === 'song',
                artist: true,
                album: value === 'album'
            }
        default:
            return {}
    }
}

function loadStep2Inputs() {
    for (const type of TYPES) {
        document.getElementById(`${type}-options`).style.display = type === TYPE ? 'flex' : 'none';
    }

    loadCheckboxInput('tv');
    loadCheckboxInput('music');
    loadPlatformIdVisibility();
}

function loadStep2Platforms() {
    const platformContainer = document.getElementById('platform-container');
    if (['book', 'other'].includes(TYPE)) {
        platformContainer.style.display = 'none';
        return;
    } else {
        platformContainer.style.display = '';
    }

    const currentTypePlatforms = Array.from({ length: 5 }, (_, i) => {
        const el = document.getElementById(`platform-${i + 1}`);
        const platform = el?.getAttribute('platform') ?? null;
        const type = el?.getAttribute('type') ?? null;
        return (!platform || !type) ? null : { platform, type }
    }).filter(Boolean);

    if (currentTypePlatforms.length === 5 && currentTypePlatforms.every(obj => obj.type === TYPE)) return;

    TYPE_PLATFORMS = PLATFORMS?.platform?.[TYPE]?.[USER_LANGUAGE]?.slice(0, 5);
    if (!Array.isArray(TYPE_PLATFORMS) || TYPE_PLATFORMS.length === 0) return;

    processPlatformContainer();
}

function loadPlatformIdVisibility() {
    const id = document.getElementById(`${TYPE}-id-option`);
    if (!id) return;

    const properties = getPlatformProperties(PLATFORM).platform;

    const hideId = properties?.['hide-id'] === true;
    id.classList.toggle('hidden', hideId || !PLATFORM);

    const labelID = properties?.['label-id'];
    document.getElementById(`${TYPE}-id-label`).textContent = labelID ? translate(`type.${TYPE}.label-id.${labelID}`) : translate(`label.${TYPE}.label-id.default`);
}

// Platform Slot Processing
function processPlatformContainer(platforms = TYPE_PLATFORMS, containerName = 'platform') {
    for (let j = 1; j <= platforms.length; j++) {
        processPlatform(platforms[j - 1], j, containerName);
    }
}

function processPlatform(platform, j, containerName) {
    const elements = getPlatformElements(j, containerName);
    resetPlatformSlot(elements);

    if (platform) {
        const properties = getPlatformProperties(platform);
        updatePlatformSlot(elements, platform, properties);
    }
}

export function getPlatformProperties(platform, iconClass = 'icon') {
    const properties = PLATFORMS?.properties?.[MACROTYPE]?.[platform] || {};
    properties.class = iconClass;
    return properties;
}

function getPlatformElements(index, containerName) {
    return {
        div: document.getElementById(`${containerName}-${index}`),
        background: document.getElementById(`${containerName}-background-${index}`),
        internalIcon: document.getElementById(`${containerName}-internal-icon-${index}`),
        externalIcon: document.getElementById(`${containerName}-external-icon-${index}`),
        label: document.getElementById(`${containerName}-label-${index}`)
    };
}

function resetPlatformSlot({ div, background, internalIcon, externalIcon, label }) {
    div.removeAttribute('platform');
    div.removeAttribute('type');
    div.classList.remove('selected');

    background.className = 'background';
    label.textContent = '';

    internalIcon.style.display = 'none';
    internalIcon.querySelector('use').setAttribute('href', '');

    externalIcon.style.display = 'none';
    externalIcon.src = '';
}

function updatePlatformSlot({ div, background, internalIcon, externalIcon, label }, platform, properties) {
    div.setAttribute('platform', platform);
    label.textContent = translate(`type.${MACROTYPE}.platform.${platform}`);

    background.classList.add(properties?.platform?.background || platform);

    updatePlatformIcon(internalIcon, externalIcon, platform, properties);
}

function updatePlatformIcon(internalIcon, externalIcon, platform, properties) {
    const hasSvg = properties?.platform?.['has-svg'] === true;
    const iconClasses = `${properties.class} ${properties?.platform?.icon || platform}`

    if (hasSvg) {
        externalIcon.src = `assets/icons/platform/${platform}.svg`;

        if (properties?.platform?.svg?.width) {
            externalIcon.setAttribute("width", properties.platform.svg.width);
        } else {
            externalIcon.removeAttribute("width");
        }

        if (properties?.platform?.svg?.height) {
            externalIcon.setAttribute("height", properties.platform.svg.height);
        } else {
            externalIcon.removeAttribute("height");
        }

        externalIcon.setAttribute('class', iconClasses);
        externalIcon.style.display = 'block';
    } else {
        updateInternalIcon(internalIcon, platform, iconClasses);
        internalIcon.style.display = 'block';
    }
}

export function updateInternalIcon(internalIcon, platform, iconClasses, widthMultiplier) {
    const use = internalIcon.querySelector('use');
    if (use) use.setAttribute('href', `#icon-${platform}`);
    internalIcon.setAttribute('class', iconClasses);

    if (widthMultiplier) {
        const height = parseInt(window.getComputedStyle(internalIcon).height.split('px')[0]);
        if (height) {
            internalIcon.style.width = `${height * widthMultiplier}px`;
        }
    } else {
        internalIcon.style.width = '';
    }
}

// Data Utilities
function getAllPlatforms() {
    return PLATFORMS?.platform?.[TYPE]?.all || [];
}