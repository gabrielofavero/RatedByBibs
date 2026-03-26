import { nextStep, previousStep } from "./steps/step-navigation.js";

// Event Listeners
export function loadFormsListeners() {
    document.getElementById('next').addEventListener('click', nextStep);
    document.getElementById('back').addEventListener('click', previousStep);
}

// Input Utils
export function getInputValue(input) {
    if (!input) return null;
    if (input.type === 'number') {
        const value = input.valueAsNumber;
        return isNaN(value) ? null : value;
    }
    return input.value.trim();
}

export function restrictToPositiveInputs(input) {
    if (input.type === 'number') {
        const value = parseInt(input.valueAsNumber);
        input.value = isNaN(value) || value < 1 ? '' : value;
    }
}

export function hasMissingRequiredInputs(className) {
    const inputs = Array.from(document.querySelectorAll(`.${className}[required]`));
    return inputs.some(input => !getInputValue(input));
}

export function getRadioCheckedID(className) {
    const checked = document.querySelector(`${className} input[type="radio"]:checked`);
    return checked?.id;
}

// Button Utils
export function enableButton(buttonID) {
    document.getElementById(buttonID).classList.remove('disabled');
}

export function disableButton(buttonID) {
    document.getElementById(buttonID).classList.add('disabled');
}

export function enableNext() {
    enableButton('next');
}

export function disableNext() {
    disableButton('next');
}

export function hideNext() {
    document.getElementById('next-container').style.display = 'none'
}

export function showNext() {
    document.getElementById('next-container').style.display = 'flex';
}

export function enableBack() {
    enableButton('back');
}

export function disableBack() {
    disableButton('back');
}

export function updateNextTextContent(textContent) {
    document.getElementById('next').textContent = textContent;
}

// Custom Components
export function loadStars(stars, rating) {
    const floor = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const ceil = Math.ceil(rating);

    stars.forEach(s => {
        const val = parseInt(s.dataset.value);
        const use = s.querySelector('use');

        const isFull = val <= floor;
        const isHalf = val === ceil && hasHalf;
        const rated = isFull || isHalf;

        s.classList.toggle('rated', rated);
        s.classList.toggle('unrated', !rated);

        if (use) {
            const icon = isFull
                ? '#icon-star'
                : isHalf
                    ? '#icon-star-half'
                    : '#icon-star';

            use.setAttribute('href', icon);
        }
    });
}
