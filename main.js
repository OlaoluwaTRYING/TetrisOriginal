const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');

// Get the canvas position
const canvasRect = canvas.getBoundingClientRect();

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
// ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

// Define Tetromino Pieces
const TETROMINOS = [
    {color: '#eee4da', shape: [[1,1,1,1]]},
    {color: '#ede0c8', shape: [[1,1],[1,1]]},
    {color: '#85e2bE', shape: [[1,1,1],[1,0,0]]},
    {color: '#f59563', shape: [[1,1,1],[0,0,1]]},
    {color: '#edcf72', shape: [[1,1,0],[0,1,1]]},
    {color: 'cyan', shape: [[0,1,1],[1,1,0]]},
    {color: '#e9bd96', shape: [[0,1,0],[1,1,1]]},
];

// Base Interface Framework
let board = Array.from({length: ROWS},()=>Array(COLS).fill(null));
let currentTetromino = getRandomTetromino();
let currentPos = {x: 3, y: 0};
let score = 0;
let interval = 500;
let gameOver = false;
let rAF = null;  // keep track of the animation frame so we can cancel it
let speedIcreaseInterval = 10000;
let lastSpeedIcrease = Date.now();

// Functions to Create Pieces and Play
function getRandomTetromino() {
    return TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
}

// Unused Function (Setting the stroke color for drawing blocks on the canvas)
function shapeColor() {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            ctx.strokeStyle = `rgb(
                0
                ${Math.floor(255 - 42.5 * i)}
                ${Math.floor(255 - 42.5 * j)})`;
        }
    }
}

// For rendering individual blocks (or cells) on the canvas
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect((x *BLOCK_SIZE)-1, (y * BLOCK_SIZE)-1, (BLOCK_SIZE)-1, (BLOCK_SIZE)-1);
    ctx.strokeStyle = shapeColor();
    // ctx.strokeStyle = 'rgba(231, 9, 9, 0.51)';
    ctx.strokeRect((x *BLOCK_SIZE)-1, (y * BLOCK_SIZE)-1, (BLOCK_SIZE)-1, (BLOCK_SIZE)-1);
}

// For rendering the tetris game board on the canvas.
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }
}

// For drawing grid on Canvas
function draw() {
    ctx.lineWidth = 0.5;
    if (canvas.getContext) {
        for(var x = 0.5; x < 1000;x += BLOCK_SIZE) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 1000);
        }
        for(var y = 0.5; y < 1000; y += BLOCK_SIZE) {
            ctx.moveTo(0, y);
            ctx.lineTo(1000, y);
        }
    ctx.strokeStyle='rgb(221, 221, 221)';
    ctx.stroke();
    }
}

// For drawing the current tetromino on the canvas
function drawTetromino() {
    const shape = currentTetromino.shape;
    const color = currentTetromino.color;
    for (let y = 0; y < shape.length; y++) {
        for (let x=0; x < shape[y].length;x++) {
            if (shape[y][x]) {
                drawBlock (currentPos.x + x, currentPos.y + y, color);
            }
        }
    }
}

// Unused Function
function futurePosition() {
    const shape = currentTetromino.shape;
    let futureY = currentPos.y;
    while (!hasCollision(0, 1)) {
        futureY++;
    }
    return futureY;
}

// Checks for collision between the current tetromino and the board or walls
function hasCollision(xOffset, yOffset) {
    const shape = currentTetromino.shape;
    for (let y = 0; y< shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] && (currentPos.x + x +xOffset < 0 ||
                currentPos.x + x + xOffset >= COLS ||
                currentPos.y + y + yOffset >= ROWS ||
                board[currentPos.y + y + yOffset][currentPos.x + x + xOffset])){
                    return true;
                }
        }
    }
    return false;
}

// Merges the current tetromino with the board when it lands
// Updates the score
function mergeTetromino() {
    const shape = currentTetromino.shape;
    const color = currentTetromino.color;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                board[currentPos.y + y][currentPos.x + x] = color;
                score += shape.length;
            }
        }
    }
}

// Removes completed rows from the board and updates the score
function removeRows() {
    let linesRemoved = 0;
    for (let y = ROWS - 1; y >= 0; y-- ) {
        if (board[y].every(cell => cell)) {
            // Remove the row
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(null));
            linesRemoved++;
            y++;
        }
    }
    score += linesRemoved * linesRemoved * 100;
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('score').style.display = 'block';
}

// Rotates the current tetromino and checks for collisions
function rotateTetromino() {
    const shape = currentTetromino.shape;
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    currentTetromino.shape = newShape;
    if (hasCollision(0, 0)) {
        currentTetromino.shape = shape;
    }
}

// Moves the current tetromino down and checks for collisions
function moveDown() {
    if (!hasCollision(0, 1)) {
        currentPos.y++;
    } else {
        mergeTetromino();
        removeRows();
        currentTetromino = getRandomTetromino();
        currentPos = {x:3, y:0};
        if (hasCollision(0,0)) {
            gameOver = true;
            showGameOver();
            document.getElementById('restartButton').style.display = 'block';
        }
    }
}

// Drops the current tetromino down until it hits the bottom
function moveDropHard() {
    // Move the tetromino down until it hits the bottom
    while (!hasCollision(0, 1)) {
        currentPos.y++;
    }
    // Merge the tetromino with the board
    mergeTetromino();  
    removeRows();
    // Get a new random tetromino
    currentTetromino = getRandomTetromino();
    currentPos = {x: 3, y: 0};
    // Check for game over
    if (hasCollision(0, 0)) {
        gameOver = true;
        document.getElementById('restartButton').style.display = 'block';
    }
}

// Moves the current tetromino left or right and checks for collisions
function move(offsetX) {
    if (!hasCollision (offsetX, 0)) {
        currentPos.x += offsetX;
    }
}

// Increases the speed of the game every 10 seconds
function increaseSpeed() {
    const now = Date.now();
    if (now - lastSpeedIcrease >= speedIcreaseInterval) {
        lastSpeedIcrease = now;
        interval = Math.max(500, interval -20);
    }
}

// Shows the game over screen and stops the game loop
function showGameOver() {
    gameOver = true;
  
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
}

// Positions the restart button relative to the canvas
function positionRestartButton() {
    const canvas = document.getElementById('tetrisCanvas');
    const button = document.getElementById('restartButton');

    // Get the canvas position
    const canvasRect = canvas.getBoundingClientRect();

    // Position the button relative to the canvas
    button.style.position = 'absolute';
    button.style.top = `${canvasRect.top + (canvas.height / 2) + 50}px`; // 50px below the top of the canvas
    button.style.left = `${canvasRect.left + (canvas.width / 2)}px`; // 50px from the left of the canvas
    button.style.zIndex = 10; // Ensure it appears above the canvas
}

// Positions the score relative to the canvas
function positionScore() {
    const canvas = document.getElementById('tetrisCanvas');
    const score = document.getElementById('score');

    // Get the canvas position
    const canvasRect = canvas.getBoundingClientRect();

    // Position the score relative to the canvas
    score.style.position = 'absolute';
    score.style.top = `${canvasRect.top - (canvas.height / 10)}px`; // 30px above the top of the canvas
    score.style.left = `${canvasRect.left + canvasRect.width / 2}px`; // Centered horizontally relative to the canvas
    score.style.transform = 'translateX(-50%)'; // Center alignment
    score.style.zIndex = 10; // Ensure it appears above the canvas
}

// Call the function to position the button
positionRestartButton();
// Call the function to position the score
positionScore();

// Reposition the button on window resize
window.addEventListener('resize', positionRestartButton);
// Reposition the score on window resize
window.addEventListener('resize', positionScore);

// Main game loop
function gameLoop() {
    if (gameOver) return; // Stop the game loop if gameOver is true

    drawBoard();
    draw();
    drawTetromino();
    moveDown();
    increaseSpeed();
    setTimeout(gameLoop, interval);
}

// Event listeners for keyboard input and restart button
document.addEventListener('keydown', (event) => {
    if (gameOver) return;

    switch (event.key) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;      
        case 'ArrowDown':
            moveDown();
            break;
        case 'ArrowUp':
            rotateTetromino();
            break;
        case ' ':
            moveDropHard();
            break;
    }
});

// Event listener for the restart button
document.getElementById('restartButton').addEventListener('click', () => {
    // Reset the game state
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    currentTetromino = getRandomTetromino();
    currentPos = { x: 3, y: 0 };
    score = 0;
    interval = 500;
    gameOver = false;
    speedIcreaseInterval = 10000;
    lastSpeedIcrease = Date.now();

    // Update the UI
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('score').style.display = 'block';
    document.getElementById('restartButton').style.display = 'none';
    document.getElementById('restartButton').textContent = `Restart Game`;

    // Restart the game loop
    gameLoop();
});

// Start the game loop
gameLoop();