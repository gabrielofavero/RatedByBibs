import { NAVIAGATION_LABELS } from "../../app.js";
import { disableBack, disableNext, enableNext, updateNextTextContent } from "../forms.js";

export const TYPES = ['movie', 'tv', 'game', 'music', 'book', 'other']
export let TYPE;

export function loadStep1() {
    setNextVisibility();
    disableBack();
    updateNextTextContent(NAVIAGATION_LABELS.begin);
}

export function loadStep1Listeners() {
    const types = document.getElementsByClassName('grid-item type');
    for (const type of types) {
        type.addEventListener('click', () => {
            const unselected = TYPE === type.id;
            const newType = unselected ? '' : type.id;
            TYPE = newType;

            for (const innerDiv of types) {
                const criteria = unselected ? false : innerDiv.id === type.id;
                innerDiv.classList.toggle('selected', criteria);
            }
            setNextVisibility();
        });
    };
}

function setNextVisibility() {
    if (TYPE) {
        enableNext();
    } else {
        disableNext();
    }
}