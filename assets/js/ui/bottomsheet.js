const BOTTOMSHEET = document.querySelector('.bottomsheet');
const OVERLAY = document.querySelector('.overlay');
const HANDLE_AREA = document.querySelector('.bottomsheet-title');
const HANDLE = document.querySelector('.drag-handle');
const CLOSE = document.querySelector('.bottomsheet-close');

let dragging = false;
let startY = 0;
let currentY = 0;

export function openSheet() {
    OVERLAY.classList.add('active');
    BOTTOMSHEET.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closeSheet(fromDrag = false) {
    if (!BOTTOMSHEET.classList.contains('active')) return;

    OVERLAY.classList.remove('active');
    BOTTOMSHEET.style.transition = '';
    document.body.style.overflow = '';

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

export function loadBottomsheetEventListeners() {
    // Screen width listener
    onWidthChange();
    window.matchMedia('(max-width: 768px)').addEventListener('change', e => onWidthChange(e));

    // Mouse events
    HANDLE_AREA.addEventListener('mousedown', e => onDragStart(e.clientY));
    window.addEventListener('mousemove', e => onDragMove(e.clientY));
    window.addEventListener('mouseup', onDragEnd);
    OVERLAY.addEventListener('click', () => closeSheet());
    CLOSE.addEventListener('click', () => closeSheet());

    // Touch events
    HANDLE_AREA.addEventListener('touchstart', e => onDragStart(e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove', e => {
        if (dragging) e.preventDefault();
        onDragMove(e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener('touchend', onDragEnd);
}

function onWidthChange(e = window.matchMedia('(max-width: 768px)').matches) {
    HANDLE.style.visibility = e.matches ? 'visible' : 'hidden';
    HANDLE.style.cursor = e.matches ? 'grab' : 'default';
    CLOSE.style.visibility = e.matches ? 'hidden' : 'visible';
    CLOSE.style.cursor = e.matches ? 'default' : 'pointer';
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