import { translate } from "../../translation/translation.js";
import { disableNext, enableBack, enableNext, loadStars } from "../forms.js";
import { showError } from "../alert-bottomsheet.js";

export let RATING = 0;
export let COVER;
export let POSTER_OPTIONS = [];
export let POSTER_LOADING = false;

/**
 * Signal whether a poster fetch is in progress.
 * When true, step-3 shows a loading spinner on the dropzone preview.
 * Called by step-2's autocomplete onSelect before/after the async fetch.
 *
 * @param {boolean} loading
 */
export function setPosterLoading(loading) {
    POSTER_LOADING = loading;

    // If step 3 is the active step, update the dropzone CSS class immediately
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        dropzone.classList.toggle('poster-loading', loading);
    }
}

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
 * Reset the cover image to empty.
 * Called when the user changes category or selects a new autocomplete result.
 */
export function resetCover() {
    COVER = '';
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

    // Clear the poster-loading state since the image has arrived
    setPosterLoading(false);

    const dropzone = document.getElementById('dropzone');
    const preview = document.getElementById('preview');
    const uploadText = document.getElementById('upload-text');

    if (!dropzone || !preview) {
        console.debug("[Step3] setCoverFromUrl → dropzone/preview not in DOM yet, storing COVER only");
        COVER = dataUrl;
        return;
    }

    // Remove any stale handlers from a previous setCoverFromUrl call
    preview.onload = null;
    preview.onerror = null;

    // Force the browser to re-evaluate the image even when the data URL
    // is the same as before (e.g. after a restart).  Without this the
    // browser may serve a cached version and skip firing onload.
    preview.removeAttribute('src');

    // Capture the URL we are about to set so the onerror handler can
    // check whether it is still the current COVER before clearing it.
    const urlBeingSet = dataUrl;

    preview.onload = () => {
        console.debug(`[Step3] preview.onload → ${preview.naturalWidth}x${preview.naturalHeight}`);
        dropzone.style.aspectRatio = `${preview.naturalWidth} / ${preview.naturalHeight}`;
        preview.style.display = 'block';
        dropzone.classList.add('has-image');
        dropzone.classList.remove('poster-loading');
    };
    preview.onerror = () => {
        console.debug("[Step3] preview.onerror → image failed to load");
        // Only clear COVER if it hasn't been changed by another call
        // in the meantime (e.g. the user picked a different result).
        if (COVER === urlBeingSet) {
            COVER = '';
        }
        dropzone.classList.remove('poster-loading');
    };

    COVER = dataUrl;
    preview.src = COVER;

    // Safety: data URLs and cached images may load synchronously,
    // in which case onload never fires.  Use a rAF fallback as well
    // for browsers that don't set complete/naturalWidth immediately.
    if (preview.complete && preview.naturalWidth > 0) {
        preview.onload();
    } else {
        // One-frame safety net — some browsers need an extra tick
        // before the cached image's dimensions are available.
        requestAnimationFrame(() => {
            if (COVER === urlBeingSet && preview.complete && preview.naturalWidth > 0) {
                preview.onload();
            }
        });
    }

    uploadText.textContent = translate('label.upload-edit');
}

export function loadStep3() {
    enableBack();
    setNextVisibility();
    renderPosterCarousel();

    // If a poster fetch is still in progress from step 2's autocomplete,
    // show a loading spinner on the dropzone until it completes.
    const dropzone = document.getElementById('dropzone');
    if (dropzone && POSTER_LOADING) {
        dropzone.classList.add('poster-loading');
    }

    // Ensure the preview reflects the current COVER.
    // If setCoverFromUrl was called while step-3 was hidden and the
    // onload handler never fired (e.g. browser cache quirk), we force
    // a re-display here so the user never sees a blank dropzone.
    const preview = document.getElementById('preview');
    if (preview && COVER && (!preview.complete || preview.naturalWidth === 0 || preview.style.display === 'none')) {
        console.debug("[Step3] loadStep3 → forcing preview refresh for existing COVER");
        preview.onload = null;
        preview.onerror = null;
        preview.removeAttribute('src');
        const currentCover = COVER;
        preview.onload = () => {
            preview.style.display = 'block';
            dropzone.style.aspectRatio = `${preview.naturalWidth} / ${preview.naturalHeight}`;
            dropzone.classList.add('has-image');
            dropzone.classList.remove('poster-loading');
        };
        preview.onerror = () => {
            if (COVER === currentCover) COVER = '';
            dropzone.classList.remove('poster-loading');
        };
        preview.src = currentCover;
        if (preview.complete && preview.naturalWidth > 0) {
            preview.onload();
        }
    }
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
        // Remove stale handlers and force re-evaluation
        preview.onload = null;
        preview.onerror = null;
        preview.removeAttribute('src');

        preview.onload = () => {
            dropzone.style.aspectRatio = `${preview.naturalWidth} / ${preview.naturalHeight}`;
            preview.style.display = 'block';
            dropzone.classList.add('has-image');
        };
        preview.onerror = () => {
            COVER = '';
        };

        COVER = e.target.result;
        preview.src = COVER;

        // Safety check for synchronous loads
        if (preview.complete && preview.naturalWidth > 0) {
            preview.onload();
        } else {
            requestAnimationFrame(() => {
                if (COVER === e.target.result && preview.complete && preview.naturalWidth > 0) {
                    preview.onload();
                }
            });
        }

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

    // Clear stale onload/onerror handlers from a previous setCoverFromUrl
    // call before changing src.  Otherwise the browser may fire the old
    // handlers asynchronously after we set src='' below.
    preview.onload = null;
    preview.onerror = null;

    preview.src = '';
    preview.style.display = 'none';

    dropzone.style.aspectRatio = null;
    dropzone.classList.remove('has-image');

    fileInput.value = '';
    COVER = '';

    uploadText.textContent = translate('label.upload-add');
}

function loadStarRatingEventListeners() {
    const container = document.getElementById('star-rating');
    const stars = document.querySelectorAll('.rating');
    const label = document.getElementById('star-rating-label');

    let isDragging = false;
    let dragMoved = false;    // true once the pointer has moved during a drag
    let dragStartValue = 0;   // rating value at drag-start (for click-to-toggle)

    /**
     * Given a pointer clientX position, determine the rating value
     * using per-star bounding rects.  Gaps between stars are assigned
     * to the nearest half-star so there are no dead zones.
     * @param {number} clientX
     * @returns {number} rating value (e.g. 2.5, 4, 0)
     */
    function getRatingFromPosition(clientX) {
        for (let i = 0; i < stars.length; i++) {
            const rect = stars[i].getBoundingClientRect();

            // Pointer is directly over this star
            if (clientX >= rect.left && clientX <= rect.right) {
                const starValue = parseInt(stars[i].dataset.value);
                const relativeX = clientX - rect.left;
                const isLeftHalf = relativeX < rect.width / 2;
                return isLeftHalf ? starValue - 0.5 : starValue;
            }

            // Pointer is in the gap between this star and the next
            if (i < stars.length - 1) {
                const nextRect = stars[i + 1].getBoundingClientRect();
                if (clientX > rect.right && clientX < nextRect.left) {
                    const gapMid = (rect.right + nextRect.left) / 2;
                    if (clientX < gapMid) {
                        return parseInt(stars[i].dataset.value);           // full star i
                    } else {
                        return parseInt(stars[i + 1].dataset.value) - 0.5; // left-half of next
                    }
                }
            }
        }

        // Outside the star row entirely
        const firstRect = stars[0].getBoundingClientRect();
        if (clientX < firstRect.left) return 0;
        return 5;
    }

    /**
     * Apply the given rating value: update global RATING, re-render
     * stars, update the label, and manage Next button visibility.
     * @param {number} value
     */
    function applyRating(value) {
        RATING = value;
        loadStars(stars, RATING);
        const ratingKey = RATING.toString().replace('.', ',');
        label.textContent = translate(`label.rating.${ratingKey}`);
        setNextVisibility();
    }

    // ---- Pointer-slide (mouse + touch) ----

    container.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent text selection during drag
        isDragging = true;
        dragMoved = false;
        dragStartValue = RATING;
        container.classList.add('dragging');
        const value = getRatingFromPosition(e.clientX);
        applyRating(value);
    });

    container.addEventListener('touchstart', (e) => {
        e.preventDefault(); // prevent scroll on touch
        isDragging = true;
        dragMoved = false;
        dragStartValue = RATING;
        container.classList.add('dragging');
        const touch = e.touches[0];
        const value = getRatingFromPosition(touch.clientX);
        applyRating(value);
    }, { passive: false });

    // Track move on the whole document so the drag continues even if
    // the pointer leaves the star-rating container.
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const value = getRatingFromPosition(e.clientX);
        if (value !== RATING) {
            dragMoved = true;
            applyRating(value);
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const value = getRatingFromPosition(touch.clientX);
        if (value !== RATING) {
            dragMoved = true;
            applyRating(value);
        }
    }, { passive: false });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        // If the pointer didn't move (pure click), apply toggle behaviour:
        // clicking the same rating resets to 0.
        if (!dragMoved && RATING === dragStartValue && dragStartValue > 0) {
            applyRating(0);
        }
        isDragging = false;
        container.classList.remove('dragging');
    });

    document.addEventListener('touchend', () => {
        if (!isDragging) return;
        if (!dragMoved && RATING === dragStartValue && dragStartValue > 0) {
            applyRating(0);
        }
        isDragging = false;
        container.classList.remove('dragging');
    });
}

function resetStarRatingLabel() {
    document.getElementById('star-rating-label').textContent = translate('label.rating.0');
}

// ---- Poster carousel (multi-image providers) ----

const POSTER_VISIBLE_COUNT = 3;
let posterPage = 0;

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
    posterPage = 0;

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

    // Arrow navigation
    setupPosterArrows();
}

/**
 * Wire up left/right arrows with page-based navigation.
 */
function setupPosterArrows() {
    const leftArrow = document.getElementById('poster-arrow-left');
    const rightArrow = document.getElementById('poster-arrow-right');
    const carousel = document.getElementById('poster-options-carousel');

    if (!leftArrow || !rightArrow || !carousel) return;

    const totalPages = Math.ceil(POSTER_OPTIONS.length / POSTER_VISIBLE_COUNT);
    const totalItems = POSTER_OPTIONS.length;
    const itemWidth = 56 + 8; // width + gap

    const updateArrows = () => {
        leftArrow.disabled = posterPage <= 0;
        rightArrow.disabled = posterPage >= totalPages - 1;
    };

    leftArrow.onclick = () => {
        if (posterPage <= 0) return;
        posterPage--;
        carousel.scrollLeft = posterPage * POSTER_VISIBLE_COUNT * itemWidth;
        updateArrows();
    };

    rightArrow.onclick = () => {
        if (posterPage >= totalPages - 1) return;
        posterPage++;
        carousel.scrollLeft = posterPage * POSTER_VISIBLE_COUNT * itemWidth;
        updateArrows();
    };

    // Hide arrows if not enough items to scroll
    if (totalItems <= POSTER_VISIBLE_COUNT) {
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'none';
    } else {
        leftArrow.style.display = '';
        rightArrow.style.display = '';
    }

    carousel.scrollLeft = 0;
    updateArrows();
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
    posterPage = 0;
}