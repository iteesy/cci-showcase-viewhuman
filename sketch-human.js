let capture;

// HUMAN SIDE: Body segmentation and masking
let bodySegmentation;
let segmentation;
let pg; // off-screen buffer for human side
let cachedBlurredMask;
let lastMaskUpdate = 0;

function preload() {
    // Only load body segmentation for human view
    let options = {
        maskType: "person",
    };
    bodySegmentation = ml5.bodySegmentation("SelfieSegmentation", options);
}

function setup() {
    frameRate(30); // updated frm 60fps

    // Fixed size for human view
    createCanvas(640, 480, WEBGL);
    pg = createGraphics(640, 480); // off-screen canvas for post-processing
    
    // Initialize webcam
    capture = createCapture(VIDEO);
    capture.size(640, 480);
    capture.hide();
    
    // Start body segmentation detection
    bodySegmentation.detectStart(capture, gotSegmentation);
}

// Body segmentation callback
function gotSegmentation(result) {
    segmentation = result;
}

function windowResized() {
    // Keep fixed size for human view
    // No resize needed
}

function draw() {
    background(240, 240, 250);
    // Move origin back to top-left corner for WEBGL
    push();
    translate(-width/2, -height/2);
    drawHumanSide();
    pop();
}

function drawHumanSide() {
    noFill();
    
    if (segmentation) {
        blendMode(EXCLUSION);

        // try every 5th or 10th frame
        if (frameCount - lastMaskUpdate > 12) { // Was 2
            cachedBlurredMask = segmentation.mask.get();
            cachedBlurredMask.filter(BLUR, 2);
            lastMaskUpdate = frameCount;
        }
        
        // Use cached mask (if it exists)
        if (cachedBlurredMask) {
            capture.mask(cachedBlurredMask);
        }
        
        // Draw masked video to offscreen buffer
        pg.clear();
        pg.image(capture, 0, 0);
        
        //🚨🚨 Buffer every 180 frames (6 seconds at 30fps)
        // if (frameCount % 180 === 0) {
        //     // Create new buffer BEFORE destroying old one
        //     let newPg = createGraphics(640, 480);
        //     pg.remove(); // Remove old buffer
        //     pg = newPg;  // Use new buffer
        // }
        
        // Draw main masked image
        image(pg, 0, 0);
        blendMode(BLEND);
    }
}