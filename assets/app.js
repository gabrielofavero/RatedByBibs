
let selectedStars = 0;
let uploadedImage = null;
let generatedImageData = '';


document.addEventListener("DOMContentLoaded", function () {
    loadLocalStorageData();
    loadEventListeners();
});


function loadLocalStorageData() {
    document.getElementById('platform-select').value = localStorage.getItem('selectedPlatform') || '';
    document.getElementById('gaming-id').value = localStorage.getItem('gamingId') || '';
    updateInputPlaceholder(document.getElementById('platform-select').value);
}


function loadEventListeners() {
    document.getElementById('platform-select').addEventListener('change', (e) => {
        localStorage.setItem('selectedPlatform', e.target.value);
        updateInputPlaceholder(e.target.value);
    });

    document.getElementById('gaming-id').addEventListener('input', (e) => {
        localStorage.setItem('gamingId', e.target.value);
    });

    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedStars = parseInt(star.dataset.value);
            stars.forEach(star => {
                const val = parseInt(star.dataset.value);
                star.classList.toggle('selected', val <= selectedStars);
            });
        });
    });

    document.getElementById('upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            uploadedImage = event.target.result;
            document.getElementById('game-cover').style.backgroundImage = `url(${uploadedImage})`;
        };
        reader.readAsDataURL(file);
    });
}

function updateInputPlaceholder(platform) {
    let placeholder;

    switch (platform) {
        case 'xbox':
            placeholder = 'Gamertag';
            break;
        case 'switch':
        case 'switch2':
            placeholder = 'Nintendo Account';
            break;
        case 'steam':
            placeholder = 'Steam ID';
            break;
        case 'playstation':
            placeholder = 'PSN ID';
            break;
        default:
            placeholder = 'Gaming ID';
    }

    const gamingIdInput = document.getElementById('gaming-id');
    if (gamingIdInput) {
        gamingIdInput.placeholder = `${placeholder} (optional)`;
    }
}

async function generateCanvas() {
    if (!uploadedImage || selectedStars === 0) {
        alert("Please upload an image and select a star rating.");
        return;
    }

    const rating = '★'.repeat(selectedStars) + '☆'.repeat(5 - selectedStars);
    document.getElementById('rating-stars').textContent = rating;

    const gamingId = document.getElementById('gaming-id').value.trim();
    document.getElementById('gaming-id-display').textContent = gamingId ? gamingId : '';

    const platform = document.getElementById('platform-select').value;
    if (platform) {
        const platformIcon = document.createElement('img');
        platformIcon.src = `icons/${platform}.png`;
        platformIcon.style.height = '20px';
        document.getElementById('platform-display').innerHTML = '';
        document.getElementById('platform-display').appendChild(platformIcon);
    }

    await renderCanvas();
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
    generatedImageData = dataUrl;

    const img = document.createElement('img');
    img.src = dataUrl;
    const preview = document.getElementById('preview');
    preview.innerHTML = '<h3>Preview:</h3>';
    preview.appendChild(img);

    container.style.display = 'none';
}


async function downloadStory() {
    if (!generatedImageData) {
        await generateStory();
    }
    const a = document.createElement('a');
    a.href = generatedImageData;
    a.download = 'game-story.png';
    a.click();
}

async function shareStory() {
    if (!generatedImageData) {
        await generateStory();
    }

    const res = await fetch(generatedImageData);
    const blob = await res.blob();
    const file = new File([blob], 'game-story.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'My Game Rating',
                text: `I rated a game ${selectedStars}/5 on ${document.getElementById('platform-select').value}! 🎮`
            });
        } catch (err) {
            alert("Sharing failed: " + err.message);
        }
    } else {
        alert("Sharing not supported on this browser/device.");
    }
}
