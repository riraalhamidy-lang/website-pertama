
        // =================================================================

        // 🔥 AUDIO ENGINE SAKTI (WEB AUDIO API - PURE CODE!) 🔥

        // =================================================================

        const AudioContext = window.AudioContext || window.webkitAudioContext;

        let audioCtx;

        let isMuted = false;

        const bgMusic = document.getElementById('bgMusic');

        const btnSound = document.getElementById('btnSound');



        bgMusic.volume = 0.3; // Volume BGM di-set 30% biar gak pecah



        function initAudio() {

            if (!audioCtx) audioCtx = new AudioContext();

            if (audioCtx.state === 'suspended') audioCtx.resume();

            if (!isMuted) bgMusic.play().catch(e => console.log("Browser minta klik dulu baru bisa play musik"));

        }



        function toggleAudio() {

            isMuted = !isMuted;

            if(isMuted) {

                btnSound.classList.add('muted');

                btnSound.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';

                bgMusic.pause();

            } else {

                btnSound.classList.remove('muted');

                btnSound.innerHTML = '<i class="fa-solid fa-volume-high"></i>';

                initAudio();

            }

        }



        // Fungsi Synthesizer buat bikin suara dari kodingan

        function playSfx(type) {

            if (isMuted) return;

            initAudio();

           

            const osc = audioCtx.createOscillator();

            const gainNode = audioCtx.createGain();

            osc.connect(gainNode);

            gainNode.connect(audioCtx.destination);



            if (type === 'pickup') {

                // Suara TING pas balok dipegang

                osc.type = 'sine';

                osc.frequency.setValueAtTime(600, audioCtx.currentTime);

                osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);

                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

                osc.start(); osc.stop(audioCtx.currentTime + 0.1);

            }

            else if (type === 'drop') {

                // Suara THUD pas ditaruh

                osc.type = 'square';

                osc.frequency.setValueAtTime(150, audioCtx.currentTime);

                osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);

                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

                osc.start(); osc.stop(audioCtx.currentTime + 0.1);

            }

            else if (type === 'blast') {

                // Suara JEDAAAR pas garis hancur

                osc.type = 'sawtooth';

                osc.frequency.setValueAtTime(300, audioCtx.currentTime);

                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);

                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

                osc.start(); osc.stop(audioCtx.currentTime + 0.3);

            }

            else if (type === 'gameover') {

                // Suara TETT-TOOT pas kalah

                osc.type = 'square';

                osc.frequency.setValueAtTime(300, audioCtx.currentTime);

                osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 1);

                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

                gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1);

                osc.start(); osc.stop(audioCtx.currentTime + 1);

            }

        }



        // =================================================================

        // GAME LOGIC

        // =================================================================

        const BOARD_SIZE = 8;

        let board = [];

        let score = 0;

        let bestScore = localStorage.getItem('blockBlastBest') || 0;

        document.getElementById('bestDisplay').innerText = bestScore;



        const boardEl = document.getElementById('game-board');

        const trayEl = document.getElementById('tray');

        const scoreEl = document.getElementById('scoreDisplay');

        const endOverlay = document.getElementById('end-overlay');



        const SHAPES = [

            [[1]], [[1,1]], [[1],[1]], [[1,1,1]], [[1],[1],[1]], [[1,1,1,1]], [[1],[1],[1],[1]],

            [[1,1],[1,1]], [[1,1,1],[1,1,1],[1,1,1]], [[1,0],[1,1]], [[0,1],[1,1]], [[1,1],[1,0]],

            [[1,1],[0,1]], [[1,0,0],[1,0,0],[1,1,1]], [[0,0,1],[0,0,1],[1,1,1]], [[1,1,1],[0,1,0]], [[0,1,0],[1,1,1]]

        ];



        let activeShape = null; let activeMatrix = null; let activeColorClass = '';

        let startX = 0, startY = 0; let shapeOffsetX = 0, shapeOffsetY = 0;



        function initGame() {

            score = 0; updateScore(0);

            endOverlay.style.display = 'none';

            boardEl.innerHTML = ''; board = [];

           

            for (let r = 0; r < BOARD_SIZE; r++) {

                let row = [];

                for (let c = 0; c < BOARD_SIZE; c++) {

                    row.push(0);

                    let cell = document.createElement('div');

                    cell.className = 'cell'; cell.id = `cell-${r}-${c}`;

                    boardEl.appendChild(cell);

                }

                board.push(row);

            }

            fillTray();

        }



        function fillTray() {

            trayEl.innerHTML = '';

            for(let i=0; i<3; i++) spawnSingleShape();

            checkGameOver();

        }



        function spawnSingleShape() {

            let shapeMatrix = SHAPES[Math.floor(Math.random() * SHAPES.length)];

            let colorId = Math.floor(Math.random() * 6) + 1;

            let colorClass = `color-${colorId}`;

            let rows = shapeMatrix.length; let cols = shapeMatrix[0].length;



            let container = document.createElement('div');

            container.className = 'shape-container';

            container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            container.dataset.matrix = JSON.stringify(shapeMatrix);

            container.dataset.color = colorClass;



            for(let r=0; r<rows; r++) {

                for(let c=0; c<cols; c++) {

                    let block = document.createElement('div');

                    block.className = shapeMatrix[r][c] ? `block ${colorClass}` : 'block empty';

                    container.appendChild(block);

                }

            }

            container.addEventListener('pointerdown', handleDragStart);

            trayEl.appendChild(container);

        }



        function handleDragStart(e) {

            if(e.button !== 0 && e.type === 'pointerdown' && e.pointerType === 'mouse') return;

            initAudio(); // Bangunin sistem audio browser

            playSfx('pickup'); // PANGGIL SUARA PICKUP!



            let originalShape = e.currentTarget;

            activeMatrix = JSON.parse(originalShape.dataset.matrix);

            activeColorClass = originalShape.dataset.color;



            activeShape = originalShape.cloneNode(true);

            activeShape.className = 'shape-container dragging';

            document.body.appendChild(activeShape);



            originalShape.style.visibility = 'hidden';

            originalShape.id = 'hidden-origin';



            const rect = originalShape.getBoundingClientRect();

            shapeOffsetX = e.clientX - rect.left;

            shapeOffsetY = e.pointerType === 'touch' ? (e.clientY - rect.top) + 50 : (e.clientY - rect.top);



            moveGhostShape(e.clientX, e.clientY);

            document.addEventListener('pointermove', handleDragMove);

            document.addEventListener('pointerup', handleDragEnd);

        }



        function handleDragMove(e) {

            if(!activeShape) return;

            moveGhostShape(e.clientX, e.clientY);

            clearHighlights();

            let dropTarget = getValidDropPosition(e.clientX, e.clientY);

            if (dropTarget) highlightGrid(dropTarget.r, dropTarget.c, activeMatrix);

        }



        function handleDragEnd(e) {

            if(!activeShape) return;

            document.removeEventListener('pointermove', handleDragMove);

            document.removeEventListener('pointerup', handleDragEnd);



            let dropTarget = getValidDropPosition(e.clientX, e.clientY);

            let origin = document.getElementById('hidden-origin');



            if (dropTarget) {

                playSfx('drop'); // PANGGIL SUARA DROP!

                placeShapeOnBoard(dropTarget.r, dropTarget.c, activeMatrix, activeColorClass);

                origin.remove();

                score += getBlocksCount(activeMatrix); updateScore(score);

                checkAndClearLines();



                if(trayEl.children.length === 0) fillTray();

                else checkGameOver();

            } else {

                origin.style.visibility = 'visible';

                origin.removeAttribute('id');

            }



            activeShape.remove(); activeShape = null; clearHighlights();

        }



        function moveGhostShape(x, y) { activeShape.style.left = (x - shapeOffsetX) + 'px'; activeShape.style.top = (y - shapeOffsetY) + 'px'; }



        function getValidDropPosition(clientX, clientY) {

            const boardRect = boardEl.getBoundingClientRect();

            let shapeLeft = clientX - shapeOffsetX; let shapeTop = clientY - shapeOffsetY;

            let cellWidth = boardRect.width / BOARD_SIZE;

            let col = Math.round((shapeLeft - boardRect.left) / cellWidth);

            let row = Math.round((shapeTop - boardRect.top) / cellWidth);

            if (canPlaceShape(row, col, activeMatrix)) return { r: row, c: col };

            return null;

        }



        function canPlaceShape(startRow, startCol, matrix) {

            for(let r=0; r<matrix.length; r++) {

                for(let c=0; c<matrix[0].length; c++) {

                    if (matrix[r][c]) {

                        let targetR = startRow + r; let targetC = startCol + c;

                        if (targetR < 0 || targetR >= BOARD_SIZE || targetC < 0 || targetC >= BOARD_SIZE || board[targetR][targetC] !== 0) return false;

                    }

                }

            } return true;

        }



        function placeShapeOnBoard(startRow, startCol, matrix, colorClass) {

            for(let r=0; r<matrix.length; r++) {

                for(let c=0; c<matrix[0].length; c++) {

                    if (matrix[r][c]) {

                        board[startRow + r][startCol + c] = colorClass;

                        document.getElementById(`cell-${startRow+r}-${startCol+c}`).className = `cell ${colorClass}`;

                    }

                }

            }

        }



        function highlightGrid(startRow, startCol, matrix) {

            for(let r=0; r<matrix.length; r++) {

                for(let c=0; c<matrix[0].length; c++) {

                    if (matrix[r][c]) {

                        let cell = document.getElementById(`cell-${startRow+r}-${startCol+c}`);

                        if(cell) cell.classList.add('highlight');

                    }

                }

            }

        }



        function clearHighlights() { document.querySelectorAll('.cell').forEach(c => c.classList.remove('highlight')); }



        function checkAndClearLines() {

            let rowsToClear = []; let colsToClear = [];



            for (let r = 0; r < BOARD_SIZE; r++) {

                let isFull = true;

                for (let c = 0; c < BOARD_SIZE; c++) if (board[r][c] === 0) { isFull = false; break; }

                if (isFull) rowsToClear.push(r);

            }



            for (let c = 0; c < BOARD_SIZE; c++) {

                let isFull = true;

                for (let r = 0; r < BOARD_SIZE; r++) if (board[r][c] === 0) { isFull = false; break; }

                if (isFull) colsToClear.push(c);

            }



            if (rowsToClear.length > 0 || colsToClear.length > 0) {

                playSfx('blast'); // PANGGIL SUARA JEDAAAARRR!!!



                let linesCleared = rowsToClear.length + colsToClear.length;

                score += linesCleared * 10 * linesCleared; updateScore(score);



                rowsToClear.forEach(r => { for(let c=0; c<BOARD_SIZE; c++) board[r][c] = 0; });

                colsToClear.forEach(c => { for(let r=0; r<BOARD_SIZE; r++) board[r][c] = 0; });



                rowsToClear.forEach(r => { for(let c=0; c<BOARD_SIZE; c++) document.getElementById(`cell-${r}-${c}`).className = 'cell blast'; });

                colsToClear.forEach(c => { for(let r=0; r<BOARD_SIZE; r++) document.getElementById(`cell-${r}-${c}`).className = 'cell blast'; });



                setTimeout(() => { renderBoardUI(); }, 400);

            }

        }



        function renderBoardUI() {

            for(let r=0; r<BOARD_SIZE; r++) {

                for(let c=0; c<BOARD_SIZE; c++) {

                    let cell = document.getElementById(`cell-${r}-${c}`);

                    if (board[r][c] === 0) cell.className = 'cell'; else cell.className = `cell ${board[r][c]}`;

                }

            }

        }



        function checkGameOver() {

            let shapesInTray = trayEl.querySelectorAll('.shape-container');

            let canPlaceAny = false;



            shapesInTray.forEach(shapeEl => {

                if(shapeEl.style.visibility === 'hidden') return;

                let matrix = JSON.parse(shapeEl.dataset.matrix);

                for(let r=0; r<BOARD_SIZE; r++) {

                    for(let c=0; c<BOARD_SIZE; c++) {

                        if (canPlaceShape(r, c, matrix)) canPlaceAny = true;

                    }

                }

            });



            if (!canPlaceAny) {

                playSfx('gameover'); // PANGGIL SUARA TETT-TOOT!!!

                document.getElementById('end-score').innerText = "Skor Lu: " + score;

                if(score > bestScore) {

                    bestScore = score; localStorage.setItem('blockBlastBest', bestScore); document.getElementById('bestDisplay').innerText = bestScore;

                }

                endOverlay.style.display = 'flex';

            }

        }



        function getBlocksCount(matrix) {

            let count = 0;

            for(let r=0; r<matrix.length; r++) { for(let c=0; c<matrix[0].length; c++) if(matrix[r][c]) count++; }

            return count;

        }



        function updateScore(newScore) {

            scoreEl.innerText = newScore;

            scoreEl.style.transform = 'scale(1.2)';

            setTimeout(() => scoreEl.style.transform = 'scale(1)', 200);

        }



        // Sentuh layar pertama kali buat muter musik

        document.body.addEventListener('click', () => { if(!audioCtx) initAudio(); }, {once:true});

        document.body.addEventListener('touchstart', () => { if(!audioCtx) initAudio(); }, {once:true});



        initGame();