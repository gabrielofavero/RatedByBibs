export const BOTTOMSHEET = document.querySelector('.bottomsheet');
export const OVERLAY = document.querySelector('.overlay');
const handle = document.querySelector('.drag-handle');


let dragging = false;
let startY = 0;
let currentY = 0;

export function loadBottomsheetEventListeners() {
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
    if (!BOTTOMSHEET.classList.contains('active')) return;
    dragging = true;
    startY = y;
    BOTTOMSHEET.style.transition = 'none';
}

function onDragMove(y) {
    if (!dragging) return;
    currentY = Math.max(0, y - startY);
    BOTTOMSHEET.style.transform = `translateY(${currentY}px)`;
}

function onDragEnd() {
    if (!dragging) return;
    dragging = false;

    const sheetHeight = BOTTOMSHEET.getBoundingClientRect().height;
    const threshold = Math.min(0.35 * sheetHeight, 180);

    BOTTOMSHEET.style.transition = '';

    if (currentY > threshold) {
        closeSheet(true);
    } else {
        BOTTOMSHEET.style.transform = 'translateY(0)';
        const onEnd = () => {
            BOTTOMSHEET.style.transform = '';
            BOTTOMSHEET.removeEventListener('transitionend', onEnd);
        };
        BOTTOMSHEET.addEventListener('transitionend', onEnd, { once: true });
    }

    currentY = 0;
}

export function closeSheet(fromDrag = false) {
    if (!BOTTOMSHEET.classList.contains('active')) return;

    OVERLAY.classList.remove('active');
    BOTTOMSHEET.style.transition = '';

    if (!fromDrag) {
        BOTTOMSHEET.style.transform = 'translateY(0)';
        void BOTTOMSHEET.getBoundingClientRect();
    }

    BOTTOMSHEET.style.transform = 'translateY(100%)';

    const onEnd = () => {
        BOTTOMSHEET.classList.remove('active');
        BOTTOMSHEET.style.transform = '';
        BOTTOMSHEET.removeEventListener('transitionend', onEnd);
    };
    BOTTOMSHEET.addEventListener('transitionend', onEnd, { once: true });
}