import { loadMorePlatforms } from "../steps/step-2.js";

const bottomsheet = document.querySelector('.bottomsheet');
const emojis = document.querySelectorAll('.emoji');
const confirmBtn = document.getElementById('confirm-bottomsheet');
const overlay = document.querySelector('.overlay');
let selectedEmoji = null;

const handle = document.querySelector('.drag-handle');

let dragging = false;
let startY = 0;
let currentY = 0;


export function loadBottomsheetEventListeners() {
    document.getElementById('more').addEventListener('click', () => {
        loadMorePlatforms();
        bottomsheet.classList.add('active');
        overlay.classList.add('active');
    });

    emojis.forEach(emoji => {
        emoji.addEventListener('click', () => {
            emojis.forEach(e => e.classList.remove('selected'));
            emoji.classList.add('selected');
            selectedEmoji = emoji.textContent;
            confirmBtn.disabled = false;
        });
    });

    confirmBtn.addEventListener('click', () => {
        console.log("Selected Emoji:", selectedEmoji);
        closeSheet();
        confirmBtn.disabled = true;
        emojis.forEach(e => e.classList.remove('selected'));
        selectedEmoji = null;
    });

    // Mouse events
    handle.addEventListener('mousedown', e => onDragStart(e.clientY));
    window.addEventListener('mousemove', e => onDragMove(e.clientY));
    window.addEventListener('mouseup', onDragEnd);

    // Touch events
    handle.addEventListener('touchstart', e => onDragStart(e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove', e => {
        if (dragging) e.preventDefault();
        onDragMove(e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener('touchend', onDragEnd);
}

function onDragStart(y) {
    if (!bottomsheet.classList.contains('active')) return;
    dragging = true;
    startY = y;
    bottomsheet.style.transition = 'none';
}

function onDragMove(y) {
    if (!dragging) return;
    currentY = Math.max(0, y - startY);
    bottomsheet.style.transform = `translateY(${currentY}px)`;
}

function onDragEnd() {
    if (!dragging) return;
    dragging = false;

    const sheetHeight = bottomsheet.getBoundingClientRect().height;
    const threshold = Math.min(0.35 * sheetHeight, 180);

    bottomsheet.style.transition = '';

    if (currentY > threshold) {
        closeSheet(true);
    } else {
        bottomsheet.style.transform = 'translateY(0)';
        const onEnd = () => {
            bottomsheet.style.transform = '';
            bottomsheet.removeEventListener('transitionend', onEnd);
        };
        bottomsheet.addEventListener('transitionend', onEnd, { once: true });
    }

    currentY = 0;
}

function closeSheet(fromDrag = false) {
    if (!bottomsheet.classList.contains('active')) return;

    overlay.classList.remove('active');
    bottomsheet.style.transition = '';

    if (!fromDrag) {
        bottomsheet.style.transform = 'translateY(0)';
        void bottomsheet.getBoundingClientRect();
    }

    bottomsheet.style.transform = 'translateY(100%)';

    const onEnd = () => {
        bottomsheet.classList.remove('active');
        bottomsheet.style.transform = '';
        bottomsheet.removeEventListener('transitionend', onEnd);
    };
    bottomsheet.addEventListener('transitionend', onEnd, { once: true });
}