import { NAVIAGATION_LABELS } from "../../app.js";
import { USER_LANGUAGE, translate } from "../../translation/translation.js";
import { BOTTOMSHEET, OVERLAY, closeSheet } from "../bottomsheet.js";
import { disableNext, enableBack, enableNext, enableButton, disableButton, hasMissingRequiredInputs, restrictToPositiveInputs, updateNextTextContent } from "../forms.js";
import { TYPE, TYPES } from "./step-1.js";

export let PLATFORM;
let PLATFORMS;

const SUBTYPE = {
    tv: '',
    music: ''
}

export const MACROTYPE = {
    movie: 'video',
    tv: 'video',
    game: 'game',
    music: 'music',
    book: 'book',
    other: 'other'
}

let TYPE_PLATFORMS;

// Step Initialization
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
        }
    });

    document.querySelectorAll(`.step-2.input`).forEach(input => {
        input.addEventListener('input', () => {
            restrictToPositiveInputs(input);
            setNextVisibility();
        });
    });

    const more = document.getElementById('more');
    more.addEventListener('click', () => {
        loadMorePlatforms();
        BOTTOMSHEET.classList.add('active');
        OVERLAY.classList.add('active');
        setTimeout(() => {
            more.classList.remove('selected');
        }, 1000);
    });

    const confirmBtn = document.getElementById('confirm-bottomsheet');
    confirmBtn.addEventListener('click', () => {
        setNewPlatform();
        closeSheet();
        confirmBtn.disabled = true;
    });
}


// Step Logic Control
function isNextDisabled() {
    if (!TYPE) return true;
    const emptyRequired = hasMissingRequiredInputs();
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
    document.getElementById('more').classList.remove('selected');
    if (!PLATFORM) {
        return;
    }

    const platformIndex = TYPE_PLATFORMS.indexOf(PLATFORM);
    if (platformIndex > -1) {
        document.getElementById(`platform-${platformIndex + 1}`).classList.add('selected');
    } else {
        document.getElementById('platform-1').classList.add('selected');
        processPlatform(PLATFORM, 1, 'platform');
        setNextVisibility();
    }
}

// Input Handling and Dynamic UI
function loadCheckboxInput(type) {
    const value = document.querySelector(`input[name="${type}-radio"]:checked`)?.value;

    if (!value) {
        SUBTYPE[type] = '';
        return;
    }

    const shouldBeVisible = getOptionVisibilityObject(type, value)

    for (const key in shouldBeVisible) {
        const option = document.getElementById(`${type}-${key}-option`);
        const input = document.getElementById(`${type}-${key}`);

        input.required = shouldBeVisible[key];
        if (shouldBeVisible[key] === true) {
            option.classList.remove('hidden');
        } else {
            option.classList.add('hidden');
        }
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
                album: ['song', 'album'].includes(value)
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

    TYPE_PLATFORMS = PLATFORMS?.[TYPE]?.[USER_LANGUAGE]?.slice(0, 5);
    if (!Array.isArray(TYPE_PLATFORMS) || TYPE_PLATFORMS.length === 0) return;

    processPlatformContainer();
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
    const properties = PLATFORMS?.properties?.[MACROTYPE[TYPE]]?.[platform] || {};
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
    label.textContent = translate(`${MACROTYPE[TYPE]}.platform.${platform}`);

    background.classList.add(properties.background || platform);

    updatePlatformIcon(internalIcon, externalIcon, platform, properties);
}

export function updatePlatformIcon(internalIcon, externalIcon, platform, properties) {
    const hasSvg = properties['has-svg'] === true;
    const iconClasses = `${properties.class} ${properties.icon || platform}`

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

        externalIcon.setAttribute('class', iconClasses);
        externalIcon.style.display = 'block';
    } else {
        const use = internalIcon.querySelector('use');
        if (use) use.setAttribute('href', `#icon-${platform}`);

        internalIcon.setAttribute('class', iconClasses);
        internalIcon.style.display = 'block';
    }
}


// Data Utilities
function getAllPlatforms() {
    return PLATFORMS?.[TYPE]?.all || [];
}