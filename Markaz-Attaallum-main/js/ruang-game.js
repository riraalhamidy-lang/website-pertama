// DOM Elements
const menuArea = document.getElementById('gameMenu');
const playArea = document.getElementById('gamePlayArea');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('currentScore');
const highScoreElement = document.getElementById('highScore');
const btnRestart = document.getElementById('btnRestart');

// =================================================================
// JAVASCRIPT: TAALO RUN LOGIC
// =================================================================
let imgLari = new Image(); imgLari.src = 'aset/taalo-lari.png'; 
let imgKejedot = new Image(); imgKejedot.src = 'aset/taalokejedot.png';
let imgKitab = new Image(); imgKitab.src = 'aset/kitab.png'; 

let taalo = { x: 50, y: 240, width: 60, height: 60, dy: 0, jumpPower: -12, grounded: false };
let gravity = 0.7; 
let obstacles = [];
let gameSpeed = 5;
let score = 0;
let bestScore = localStorage.getItem('taaloHighScore') || 0;
let frameCount = 0;
let isGameOver = false;
let animationId;

// FUNGSI GANTI LAYAR
function pilihGame(gameName) {
    if(gameName === 'taalo-run') {
        menuArea.style.display = 'none'; 
        playArea.style.display = 'block'; 
        resetGame(); 
    }
}

function keluarGame() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    playArea.style.display = 'none';
    menuArea.style.display = 'grid';
}

highScoreElement.innerText = bestScore;

function jump() {
    if (isGameOver || playArea.style.display === 'none') return;
    if (taalo.grounded) {
        taalo.dy = taalo.jumpPower; taalo.grounded = false;
    }
}

window.addEventListener('keydown', (e) => { if(e.code === 'Space') jump(); });
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, {passive: false});
canvas.addEventListener('mousedown', jump);

function spawnObstacle() {
    let obsWidth = 45; 
    let obsHeight = Math.random() * 20 + 50; 
    obstacles.push({ x: canvas.width, y: canvas.height - obsHeight, width: obsWidth, height: obsHeight });
}

function update() {
    if (isGameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Fisika Taalo
    taalo.dy += gravity; taalo.y += taalo.dy;
    if (taalo.y + taalo.height >= canvas.height) { taalo.y = canvas.height - taalo.height; taalo.dy = 0; taalo.grounded = true; }

    if(!isGameOver) {
        if(imgLari.complete) { ctx.drawImage(imgLari, taalo.x, taalo.y, taalo.width, taalo.height); } 
        else { ctx.fillStyle = '#3b82f6'; ctx.fillRect(taalo.x, taalo.y, taalo.width, taalo.height); } 
    }

    // 2. Sistem Rintangan
    frameCount++;
    if (frameCount % Math.max(60, 120 - Math.floor(score/100)) === 0) { spawnObstacle(); }

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        if(imgKitab.complete) {
            ctx.drawImage(imgKitab, obs.x, obs.y, obs.width, obs.height);
        } else {
            ctx.fillStyle = '#ef4444'; ctx.fillRect(obs.x, obs.y, obs.width, obs.height); 
        }

        if ( taalo.x + 5 < obs.x + obs.width && taalo.x + taalo.width - 5 > obs.x && taalo.y + 5 < obs.y + obs.height && taalo.y + taalo.height - 5 > obs.y ) { gameOver(); }
    }
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

    // 3. Skor
    score++;
    scoreElement.innerText = Math.floor(score / 10);
    if (score % 500 === 0) gameSpeed += 0.5;

    animationId = requestAnimationFrame(update);
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    
    if(imgKejedot.complete) {
        ctx.drawImage(imgKejedot, taalo.x, taalo.y, taalo.width, taalo.height);
    }

    ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white"; ctx.font = "bold 24px Poppins"; ctx.textAlign = "center";
    ctx.fillText("YAHH NABRAK KITAB! 😭", canvas.width/2, canvas.height/2);
    
    btnRestart.style.display = "block"; 

    let finalScore = Math.floor(score / 10);
    if (finalScore > bestScore) {
        bestScore = finalScore; localStorage.setItem('taaloHighScore', bestScore);
        highScoreElement.innerText = bestScore;
        ctx.fillStyle = "#10b981"; ctx.fillText("REKOR BARU!", canvas.width/2, canvas.height/2 + 35);
    }
}

function resetGame() {
    taalo.y = 240; taalo.dy = 0; obstacles = []; score = 0; gameSpeed = 5; frameCount = 0; isGameOver = false;
    btnRestart.style.display = "none";
    update();
}
