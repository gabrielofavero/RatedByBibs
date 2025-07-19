import { UPLOAD_IMAGE, STARS } from "./inputs.js";

let GENERATED_IMAGE = '';

export async function generateCanvas() {
    if (!UPLOAD_IMAGE || STARS === 0) {
        alert("Please upload an image and select a star rating.");
        return;
    }
    const rating = '★'.repeat(STARS) + '☆'.repeat(5 - STARS);
    render('title');
    render('gaming-id');
    render('star-rating', rating);
    renderPlatform();
    await renderCanvas();
}

export async function downloadCanvas() {
    if (!GENERATED_IMAGE) {
        await generateCanvas();
    }
    const a = document.createElement('a');
    a.href = GENERATED_IMAGE;
    a.download = 'game-story.png';
    a.click();
}

export async function shareCanvas() {
    if (!GENERATED_IMAGE) {
        await generateCanvas();
    }

    const res = await fetch(GENERATED_IMAGE);
    const blob = await res.blob();
    const file = new File([blob], 'game-story.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'My Game Rating',
                text: `I rated a game ${STARS}/5 on ${document.getElementById('platform-select').value}! 🎮`
            });
        } catch (err) {
            alert("Sharing failed: " + err.message);
        }
    } else {
        alert("Sharing not supported on this browser/device.");
    }
}

async function renderCanvas() {
    const type = document.getElementById('include-background').checked ? 'story' : 'sticker';

    const container = document.getElementById('canvas-container');
    container.style.display = 'flex';
    container.classList.remove('sticker-container', 'story-container');
    container.classList.add(`${type}-container`);

    const gameCover = document.getElementById('game-cover');
    gameCover.classList.remove('sticker-game-cover', 'story-game-cover');
    gameCover.classList.add(`${type}-game-cover`);

    const canvas = await html2canvas(container, { backgroundColor: null });
    const dataUrl = canvas.toDataURL('image/png');
    GENERATED_IMAGE = dataUrl;

    const img = document.createElement('img');
    img.src = dataUrl;
    const preview = document.getElementById('preview');
    preview.innerHTML = '<h3>Preview:</h3>';
    preview.appendChild(img);

    container.style.display = 'none';
}

function render(id, value) {
    if (!value) {
        value = document.getElementById(id).value.trim()
    }
    const div = document.getElementById(`${id}-display`);
    if (value) {
        div.textContent = value;
        div.style.display = 'block';
    }
}

function renderPlatform() {
    const platform = document.getElementById('platform-select').value;
    if (platform) {
        const platformIcon = document.createElement('img');
        platformIcon.src = `assets/icons/${platform}.png`;
        platformIcon.style.height = '20px';
        document.getElementById('platform-display').innerHTML = '';
        document.getElementById('platform-display').appendChild(platformIcon);
    }
}