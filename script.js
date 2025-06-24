const video = document.getElementById('video');
const snap = document.getElementById('snap');
const countdownElement = document.getElementById('countdown');
const photoCounterDisplay = document.getElementById('photo-counter-display');
const photosDiv = document.getElementById('photos');

const captureStep = document.getElementById('capture-step');
const designStep = document.getElementById('design-step');
const downloadStep = document.getElementById('download-step');

const photostripCanvas = document.getElementById('photostrip-canvas');
const frameColorInput = document.getElementById('frame-color');
const frameWidthInput = document.getElementById('frame-width');
const doneDesigningBtn = document.getElementById('done-designing');

const finalResultDiv = document.getElementById('final-result');
const downloadLink = document.getElementById('download');
const startOverBtn = document.getElementById('start-over');

const capturedPhotos = [];
const PHOTO_COUNT = 3;
let photoCounter = 0;

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        video.play();
    } catch (err) {
        console.error("An error occurred: " + err);
        alert("Could not access camera. Please allow camera access and refresh.");
    }
}

function takePicture() {
    snap.disabled = true;
    let countdown = 3;
    countdownElement.style.display = 'block';
    countdownElement.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown > 0 ? countdown : '📸';
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            captureFrame();
            countdownElement.style.display = 'none';
            
            photoCounter++;
            updatePhotoCounter();

            if (photoCounter < PHOTO_COUNT) {
                snap.disabled = false;
            } else {
                snap.style.display = 'none';
                setTimeout(() => goToStep('design'), 1000); // Wait a moment before switching
            }
        }
    }, 1000);
}

function captureFrame() {
    // Add flash effect
    const flash = document.getElementById('flash-overlay');
    flash.classList.add('flash');
    setTimeout(() => flash.classList.remove('flash'), 300);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    const dataUrl = tempCanvas.toDataURL('image/jpeg');
    capturedPhotos.push(dataUrl);

    const img = document.createElement('img');
    img.src = dataUrl;
    photosDiv.appendChild(img);
}

function updatePhotoCounter() {
    photoCounterDisplay.textContent = photoCounter;
}

function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`${step}-step`).classList.add('active');

    if (step === 'design') {
        drawPhotostrip();
    } else if (step === 'download') {
        generateFinalImage();
    }
}

function drawPhotostrip() {
    const ctx = photostripCanvas.getContext('2d');
    const imgWidth = video.videoWidth;
    const imgHeight = video.videoHeight;
    const borderWidth = parseInt(frameWidthInput.value, 10);
    const borderColor = frameColorInput.value;

    const canvasWidth = imgWidth + (borderWidth * 2);
    const canvasHeight = (imgHeight * PHOTO_COUNT) + (borderWidth * (PHOTO_COUNT + 1));
    
    photostripCanvas.width = canvasWidth;
    photostripCanvas.height = canvasHeight;

    // Fill background (border color)
    ctx.fillStyle = borderColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw each photo
    capturedPhotos.forEach((dataUrl, index) => {
        const img = new Image();
        img.onload = () => {
            const yPos = (index * imgHeight) + ((index + 1) * borderWidth);
            ctx.drawImage(img, borderWidth, yPos, imgWidth, imgHeight);
        };
        img.src = dataUrl;
    });
}

function generateFinalImage() {
    // The photostrip is already drawn on the canvas from the design step
    const finalDataUrl = photostripCanvas.toDataURL('image/png');
    
    finalResultDiv.innerHTML = ''; // Clear previous
    const finalImage = new Image();
    finalImage.id = 'final-image';
    finalImage.src = finalDataUrl;
    finalResultDiv.appendChild(finalImage);

    downloadLink.href = finalDataUrl;
    downloadLink.download = 'photobooth-strip.png';
    downloadLink.style.display = 'inline-block';
}

function resetApp() {
    photoCounter = 0;
    capturedPhotos.length = 0;
    photosDiv.innerHTML = '';
    finalResultDiv.innerHTML = '';
    updatePhotoCounter();
    
    snap.style.display = 'inline-block';
    snap.disabled = false;
    downloadLink.style.display = 'none';

    frameColorInput.value = '#ffffff';
    frameWidthInput.value = '10';

    goToStep('capture');
}

// Event Listeners
window.addEventListener('load', () => {
    startCamera();
    updatePhotoCounter();
    resetApp(); // Initialize in the correct state
});
snap.addEventListener('click', takePicture);
frameColorInput.addEventListener('input', drawPhotostrip);
frameWidthInput.addEventListener('input', drawPhotostrip);
doneDesigningBtn.addEventListener('click', () => goToStep('download'));
startOverBtn.addEventListener('click', resetApp); 