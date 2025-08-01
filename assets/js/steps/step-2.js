import { translate } from "../translation.js";
import { TYPE, TYPES, PLATFORM, loadGridPlatformListeners } from "../forms.js";
import { PLATFORMS } from "../app.js";
import { USER_LANGUAGE } from "../translation.js";

const SUBTYPE = {
    tv: '',
    music: ''
}

const MACROTYPE = {
    movie: 'video',
    tv: 'video',
    game: 'game',
    music: 'music',
    book: 'book',
    other: 'other'
}

export function loadStep2() {
    loadStep2Listeners();
    loadStep2Inputs();
    loadStep2Platforms();
}

export function isStep2NextDisabled() {
    const titleValue = TYPE === 'music' ? true : document.getElementById(`${TYPE}-title`).value.trim();

    if (TYPE === 'book' || TYPE === 'other') {
        return !titleValue;
    } else {
        return !titleValue || !PLATFORM;
    }
}

function loadStep2Listeners() {
    document.getElementById('music-radio-song').onchange = () => loadCheckboxInput('music');
    document.getElementById('music-radio-artist').onchange = () => loadCheckboxInput('music');
    document.getElementById('music-radio-album').onchange = () => loadCheckboxInput('music');

    document.getElementById('tv-radio-title').onchange = () => loadCheckboxInput('tv');
    document.getElementById('tv-radio-season').onchange = () => loadCheckboxInput('tv');
    document.getElementById('tv-radio-episode').onchange = () => loadCheckboxInput('tv');

    document.getElementById('tv-season').onchange = () => blockTVShowNumber('tv-season');
    document.getElementById('tv-episode').onchange = () => blockTVShowNumber('tv-episode');
}

function loadCheckboxInput(type) {
    const value = document.querySelector(`input[name="${type}-radio"]:checked`)?.value;
    
    if (!value) {
        SUBTYPE[type] = '';
        return;
    }
    
    const shouldBeVisible = getOptionVisibilityObject(type, value)

   for (const key in shouldBeVisible) {
    const option = document.getElementById(`${type}-${key}-option`);
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

    const platforms = PLATFORMS?.[TYPE]?.[USER_LANGUAGE]?.slice(0, 5);
    if (!Array.isArray(platforms) || platforms.length === 0) return;
    processPlatformContainer(platforms);
}

function processPlatformContainer(platforms, type='platform') {
    for (let j = 1; j <= platforms.length; j++) {
        const platform = platforms[j - 1];
        const elements = getPlatformElements(j, type);
        resetPlatformSlot(elements);

        if (platform) {
            const properties = PLATFORMS?.properties?.[MACROTYPE[TYPE]]?.[platform] || {};
            updatePlatformSlot(elements, platform, properties);
        }
    }
}

function getPlatformElements(index, type) {
    return {
        div: document.getElementById(`${type}-${index}`),
        background: document.getElementById(`${type}-background-${index}`),
        internalIcon: document.getElementById(`${type}-internal-icon-${index}`),
        externalIcon: document.getElementById(`${type}-external-icon-${index}`),
        label: document.getElementById(`${type}-label-${index}`)
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
    label.textContent = translate(`label.${MACROTYPE[TYPE]}.platform.${platform}`);

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

export function loadMorePlatforms() {
    const platforms = PLATFORMS?.[MACROTYPE[TYPE]]?.all || [];
    const container =  document.getElementById('platform-grid-container-more');
    
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
    loadGridPlatformListeners('more-platform', 'confirm-bottomsheet', false);
}

function blockTVShowNumber(id) {
    const input = document.getElementById(id);
    const value = parseInt(input.value);
    if (isNaN(value) || value < 1) {
        input.value = '';
    }
}