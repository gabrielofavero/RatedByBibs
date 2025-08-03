const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');

export function loadImageUploadEventListeners() {
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', event => {
        handleFile(event.target.files[0]);
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
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = e => {
        preview.onload = () => {
            const aspectRatio = preview.naturalWidth / preview.naturalHeight;
            dropzone.style.aspectRatio = `${preview.naturalWidth} / ${preview.naturalHeight}`;
            preview.style.display = 'block';
            dropzone.classList.add('has-image');
        };

        preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}