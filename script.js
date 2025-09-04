const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const image = document.getElementById('imageSource');
const instructions = document.getElementById('instructions');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
const mouse = {
    x: null,
    y: null,
    radius: 100 // The area of effect around the mouse/touch
};

// --- Fade out instructions text ---
setTimeout(() => {
    instructions.style.opacity = '0';
}, 1000);


// --- Handle mouse movement for DESKTOP ---
window.addEventListener('mousemove', function(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

window.addEventListener('mouseout', function() {
    mouse.x = null;
    mouse.y = null;
});

// --- UPDATED: Handle touch events for MOBILE ---
window.addEventListener('touchstart', function(event){
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
});

window.addEventListener('touchmove', function(event) {
    // prevent default screen scrolling
    event.preventDefault(); 
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
}, { passive: false }); // Add passive: false to allow preventDefault

window.addEventListener('touchend', function() {
    mouse.x = null;
    mouse.y = null;
});


// --- Wait for the image to load before starting ---
image.onload = function() {
    initialize();
};

function initialize() {
    // Make a temporary copy of the canvas with the image to read pixel data
    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    tempCtx.drawImage(image, 0, 0, image.width, image.height);
    const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesArray = [];

    // --- UPDATED: Dynamic Particle Density for Performance ---
    let density;
    if (window.innerWidth < 768) {
        density = 8; // Less particles on mobile for better performance
    } else {
        density = 5; // More particles on desktop
    }
    
    // Calculate scaling and positioning to center the image
    const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
    const offsetX = (canvas.width - image.width * scale) / 2;
    const offsetY = (canvas.height - image.height * scale) / 2;

    for (let y = 0; y < imageData.height; y += density) {
        for (let x = 0; x < imageData.width; x += density) {
            const index = (y * imageData.width + x) * 4;
            const alpha = imageData.data[index + 3];

            if (alpha > 128) { // Only create particles for visible pixels
                const red = imageData.data[index];
                const green = imageData.data[index + 1];
                const blue = imageData.data[index + 2];
                const color = `rgb(${red},${green},${blue})`;
                // Apply scaling and offset to position particles correctly
                const particleX = offsetX + x * scale;
                const particleY = offsetY + y * scale;
                particlesArray.push(new Particle(particleX, particleY, color));
            }
        }
    }
    animate();
}

// --- Particle Class ---
class Particle {
    constructor(x, y, color) {
        this.x = x + (Math.random() - 0.5) * 20; // Start at a random nearby position
        this.y = y + (Math.random() - 0.5) * 20;
        this.originX = x;
        this.originY = y;
        this.color = color;
        this.size = 2;
        this.vx = 0;
        this.vy = 0;
        this.ease = 0.04; // How quickly particles return to their origin
        this.friction = 0.95; // Slows the particle down
        this.force = 0;
        this.angle = 0;
        this.distance = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        // Calculate distance and angle from mouse/touch
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        this.distance = Math.sqrt(dx * dx + dy * dy);
        this.force = -mouse.radius / this.distance;

        if (this.distance < mouse.radius) {
            this.angle = Math.atan2(dy, dx);
            this.vx += this.force * Math.cos(this.angle);
            this.vy += this.force * Math.sin(this.angle);
        }

        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Ease back to origin
        this.x += this.vx + (this.originX - this.x) * this.ease;
        this.y += this.vy + (this.originY - this.y) * this.ease;
    }
}

// --- Animation Loop ---
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animate);
}

// --- Handle window resize ---
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initialize(); // Re-create particles for the new size
});