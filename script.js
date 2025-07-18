// DOM Elements - Capture Step
const video = document.getElementById('video');
const snap = document.getElementById('snap');
const countdownElement = document.getElementById('countdown');
const photoCounterDisplay = document.getElementById('photo-counter-display');
const photosDiv = document.getElementById('photos');
const filterSelect = document.getElementById('filter-select');
const countdownTimeSelect = document.getElementById('countdown-time');
const filterPreview = document.getElementById('filter-preview');
const flipCameraBtn = document.getElementById('flip-camera');

// DOM Elements - Steps
const captureStep = document.getElementById('capture-step');
const designStep = document.getElementById('design-step');
const downloadStep = document.getElementById('download-step');

// DOM Elements - Design Step
const photostripCanvas = document.getElementById('photostrip-canvas');
const frameColorInput = document.getElementById('frame-color');
const frameWidthInput = document.getElementById('frame-width');
const frameWidthValue = document.getElementById('frame-width-value');
const doneDesigningBtn = document.getElementById('done-designing');
const customTextInput = document.getElementById('custom-text');
const textFontSelect = document.getElementById('text-font');
const textColorInput = document.getElementById('text-color');
const textSizeInput = document.getElementById('text-size');
const textSizeValue = document.getElementById('text-size-value');
const layoutOptions = document.querySelectorAll('.layout-option');
const frameOptions = document.querySelectorAll('.frame-option');
const colorPresets = document.querySelectorAll('.color-preset');

// DOM Elements - Download Step
const finalResultDiv = document.getElementById('final-result');
const downloadLink = document.getElementById('download');
const fileFormatSelect = document.getElementById('file-format');
const fileNameInput = document.getElementById('file-name');
const startOverBtn = document.getElementById('start-over');
const shareBtn = document.getElementById('share-btn');

// DOM Elements - Share Modal
const shareModal = document.getElementById('share-modal');
const closeModalBtn = document.querySelector('.close-modal');
const shareOptions = document.querySelectorAll('.share-option');
const copyLinkBtn = document.getElementById('copy-link-btn');
const shareLinkInput = document.getElementById('share-link');

// App State
const capturedPhotos = [];
const PHOTO_COUNT = 3;
let photoCounter = 0;
let currentLayout = 'vertical';
let currentFrameStyle = 'solid';
let currentFilter = 'none';
let countdownTime = 3;
let currentFacingMode = 'user'; // Default to front camera
let currentTextSize = 20;

async function startCamera() {
    try {
        // Stop any existing stream
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: currentFacingMode
            }, 
            audio: false 
        });
        video.srcObject = stream;
        video.play();
        
        // Only apply horizontal flip for user-facing camera
        if (currentFacingMode === 'user') {
            video.style.transform = 'scaleX(-1)'; // This flips the video horizontally
        } else {
            video.style.transform = 'scaleX(1)'; // No flip for environment-facing camera
        }
        
        // Apply initial filter preview
        applyFilterPreview();
    } catch (err) {
        console.error("Camera access error:", err);
        alert("Could not access camera. Please allow camera access and refresh the page.");
    }
}

async function flipCamera() {
    // Toggle between front and rear cameras
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    // Disable the button during camera switch to prevent multiple clicks
    flipCameraBtn.disabled = true;
    
    try {
        await startCamera();
    } catch (err) {
        console.error("Failed to flip camera:", err);
        alert("Could not switch camera. Your device might only have one camera or access was denied.");
        // Revert to previous camera if failed
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    } finally {
        // Re-enable the button
        flipCameraBtn.disabled = false;
    }
}

function applyFilterPreview() {
    // Remove any existing filter classes
    filterPreview.className = 'filter-preview';
    
    // Add the selected filter class
    if (currentFilter !== 'none') {
        filterPreview.classList.add(`filter-${currentFilter}`);
    }
    
    // Apply CSS filter effects based on the selected filter
    switch(currentFilter) {
        case 'grayscale':
            filterPreview.style.backgroundColor = 'rgba(0,0,0,0.1)';
            filterPreview.style.mixBlendMode = 'color';
            break;
        case 'sepia':
            filterPreview.style.backgroundColor = 'rgba(112, 66, 20, 0.2)';
            filterPreview.style.mixBlendMode = 'multiply';
            break;
        case 'vintage':
            filterPreview.style.backgroundColor = 'rgba(255, 240, 173, 0.3)';
            filterPreview.style.mixBlendMode = 'overlay';
            break;
        case 'cool':
            filterPreview.style.backgroundColor = 'rgba(64, 93, 230, 0.2)';
            filterPreview.style.mixBlendMode = 'screen';
            break;
        case 'warm':
            filterPreview.style.backgroundColor = 'rgba(255, 126, 95, 0.2)';
            filterPreview.style.mixBlendMode = 'overlay';
            break;
        default:
            filterPreview.style.backgroundColor = 'transparent';
            filterPreview.style.mixBlendMode = 'normal';
    }
}

function takePicture() {
    snap.disabled = true;
    let countdown = parseInt(countdownTimeSelect.value);
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
    
    // Draw the video frame with correct orientation (un-mirror the image)
    tempCtx.save();
    tempCtx.scale(-1, 1); // Flip horizontally
    tempCtx.drawImage(video, -tempCanvas.width, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.restore();
    
    // Apply selected filter effect to the captured image
    applyFilterToCanvas(tempCtx, tempCanvas.width, tempCanvas.height);
    
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
    capturedPhotos.push({
        url: dataUrl,
        filter: currentFilter
    });

    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'captured-photo';
    img.title = `Photo ${photoCounter + 1}`;
    photosDiv.appendChild(img);
}

function applyFilterToCanvas(ctx, width, height) {
    switch(currentFilter) {
        case 'grayscale':
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg; // red
                data[i + 1] = avg; // green
                data[i + 2] = avg; // blue
            }
            ctx.putImageData(imageData, 0, 0);
            break;
            
        case 'sepia':
            const sepiaData = ctx.getImageData(0, 0, width, height);
            const sepiaPixels = sepiaData.data;
            for (let i = 0; i < sepiaPixels.length; i += 4) {
                const r = sepiaPixels[i];
                const g = sepiaPixels[i + 1];
                const b = sepiaPixels[i + 2];
                
                sepiaPixels[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                sepiaPixels[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                sepiaPixels[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
            ctx.putImageData(sepiaData, 0, 0);
            break;
            
        case 'vintage':
            // First apply a slight sepia tone
            const vintageData = ctx.getImageData(0, 0, width, height);
            const vintagePixels = vintageData.data;
            for (let i = 0; i < vintagePixels.length; i += 4) {
                const r = vintagePixels[i];
                const g = vintagePixels[i + 1];
                const b = vintagePixels[i + 2];
                
                vintagePixels[i] = Math.min(255, (r * 0.5) + (g * 0.4) + (b * 0.1) + 40);
                vintagePixels[i + 1] = Math.min(255, (r * 0.3) + (g * 0.6) + (b * 0.1) + 20);
                vintagePixels[i + 2] = Math.min(255, (r * 0.2) + (g * 0.3) + (b * 0.5));
            }
            ctx.putImageData(vintageData, 0, 0);
            
            // Add a slight vignette effect
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.max(width, height) * 0.7;
            
            ctx.globalCompositeOperation = 'multiply';
            const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius);
            gradient.addColorStop(0, 'rgba(255,255,255,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';
            break;
            
        case 'cool':
            const coolData = ctx.getImageData(0, 0, width, height);
            const coolPixels = coolData.data;
            for (let i = 0; i < coolPixels.length; i += 4) {
                coolPixels[i + 2] = Math.min(255, coolPixels[i + 2] + 30); // Increase blue
                coolPixels[i] = Math.max(0, coolPixels[i] - 10); // Decrease red slightly
            }
            ctx.putImageData(coolData, 0, 0);
            break;
            
        case 'warm':
            const warmData = ctx.getImageData(0, 0, width, height);
            const warmPixels = warmData.data;
            for (let i = 0; i < warmPixels.length; i += 4) {
                warmPixels[i] = Math.min(255, warmPixels[i] + 30); // Increase red
                warmPixels[i + 1] = Math.min(255, warmPixels[i + 1] + 15); // Increase green slightly
                warmPixels[i + 2] = Math.max(0, warmPixels[i + 2] - 10); // Decrease blue slightly
            }
            ctx.putImageData(warmData, 0, 0);
            break;
    }
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
    const customText = customTextInput.value;
    const textFont = textFontSelect.value;
    const textColor = textColorInput.value;
    
    // Update the border width display
    frameWidthValue.textContent = `${borderWidth}px`;
    
    let canvasWidth, canvasHeight;
    
    // Calculate dimensions based on layout
    switch(currentLayout) {
        case 'grid':
            // 2x2 grid layout (or 2x1 for 2 photos)
            const gridCols = PHOTO_COUNT <= 2 ? 1 : 2;
            const gridRows = Math.ceil(PHOTO_COUNT / gridCols);
            canvasWidth = (imgWidth * gridCols) + (borderWidth * (gridCols + 1));
            canvasHeight = (imgHeight * gridRows) + (borderWidth * (gridRows + 1));
            break;
            
        case 'horizontal':
            // Horizontal strip
            canvasWidth = (imgWidth * PHOTO_COUNT) + (borderWidth * (PHOTO_COUNT + 1));
            canvasHeight = imgHeight + (borderWidth * 2);
            break;
            
        case 'vertical':
        default:
            // Vertical strip (default)
            canvasWidth = imgWidth + (borderWidth * 2);
            canvasHeight = (imgHeight * PHOTO_COUNT) + (borderWidth * (PHOTO_COUNT + 1));
    }
    
    // Add extra space for text if needed
    if (customText) {
        canvasHeight += 60; // Extra space for text
    }
    
    photostripCanvas.width = canvasWidth;
    photostripCanvas.height = canvasHeight;

    // Fill background (border color)
    ctx.fillStyle = borderColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Apply frame style
    if (currentFrameStyle === 'rounded') {
        // Create a rounded rectangle for the background
        const radius = 20;
        ctx.fillStyle = '#fff';
        roundRect(ctx, borderWidth/2, borderWidth/2, canvasWidth - borderWidth, canvasHeight - borderWidth, radius);
    } else if (currentFrameStyle === 'polaroid') {
        // Create a polaroid-style frame
        const extraBottom = 40; // Extra space at the bottom of each photo for polaroid style
        ctx.fillStyle = '#fff';
        ctx.fillRect(borderWidth/2, borderWidth/2, canvasWidth - borderWidth, canvasHeight - borderWidth);
    }

    // Draw each photo based on layout
    capturedPhotos.forEach((photo, index) => {
        const img = new Image();
        img.onload = () => {
            let xPos, yPos;
            
            switch(currentLayout) {
                case 'grid':
                    const gridCols = PHOTO_COUNT <= 2 ? 1 : 2;
                    const row = Math.floor(index / gridCols);
                    const col = index % gridCols;
                    xPos = (col * imgWidth) + ((col + 1) * borderWidth);
                    yPos = (row * imgHeight) + ((row + 1) * borderWidth);
                    break;
                    
                case 'horizontal':
                    xPos = (index * imgWidth) + ((index + 1) * borderWidth);
                    yPos = borderWidth;
                    break;
                    
                case 'vertical':
                default:
                    xPos = borderWidth;
                    yPos = (index * imgHeight) + ((index + 1) * borderWidth);
            }
            
            // Apply frame style effects
            if (currentFrameStyle === 'rounded') {
                // Clip the image to a rounded rectangle
                ctx.save();
                const radius = 10;
                roundRect(ctx, xPos, yPos, imgWidth, imgHeight, radius, true);
                ctx.clip();
                ctx.drawImage(img, xPos, yPos, imgWidth, imgHeight);
                ctx.restore();
                
                // Add a subtle shadow
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.strokeStyle = '#f8f9fa';
                ctx.lineWidth = 1;
                roundRect(ctx, xPos, yPos, imgWidth, imgHeight, radius, true);
                ctx.shadowColor = 'transparent';
            } else if (currentFrameStyle === 'polaroid') {
                // Draw white border around image for polaroid style
                const padding = 10;
                const photoWidth = imgWidth - (padding * 2);
                const photoHeight = imgHeight - (padding * 2) - 30; // Extra space at bottom
                
                // Draw the photo with padding
                ctx.drawImage(img, xPos + padding, yPos + padding, photoWidth, photoHeight);
                
                // Add a subtle shadow to the frame
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.strokeStyle = '#f0f0f0';
                ctx.lineWidth = 1;
                ctx.strokeRect(xPos, yPos, imgWidth, imgHeight);
                ctx.shadowColor = 'transparent';
                
                // Add a small caption at the bottom of each polaroid
                ctx.fillStyle = textColor;
                ctx.font = '12px ' + textFont; // Fixed size for polaroid captions
                ctx.textAlign = 'center';
                ctx.fillText(`Photo ${index + 1}`, xPos + imgWidth/2, yPos + imgHeight - 15);
            } else {
                // Default solid frame
                ctx.drawImage(img, xPos, yPos, imgWidth, imgHeight);
            }
        };
        img.src = photo.url;
    });
    
    // Add custom text if provided
    if (customText) {
        const textY = canvasHeight - 30;
        ctx.fillStyle = textColor;
        ctx.font = `bold ${currentTextSize}px ${textFont}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add a subtle shadow to make text more readable on any background
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Draw the text
        ctx.fillText(customText, canvasWidth / 2, textY);
        
        // Reset shadow for other drawing operations
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, stroke = false) {
    if (typeof radius === 'undefined') radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (stroke) {
        ctx.stroke();
    } else {
        ctx.fill();
    }
}

function generateFinalImage() {
    // Get the selected file format
    const fileFormat = fileFormatSelect.value;
    const fileName = fileNameInput.value || 'photobooth-strip';
    const mimeType = fileFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = fileFormat === 'jpeg' ? 0.9 : 1.0;
    
    // The photostrip is already drawn on the canvas from the design step
    const finalDataUrl = photostripCanvas.toDataURL(mimeType, quality);
    
    finalResultDiv.innerHTML = ''; // Clear previous
    const finalImage = new Image();
    finalImage.id = 'final-image';
    finalImage.src = finalDataUrl;
    finalImage.alt = 'Your completed photo strip';
    finalResultDiv.appendChild(finalImage);

    // Set up download link
    downloadLink.href = finalDataUrl;
    downloadLink.download = `${fileName}.${fileFormat}`;
    downloadLink.style.display = 'inline-block';
    
    // Set up share link
    shareLinkInput.value = 'https://example.com/shared-photo'; // This would be a real sharing URL in production
}

function resetApp() {
    // Reset counters and arrays
    photoCounter = 0;
    capturedPhotos.length = 0;
    
    // Clear UI elements
    photosDiv.innerHTML = '';
    finalResultDiv.innerHTML = '';
    updatePhotoCounter();
    
    // Reset capture controls
    snap.style.display = 'inline-block';
    snap.disabled = false;
    downloadLink.style.display = 'none';
    filterSelect.value = 'none';
    countdownTimeSelect.value = '3';
    currentFilter = 'none';
    
    // Reset camera to front-facing if it's not already
    if (currentFacingMode !== 'user') {
        currentFacingMode = 'user';
        startCamera(); // Restart camera with front-facing mode
    }
    
    // Reset design controls
    frameColorInput.value = '#ffffff';
    frameWidthInput.value = '10';
    frameWidthValue.textContent = '10px';
    customTextInput.value = '';
    textFontSelect.value = "'Poppins', sans-serif";
    textColorInput.value = '#000000';
    textSizeInput.value = '20';
    textSizeValue.textContent = '20px';
    currentTextSize = 20;
    fileFormatSelect.value = 'png';
    fileNameInput.value = 'photobooth-strip';
    
    // Reset layout and frame options
    currentLayout = 'vertical';
    currentFrameStyle = 'solid';
    document.querySelectorAll('.layout-option, .frame-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector('.layout-option[data-layout="vertical"]').classList.add('active');
    document.querySelector('.frame-option[data-frame="solid"]').classList.add('active');
    
    // Apply filter preview
    applyFilterPreview();
    
    // Go back to first step
    goToStep('capture');
}

// Share functionality
function openShareModal() {
    shareModal.classList.add('active');
}

function closeShareModal() {
    shareModal.classList.remove('active');
}

function shareToSocial(platform) {
    // In a real app, this would integrate with social media APIs
    const shareUrl = shareLinkInput.value;
    const shareText = 'Check out my photo strip from Aziel\'s Professional Photo Booth!';
    
    let url;
    switch(platform) {
        case 'facebook':
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            break;
        case 'twitter':
            url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            break;
        case 'instagram':
            alert('To share on Instagram, please download the image and upload it through the Instagram app.');
            return;
        case 'email':
            url = `mailto:?subject=${encodeURIComponent('My Photo Strip')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
            break;
    }
    
    if (url) {
        window.open(url, '_blank');
    }
}

function copyShareLink() {
    shareLinkInput.select();
    document.execCommand('copy');
    
    // Show feedback
    copyLinkBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    }, 2000);
}

// Event Listeners - Initialization
window.addEventListener('load', () => {
    startCamera();
    updatePhotoCounter();
    resetApp(); // Initialize in the correct state
});

// Event Listeners - Capture Step
snap.addEventListener('click', takePicture);
filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    applyFilterPreview();
});
countdownTimeSelect.addEventListener('change', (e) => {
    countdownTime = parseInt(e.target.value);
});
flipCameraBtn.addEventListener('click', flipCamera);

// Event Listeners - Design Step
frameColorInput.addEventListener('input', drawPhotostrip);
frameWidthInput.addEventListener('input', drawPhotostrip);

// Improve text input handling with a small delay to prevent excessive redraws
customTextInput.addEventListener('input', () => {
    // Use debounce technique for better performance
    clearTimeout(customTextInput.timeout);
    customTextInput.timeout = setTimeout(drawPhotostrip, 300);
});

textFontSelect.addEventListener('change', drawPhotostrip);
textColorInput.addEventListener('input', drawPhotostrip);
textSizeInput.addEventListener('input', () => {
    currentTextSize = parseInt(textSizeInput.value);
    textSizeValue.textContent = `${currentTextSize}px`;
    drawPhotostrip();
});
doneDesigningBtn.addEventListener('click', () => goToStep('download'));

// Event Listeners - Layout Options
layoutOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Remove active class from all options
        layoutOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to clicked option
        option.classList.add('active');
        // Update current layout
        currentLayout = option.dataset.layout;
        // Redraw photostrip
        drawPhotostrip();
    });
});

// Event Listeners - Frame Options
frameOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Remove active class from all options
        frameOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to clicked option
        option.classList.add('active');
        // Update current frame style
        currentFrameStyle = option.dataset.frame;
        // Redraw photostrip
        drawPhotostrip();
    });
});

// Event Listeners - Color Presets
colorPresets.forEach(preset => {
    preset.addEventListener('click', () => {
        const color = preset.dataset.color;
        frameColorInput.value = color;
        drawPhotostrip();
    });
});

// Event Listeners - Download Step
fileFormatSelect.addEventListener('change', generateFinalImage);
fileNameInput.addEventListener('input', generateFinalImage);
startOverBtn.addEventListener('click', resetApp);
shareBtn.addEventListener('click', openShareModal);

// Event Listeners - Share Modal
closeModalBtn.addEventListener('click', closeShareModal);
shareOptions.forEach(option => {
    option.addEventListener('click', () => {
        shareToSocial(option.dataset.platform);
    });
});
copyLinkBtn.addEventListener('click', copyShareLink);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === shareModal) {
        closeShareModal();
    }
});