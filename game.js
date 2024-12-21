const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Sound effect generators
function createJumpSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
}

function createLandSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

function createStepSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
}

// Background music
function startBackgroundMusic() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    
    // Simple melody
    const notes = [262, 330, 392, 330, 262, 330, 392, 330];
    let noteIndex = 0;
    
    function playNextNote() {
        oscillator.frequency.setValueAtTime(notes[noteIndex], audioCtx.currentTime);
        noteIndex = (noteIndex + 1) % notes.length;
        setTimeout(playNextNote, 500);
    }
    
    oscillator.start();
    playNextNote();
}

// Sound state tracking
let wasJumping = false;
let stepTimer = 0;

// Set canvas size
canvas.width = 800;
canvas.height = 400;

// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVEMENT_SPEED = 5;

// Player
const player = {
    x: 50,
    y: 200,
    width: 30,
    height: 30,
    velocityX: 0,
    velocityY: 0,
    isJumping: false
};

// Platforms (including ground)
const platforms = [
    { x: 0, y: 350, width: 800, height: 50 },    // Ground
    { x: 200, y: 250, width: 100, height: 20 },  // Platform 1
    { x: 400, y: 200, width: 100, height: 20 },  // Platform 2
    { x: 600, y: 150, width: 100, height: 20 }   // Platform 3
];

// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game state
function update() {
    // Horizontal movement
    if (keys.ArrowLeft) {
        player.velocityX = -MOVEMENT_SPEED;
    } else if (keys.ArrowRight) {
        player.velocityX = MOVEMENT_SPEED;
    } else {
        player.velocityX = 0;
    }

    // Apply gravity
    player.velocityY += GRAVITY;

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Check platform collisions
    player.isJumping = true;
    for (const platform of platforms) {
        if (checkCollision(player, platform)) {
            // Top collision (landing)
            if (player.velocityY > 0 && 
                player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
            }
            // Bottom collision (hitting head)
            else if (player.velocityY < 0 && 
                     player.y >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Side collisions
            else if (player.velocityX > 0) {
                player.x = platform.x - player.width;
            } else if (player.velocityX < 0) {
                player.x = platform.x + platform.width;
            }
        }
    }

    // Jump if on ground
    if (keys.ArrowUp && !player.isJumping) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
        createJumpSound();
    }

    // Step sounds when moving
    if ((keys.ArrowLeft || keys.ArrowRight) && !player.isJumping) {
        if (Date.now() - stepTimer > 200) { // Play step sound every 200ms while moving
            createStepSound();
            stepTimer = Date.now();
        }
    }

    // Landing sound
    if (wasJumping && !player.isJumping) {
        createLandSound();
    }
    wasJumping = player.isJumping;

    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
}

// Helper functions
function drawCloud(x, y) {
    // Base cloud shape (lighter blue)
    ctx.fillStyle = '#4444ff';
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Draw a wavy cloud shape
    ctx.bezierCurveTo(x - 20, y + 20, x - 40, y + 10, x - 30, y - 10);
    ctx.bezierCurveTo(x - 40, y - 30, x - 10, y - 30, x, y - 20);
    ctx.bezierCurveTo(x + 20, y - 30, x + 30, y - 20, x + 30, y - 10);
    ctx.bezierCurveTo(x + 40, y, x + 30, y + 20, x, y);
    ctx.fill();
    
    // Add highlights (even lighter blue)
    ctx.fillStyle = '#6666ff';
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 10);
    ctx.bezierCurveTo(x - 25, y - 20, x - 5, y - 25, x + 5, y - 15);
    ctx.bezierCurveTo(x + 15, y - 25, x + 25, y - 20, x + 25, y - 10);
    ctx.bezierCurveTo(x + 15, y - 5, x - 5, y - 5, x - 15, y - 10);
    ctx.fill();
}

// Define static clouds
const clouds = [
    { x: 100, y: 80, scale: 1.2 },
    { x: 300, y: 60, scale: 0.8 },
    { x: 500, y: 90, scale: 1.0 },
    { x: 700, y: 70, scale: 1.4 }
];

// Main render function
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000033'; // Darker blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds with different sizes
    ctx.save();
    for (const cloud of clouds) {
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(cloud.scale, cloud.scale);
        drawCloud(0, 0);
        ctx.resetTransform();
    }
    ctx.restore();

    // Draw platforms (bonsai trees)
    for (const platform of platforms) {
        const centerX = platform.x + platform.width / 2;
        
        // Platform surface
        ctx.fillStyle = '#800000';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        if (platform.y < canvas.height - 100) { // Don't draw trees on ground platform
            // Tree trunk
            ctx.fillStyle = '#800000';
            const trunkWidth = 20;
            ctx.fillRect(
                centerX - trunkWidth/2,
                platform.y - 40,
                trunkWidth,
                60
            );

            // Main branches
            ctx.beginPath();
            ctx.moveTo(centerX, platform.y - 40);
            // Left branch
            ctx.lineTo(centerX - 25, platform.y - 60);
            ctx.lineTo(centerX - 35, platform.y - 70);
            // Right branch
            ctx.moveTo(centerX, platform.y - 40);
            ctx.lineTo(centerX + 25, platform.y - 60);
            ctx.lineTo(centerX + 35, platform.y - 70);
            ctx.strokeStyle = '#800000';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Foliage (triangular shapes)
            ctx.fillStyle = '#ff0000';
            // Left foliage
            ctx.beginPath();
            ctx.moveTo(centerX - 35, platform.y - 70);
            ctx.lineTo(centerX - 45, platform.y - 85);
            ctx.lineTo(centerX - 25, platform.y - 85);
            ctx.closePath();
            ctx.fill();

            // Right foliage
            ctx.beginPath();
            ctx.moveTo(centerX + 35, platform.y - 70);
            ctx.lineTo(centerX + 45, platform.y - 85);
            ctx.lineTo(centerX + 25, platform.y - 85);
            ctx.closePath();
            ctx.fill();

            // Top foliage
            ctx.beginPath();
            ctx.moveTo(centerX, platform.y - 60);
            ctx.lineTo(centerX - 15, platform.y - 90);
            ctx.lineTo(centerX + 15, platform.y - 90);
            ctx.closePath();
            ctx.fill();

            // Darker details
            ctx.fillStyle = '#cc0000';
            ctx.beginPath();
            ctx.moveTo(centerX, platform.y - 65);
            ctx.lineTo(centerX - 10, platform.y - 85);
            ctx.lineTo(centerX + 10, platform.y - 85);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Draw player (human-like figure)
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    // Body
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(
        centerX - 10,
        centerY - 5,
        20,
        20
    );

    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.fillRect(centerX - 15, centerY, 5, 15);
    ctx.fillRect(centerX + 10, centerY, 5, 15);

    // Legs
    ctx.fillRect(centerX - 8, centerY + 15, 6, 15);
    ctx.fillRect(centerX + 2, centerY + 15, 6, 15);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game with audio
canvas.addEventListener('click', () => {
    // Start audio context on user interaction
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    startBackgroundMusic();
    gameLoop();
});

// Initial instruction
ctx.fillStyle = '#ffffff';
ctx.font = '20px Arial';
ctx.fillText('Click to start with sound', canvas.width/2 - 100, canvas.height/2);
