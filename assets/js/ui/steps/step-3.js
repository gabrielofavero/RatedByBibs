import { translate } from "../../translation/translation.js";
import { disableNext, enableBack, enableNext, loadStars } from "../forms.js";

export let RATING = 0;
export let COVER;

export function loadStep3() {
    enableBack();
    setNextVisibility();
}

export function loadStep3Listeners() {
    loadImageUploadEventListeners();
    loadStarRatingEventListeners();
}

export function resetStep3() {
    RATING = 0;
    COVER = '';
    resetImageUpload();
    loadStars(document.querySelectorAll('.rating'), RATING);
    resetStarRatingLabel();
}

function setNextVisibility() {
    if (isNextDisabled()) {
        disableNext();
    } else {
        enableNext();
    }
}

function isNextDisabled() {
    return !RATING || !COVER;
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

    const dropzone = document.getElementById('dropzone');
    const preview = document.getElementById('preview');
    const uploadText = document.getElementById('upload-text');

    const reader = new FileReader();
    reader.onload = e => {
        preview.onload = () => {
            dropzone.style.aspectRatio = `${preview.naturalWidth} / ${preview.naturalHeight}`;
            preview.style.display = 'block';
            dropzone.classList.add('has-image');
        };
        COVER = e.target.result;
        preview.src = COVER;
        uploadText.textContent = translate('label.upload-edit');
    };
    reader.readAsDataURL(file);
}

function resetImageUpload() {
    const dropzone = document.getElementById('dropzone');
    const preview = document.getElementById('preview');
    const fileInput = document.getElementById('fileInput');
    const uploadText = document.getElementById('upload-text');

    preview.src = '';
    preview.style.display = 'none';

    dropzone.style.aspectRatio = null;
    dropzone.classList.remove('has-image');

    fileInput.value = '';
    COVER = '';

    uploadText.textContent = translate('label.upload-add');
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

            loadStars(stars, RATING);

            label.textContent = translate(`rating.${RATING}`);
            setNextVisibility();
        });
    });
}

function resetStarRatingLabel() {
    document.getElementById('star-rating-label').textContent = translate('rating.0');
}