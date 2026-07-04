import { disableBack, disableNext, enableNext, showNext, updateNextTextContent } from "../forms.js";
import { NAVIAGATION_LABELS } from "../ui.js";
import { resetCover, setPosterOptions } from "./step-3.js";

export let TYPE;
export const TYPES = ['movie', 'tv', 'game', 'music', 'book', 'other']

export let MACROTYPE;
const MACROTYPES = {
    movie: 'video',
    tv: 'video',
    game: 'game',
    music: 'music',
    book: 'book',
    other: 'other'
}

export function loadStep1() {
    setNextVisibility();
    showNext();
    disableBack();
    updateNextTextContent(NAVIAGATION_LABELS.begin);
}

export function loadStep1Listeners() {
    const types = document.getElementsByClassName('grid-item type');
    for (const type of types) {
        type.addEventListener('click', () => {
            const unselected = TYPE === type.id;
            const newType = unselected ? '' : type.id;

            // Reset cover data when changing category to avoid stale covers
            if (newType && newType !== TYPE) {
                resetCover();
                setPosterOptions([]);
            }

            TYPE = newType;
            MACROTYPE = MACROTYPES[TYPE];

            for (const innerDiv of types) {
                const criteria = unselected ? false : innerDiv.id === type.id;
                innerDiv.classList.toggle('selected', criteria);
            }
            setNextVisibility();
        });
    };
}

export function resetStep1() {
    TYPE = undefined;
    resetCover();
    setPosterOptions([]);
    const types = document.getElementsByClassName('grid-item type');
    for (const type of types) {
        type.classList.remove('selected');
    };
}

function setNextVisibility() {
    if (TYPE) {
        enableNext();
    } else {
        disableNext();
    }
}