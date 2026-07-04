import { translate } from "../../translation/translation.js";
import { disableNext, enableBack, enableNext, loadStars } from "../forms.js";
import { showError } from "../alert-bottomsheet.js";

export let RATING = 0;
export let COVER;
export let POSTER_OPTIONS = [];

/**
 * Store multiple poster options (from multi-image providers like SteamGridDB)
 * so step-3 can display a carousel for the user to choose.
 *
 * @param {string[]} posters - Array of data: URLs
 */
export function setPosterOptions(posters) {
    POSTER_OPTIONS = posters;
}

/**
 * Set the cover image from an external URL (e.g. fetched from an API).
 * Updates both the COVER variable and the dropzone preview UI.
 * Called by step-2 when the user picks an autocomplete result.
 *
 * @param {string} dataUrl - The image as a data: URL
 */
export function setCoverFromUrl(dataUrl) {
    if (!dataUrl) return;

    const dropzone = document.getElementById('dropzone');
    const preview = document.getElementById('preview');
    const uploadText = document.getElementById('upload-text');

    if (!dropzone || !preview) {
        console.debug("[Step3] setCoverFromUrl → dropzone/preview not in DOM yet, storing COVER only");
        COVER = dataUrl;
        return;
    }

    // Set handlers BEFORE src — data URLs can load synchronously
    preview.onload = () => {
        console.debug(`[Step3] preview.onload → ${preview.naturalWidth}x${preview.naturalHeight}`);
        dropzone.style.aspectRatio = `${preview.naturalWidth} / ${preview.naturalHeight}`;
        preview.style.display = 'block';
        dropzone.classList.add('has-image');
    };
    preview.onerror = () => {
        console.debug("[Step3] preview.onerror → invalid image data");
        COVER = '';
    };

    COVER = dataUrl;
    preview.src = COVER;

    // Safety: if onload already fired (sync load), force display
    if (preview.complete && preview.naturalWidth > 0) {
        preview.onload();
    }

    uploadText.textContent = translate('label.upload-edit');
}

export function loadStep3() {
    enableBack();
    setNextVisibility();
    renderPosterCarousel();
}

export function loadStep3Listeners() {
    loadImageUploadEventListeners();
    loadStarRatingEventListeners();
}

export function resetStep3() {
    RATING = 0;
    COVER = '';
    POSTER_OPTIONS = [];
    resetImageUpload();
    hidePosterCarousel();
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

    dropzone.addEventListener('click', () => {
        fileInput.click();
        setNextVisibility();
    });

    fileInput.addEventListener('change', event => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            resetImageUpload();
        } else {
            handleFile(files[0]);
        }
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
        showError(translate('label.error.invalid_file'), {
            buttonLabel: translate('label.ok')
        });
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
        setNextVisibility();
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
        // Click on left half = 0.5, right half = 1.0
        star.addEventListener('click', (e) => {
            const starValue = parseInt(star.dataset.value);
            const rect = star.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const isLeftHalf = clickX < rect.width / 2;
            
            const selectedValue = isLeftHalf ? starValue - 0.5 : starValue;

            if (RATING === selectedValue) {
                RATING = 0;
            } else {
                RATING = selectedValue;
            }

            loadStars(stars, RATING);

            const ratingKey = RATING.toString().replace(".", ",");
            label.textContent = translate(`label.rating.${ratingKey}`);
            setNextVisibility();
        });
    });
}

function resetStarRatingLabel() {
    document.getElementById('star-rating-label').textContent = translate('label.rating.0');
}

// ---- Poster carousel (multi-image providers) ----

/**
 * Render the poster carousel below the dropzone when multiple
 * poster options are available (e.g. from SteamGridDB).
 */
function renderPosterCarousel() {
    const container = document.getElementById('poster-options');
    const carousel = document.getElementById('poster-options-carousel');

    if (!container || !carousel) return;

    if (!POSTER_OPTIONS.length) {
        hidePosterCarousel();
        return;
    }

    container.style.display = 'block';

    carousel.innerHTML = POSTER_OPTIONS.map((dataUrl, i) => `
        <div class="poster-option${i === 0 ? ' active' : ''}"
             data-index="${i}"
             title="${translate('label.select_image') || 'Select this image'}">
            <img src="${dataUrl}" alt="Option ${i + 1}" loading="lazy" />
        </div>
    `).join('');

    // Click handler for each thumbnail
    carousel.querySelectorAll('.poster-option').forEach(thumb => {
        thumb.addEventListener('click', () => {
            const idx = parseInt(thumb.dataset.index);
            selectPosterOption(idx);
        });
    });
}

/**
 * Select a poster from the carousel and update the COVER.
 */
function selectPosterOption(index) {
    if (index < 0 || index >= POSTER_OPTIONS.length) return;

    const carousel = document.getElementById('poster-options-carousel');
    if (!carousel) return;

    // Update active state
    carousel.querySelectorAll('.poster-option').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });

    // Set COVER and update preview
    setCoverFromUrl(POSTER_OPTIONS[index]);
}

/**
 * Hide the poster carousel.
 */
function hidePosterCarousel() {
    const container = document.getElementById('poster-options');
    if (container) {
        container.style.display = 'none';
    }
    const carousel = document.getElementById('poster-options-carousel');
    if (carousel) {
        carousel.innerHTML = '';
    }
}