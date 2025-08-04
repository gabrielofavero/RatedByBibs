import { translate } from "../../translation/translation.js";
import { disableNext, enableBack, enableNext } from "../forms.js";

let RATING = 0;
let FILE;

export function loadStep3() {
    loadImageUploadEventListeners();
    loadStarRatingEventListeners();

    enableBack();
    setNextVisibility();
}

function setNextVisibility() {
    if (isNextDisabled()) {
        disableNext();
    } else {
        enableNext();
    }
}

function isNextDisabled() {
    return !RATING || !FILE;
}

function loadImageUploadEventListeners() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', event => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            resetImageUpload();
        } else {
            handleFile(files[0]);
        }
        setNextVisibility();
    });

    dropzone.addEventListener('dragover', event => {
        event.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', event => {
        event.preventDefault();
        dropzone.classList.remove('dragover');
        const file = event.dataTransfer.files[0];
        handleFile(file);
    });
}

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        resetImageUpload();
        return;
    }

    FILE = file;

    const dropzone = document.getElementById('dropzone');
    const preview = document.getElementById('preview');

    const reader = new FileReader();
    reader.onload = e => {
        preview.onload = () => {
            dropzone.style.aspectRatio = `${preview.naturalWidth} / ${preview.naturalHeight}`;
            preview.style.display = 'block';
            dropzone.classList.add('has-image');
        };

        preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function resetImageUpload() {
    const dropzone = document.getElementById('dropzone');
    const preview = document.getElementById('preview');
    const fileInput = document.getElementById('fileInput');

    preview.src = '';
    preview.style.display = 'none';

    dropzone.style.aspectRatio = null;
    dropzone.classList.remove('has-image');

    fileInput.value = '';
    FILE = undefined;
}

function loadStarRatingEventListeners() {
    const stars = document.querySelectorAll('.rating');
    const label = document.getElementById('star-rating-label');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const selectedValue = parseInt(star.dataset.value);

            if (RATING === selectedValue) {
                RATING = 0;
            } else {
                RATING = selectedValue;
            }

            stars.forEach(s => {
                const val = parseInt(s.dataset.value);
                if (val <= RATING) {
                    s.classList.add('rated');
                    s.classList.remove('unrated');
                } else {
                    s.classList.remove('rated');
                    s.classList.add('unrated');
                }
            });

            label.textContent = translate(`rating.${RATING}`);
            setNextVisibility();
        });
    });
}