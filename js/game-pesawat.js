// ==========================================
// 🔥 AUDIO ENGINE (BGM & SFX SAKTI) 🔥
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let isMuted = false;

const bgmHell = document.getElementById('bgmHell');
const bgmAmbience = document.getElementById('bgmAmbience');
const btnSound = document.getElementById('btnSound');

bgmHell.volume = 0.4;
bgmAmbience.volume = 0.5;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function toggleAudio() {
    isMuted = !isMuted;
    if(isMuted) {
        btnSound.classList.add('muted');
        btnSound.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        bgmHell.pause(); bgmAmbience.pause();
    } else {
        btnSound.classList.remove('muted');
        btnSound.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        if (gameStarted) playCurrentBgm(); // Lanjutin lagu kalo game lagi jalan
    }
}

function playCurrentBgm() {
    if (isMuted) return;
    bgmHell.pause(); bgmAmbience.pause(); // Reset dulu
    if (currentMode && currentMode.name === 'HELL') {
        bgmHell.play().catch(e => console.log(e));
    } else {
        bgmAmbience.play().catch(e => console.log(e));
    }
}

function stopBgm() {
    bgmHell.pause(); bgmHell.currentTime = 0;
    bgmAmbience.pause(); bgmAmbience.currentTime = 0;
}

function playSfx(type) {
    if (isMuted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'select') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'shoot') {
        // Suara pew-pew peluru (sengaja dikecilin biar ga berisik)
        osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gainNode.gain.setValueAtTime(0.02, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'hit') {
        // Suara alien ancur
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'warning') {
        // Suara lonceng boss dateng
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(600, now + 0.5);
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'explode') {
        // Suara duar pas mati
        osc.type = 'square'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
}

// ==========================================
// GAME LOGIC
// ==========================================
const diffScreen = document.getElementById('difficulty-screen');
const selectScreen = document.getElementById('selection-screen');
const gameScreen = document.getElementById('game-screen');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('currentScore');
const warningMsg = document.getElementById('warningMsg');
const bossHealthContainer = document.getElementById('boss-health-container');
const bossHealthBar = document.getElementById('boss-health-bar');
const endOverlay = document.getElementById('end-overlay');
const modeIndicator = document.getElementById('modeIndicator');

const gameModes = {
    easy: { name: 'EASY', color: '#10b981', spawnRate: 1200, enemySpeed: 1, reqScore: 100, bossHp: 50, bossFireRate: 1500, zigZagChance: 0.1 },
    normal: { name: 'NORMAL', color: '#3b82f6', spawnRate: 800, enemySpeed: 2, reqScore: 200, bossHp: 100, bossFireRate: 1000, zigZagChance: 0.3 },
    hard: { name: 'HARD', color: '#f59e0b', spawnRate: 600, enemySpeed: 3.5, reqScore: 350, bossHp: 180, bossFireRate: 700, zigZagChance: 0.6 },
    hell: { name: 'HELL', color: '#ef4444', spawnRate: 400, enemySpeed: 5, reqScore: 500, bossHp: 300, bossFireRate: 400, zigZagChance: 0.9 }
};

const playerShipModels = [
    { type: 'speedster', speed: 8.5, fireRate: 120, color: '#3b82f6', bulletWidth: 6 }, 
    { type: 'tank', speed: 5.5, fireRate: 250, color: '#10b981', bulletWidth: 15 }   
];

let currentMode = null; let selectedShipData = null;
let player = { x: 225, y: 500, width: 50, height: 50, speed: 5, color: '#3b82f6' };
let bullets = []; let enemies = []; let bossBullets = []; let stars = []; 
let boss = { x: 150, y: -150, width: 200, height: 80, health: 100, maxHealth: 100, active: false, dx: 3.5, dy: 1, lastShoot: 0 };

let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, KeyW: false, KeyS: false, KeyA: false, KeyD: false };
let score = 0; let isGameOver = false; let gameStarted = false; 
let lastFireTime = 0; let lastEnemySpawn = 0; let animationId;

for (let i = 0; i < 50; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2, speed: Math.random() * 3 + 1 });

document.body.addEventListener('click', () => { if(!audioCtx) initAudio(); }, {once:true});

function setDifficulty(modeKey) {
    initAudio(); playSfx('select'); // Bunyi klik
    currentMode = gameModes[modeKey];
    modeIndicator.innerText = currentMode.name;
    modeIndicator.style.backgroundColor = currentMode.color + '40';
    modeIndicator.style.color = currentMode.color;
    modeIndicator.style.border = `1px solid ${currentMode.color}`;
    
    diffScreen.style.opacity = 0;
    setTimeout(() => { diffScreen.style.display = 'none'; selectScreen.style.display = 'flex'; selectScreen.style.opacity = 1; }, 400);
}

function pilihPesawat(index) {
    playSfx('select');
    selectedShipData = playerShipModels[index];
    player.color = selectedShipData.color;
    player.speed = selectedShipData.speed;

    selectScreen.style.opacity = 0;
    setTimeout(() => { selectScreen.style.display = 'none'; gameScreen.style.display = 'flex'; resetGameData(); startGameLoop(); }, 400);
}

function restartToSelection() {
    playSfx('select'); stopBgm();
    cancelAnimationFrame(animationId); endOverlay.style.display = 'none'; gameScreen.style.display = 'none';
    diffScreen.style.display = 'flex'; diffScreen.style.opacity = 1;
}

window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.code)) keys[e.code] = true; });
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.code)) keys[e.code] = false; });

canvas.addEventListener('touchmove', e => {
    if (isGameOver || !gameStarted) return;
    e.preventDefault();
    const touch = e.touches[0]; const rect = canvas.getBoundingClientRect();
    let newX = (touch.clientX - rect.left) * (canvas.width / rect.width) - player.width/2;
    let newY = (touch.clientY - rect.top) * (canvas.height / rect.height) - player.height/2;
    if(!isNaN(newX) && !isNaN(newY)) { player.x = newX; player.y = newY; }
}, { passive: false });

function checkCollision(obj1, obj2) { return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y; }
function checkCircleCollision(circle, rect) {
    let testX = circle.x; let testY = circle.y;
    if (circle.x < rect.x) testX = rect.x; else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;
    if (circle.y < rect.y) testY = rect.y; else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;
    let distX = circle.x - testX; let distY = circle.y - testY;
    return Math.sqrt((distX*distX) + (distY*distY)) <= circle.size;
}

function triggerGameOver() {
    isGameOver = true; gameStarted = false;
    stopBgm(); playSfx('explode'); // Suara ledakan mati!
    document.getElementById('end-title').innerText = "KAPAL HANCUR!";
    document.getElementById('end-title').style.color = "#ef4444";
    document.getElementById('end-score').innerText = "Skor Mentok: " + score;
    endOverlay.style.display = 'flex';
}

function triggerWin() {
    isGameOver = true; gameStarted = false;
    stopBgm(); playSfx('select'); 
    document.getElementById('end-title').innerText = "MISSION SUCCESS! 🎉";
    document.getElementById('end-title').style.color = "var(--success)";
    document.getElementById('end-score').innerText = `Boss ${currentMode.name} Hancur! Skor: ${score}`;
    endOverlay.style.display = 'flex';
}

function resetGameData() {
    player.x = 225; player.y = 500; bullets = []; enemies = []; bossBullets = []; 
    score = 0; scoreElement.innerText = 0; isGameOver = false; gameStarted = false; 
    boss.active = false; boss.y = -150; boss.x = 150; boss.maxHealth = currentMode.bossHp; boss.health = boss.maxHealth; 
    bossHealthBar.style.width = '100%'; bossHealthContainer.style.display = 'none'; warningMsg.style.display = 'none';
}

function startGameLoop() {
    playCurrentBgm(); // Puter BGM sesuai mode!
    setTimeout(() => { gameStarted = true; }, 1000);
    if(animationId) cancelAnimationFrame(animationId);
    update();
}

function update() {
    if (isGameOver) return;
    
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    stars.forEach(s => { s.y += s.speed; if (s.y > canvas.height) s.y = 0; ctx.fillRect(s.x, s.y, s.size, s.size); });

    if (!gameStarted) {
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = '24px Poppins';
        ctx.fillText('GET READY...', canvas.width/2, canvas.height/2);
        drawPlayer(); animationId = requestAnimationFrame(update); return;
    }

    if (keys.ArrowUp || keys.KeyW) player.y -= player.speed;
    if (keys.ArrowDown || keys.KeyS) player.y += player.speed;
    if (keys.ArrowLeft || keys.KeyA) player.x -= player.speed;
    if (keys.ArrowRight || keys.KeyD) player.x += player.speed;
    
    if(player.x < 0) player.x = 0; if(player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if(player.y < 0) player.y = 0; if(player.y + player.height > canvas.height) player.y = canvas.height - player.height;

    drawPlayer();
    
    const now = Date.now();
    if (now - lastFireTime > selectedShipData.fireRate) {
        playSfx('shoot'); // Suara pew-pew!
        bullets.push({ x: player.x + player.width/2 - (selectedShipData.bulletWidth/2), y: player.y - 15, width: selectedShipData.bulletWidth, height: 15 });
        lastFireTime = now;
    }

    ctx.fillStyle = '#38bdf8'; ctx.shadowBlur = 10; ctx.shadowColor = '#38bdf8';
    bullets.forEach((b, bi) => { b.y -= 12; ctx.fillRect(b.x, b.y, b.width, b.height); if (b.y < -20) bullets.splice(bi, 1); });
    ctx.shadowBlur = 0;

    if (!boss.active && (now - lastEnemySpawn > currentMode.spawnRate)) {
        let isZigZag = Math.random() < currentMode.zigZagChance; 
        enemies.push({ x: Math.random() * (canvas.width - 35), y: -40, width: 35, height: 35, speedY: Math.random() * 2 + currentMode.enemySpeed, isZigZag: isZigZag, time: Math.random() * 100, color: `hsl(${Math.random() * 40 + 340}, 80%, 60%)` });
        lastEnemySpawn = now;
    }

    enemies.forEach((e, ei) => {
        e.y += e.speedY;
        if(e.isZigZag) { e.time += 0.1; e.x += Math.sin(e.time) * 4; }
        
        ctx.fillStyle = e.color; ctx.shadowBlur = 8; ctx.shadowColor = e.color;
        ctx.beginPath(); ctx.moveTo(e.x + e.width/2, e.y); ctx.lineTo(e.x + e.width, e.y + e.height/2); ctx.lineTo(e.x + e.width/2, e.y + e.height); ctx.lineTo(e.x, e.y + e.height/2); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;

        bullets.forEach((b, bi) => {
            if (checkCollision(b, e)) {
                playSfx('hit'); // Suara alien pecah
                enemies.splice(ei, 1); bullets.splice(bi, 1); score += 10; scoreElement.innerText = score;
            }
        });

        if (checkCollision(player, e)) triggerGameOver();
        if (e.y > canvas.height) enemies.splice(ei, 1);
    });

    if (score >= currentMode.reqScore && !boss.active) {
        boss.active = true; enemies = []; 
        playSfx('warning'); // Suara lonceng peringatan boss!
        warningMsg.style.display = 'block'; setTimeout(() => warningMsg.style.display = 'none', 3000);
        bossHealthContainer.style.display = 'block';
    }

    if (boss.active) {
        if (boss.y < 30) { boss.y += boss.dy; } else { boss.x += boss.dx; if(boss.x < 10 || boss.x + boss.width > canvas.width - 10) boss.dx *= -1; }

        ctx.fillStyle = '#a855f7'; ctx.shadowBlur = 20; ctx.shadowColor = '#a855f7';
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(boss.x + boss.width/2 - 20, boss.y + boss.height - 10, 40, 15);
        ctx.shadowBlur = 0;

        if (boss.y >= 30 && (now - boss.lastShoot > currentMode.bossFireRate)) {
            if (currentMode.name === 'HARD' || currentMode.name === 'HELL') {
                let angle = Math.atan2(player.y - (boss.y + boss.height), player.x - (boss.x + boss.width/2));
                let bulletSpeed = currentMode.name === 'HELL' ? 8 : 5;
                bossBullets.push({ x: boss.x + boss.width/2, y: boss.y + boss.height, dx: Math.cos(angle) * bulletSpeed, dy: Math.sin(angle) * bulletSpeed, size: 8, color: '#ef4444' });
            }
            bossBullets.push({ x: boss.x + 20, y: boss.y + boss.height, dx: -3, dy: 6, size: 6, color: '#f59e0b' });
            bossBullets.push({ x: boss.x + boss.width - 20, y: boss.y + boss.height, dx: 3, dy: 6, size: 6, color: '#f59e0b' });
            boss.lastShoot = now;
        }

        bossBullets.forEach((bb, bbi) => {
            bb.x += bb.dx; bb.y += bb.dy;
            ctx.fillStyle = bb.color; ctx.shadowBlur = 10; ctx.shadowColor = bb.color;
            ctx.beginPath(); ctx.arc(bb.x, bb.y, bb.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

            if (checkCircleCollision(bb, player)) triggerGameOver();
            if (bb.y > canvas.height || bb.x < 0 || bb.x > canvas.width) bossBullets.splice(bbi, 1);
        });

        bullets.forEach((b, bi) => {
            if (checkCollision(b, boss)) {
                bullets.splice(bi, 1); boss.health -= 1;
                playSfx('hit'); 
                let persenDarah = (boss.health / boss.maxHealth) * 100;
                bossHealthBar.style.width = Math.max(0, persenDarah) + '%';
                score += 5; scoreElement.innerText = score;
                if (boss.health <= 0) triggerWin();
            }
        });

        if(checkCollision(player, boss)) triggerGameOver();
    }

    animationId = requestAnimationFrame(update);
}

function drawPlayer() {
    ctx.shadowBlur = 15; ctx.shadowColor = player.color; ctx.fillStyle = player.color;
    if (selectedShipData.type === 'speedster') {
        ctx.beginPath(); ctx.moveTo(player.x + player.width/2, player.y); ctx.lineTo(player.x, player.y + player.height); ctx.lineTo(player.x + player.width, player.y + player.height); ctx.closePath(); ctx.fill();
    } else {
        ctx.fillRect(player.x, player.y + 10, player.width, player.height - 10); ctx.fillStyle = '#0f766e'; ctx.fillRect(player.x + player.width/2 - 6, player.y, 12, 15);
    }
    ctx.shadowBlur = 0;
}
