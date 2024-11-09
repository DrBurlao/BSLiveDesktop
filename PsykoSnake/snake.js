const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const box = 20;
const canvasSize = 400;
let snake;
let enemies;
let direction;
let food;
let level;
let foodCount;
let gameSpeed;
let game;
let lives;
let difficulty;
let score;
let highScores = [];
let isPaused = false;

const eatSound = new Audio('eat.mp3');
const levelUpSound = new Audio('level-up.mp3');
const loseLifeSound = new Audio('lose-life.mp3');

document.addEventListener('keydown', changeDirection);
document.getElementById('leftButton').addEventListener('click', () => changeDirection({ key: 'ArrowLeft' }));
document.getElementById('upButton').addEventListener('click', () => changeDirection({ key: 'ArrowUp' }));
document.getElementById('rightButton').addEventListener('click', () => changeDirection({ key: 'ArrowRight' }));
document.getElementById('downButton').addEventListener('click', () => changeDirection({ key: 'ArrowDown' }));

function changeDirection(event) {
    if (event.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    if (event.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    if (event.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
    if (event.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
}

function createEnemy() {
    let enemy;
    do {
        enemy = [{ x: Math.floor(Math.random() * (canvasSize / box)) * box, y: Math.floor(Math.random() * (canvasSize / box)) * box }];
    } while (collision(enemy[0], snake));
    return enemy;
}

function moveEnemy(enemy) {
    let directions = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
    let dir = directions[Math.floor(Math.random() * directions.length)];
    let enemyX = enemy[0].x;
    let enemyY = enemy[0].y;

    if (dir === 'LEFT') enemyX -= box;
    if (dir === 'UP') enemyY -= box;
    if (dir === 'RIGHT') enemyX += box;
    if (dir === 'DOWN') enemyY += box;

    if (enemyX < 0 || enemyY < 0 || enemyX >= canvasSize || enemyY >= canvasSize || collision({ x: enemyX, y: enemyY }, enemy)) {
        return enemy;
    }

    enemy.pop();
    enemy.unshift({ x: enemyX, y: enemyY });
    return enemy;
}

function draw() {
    if (isPaused) return;
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? 'white' : getRandomColor();
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = '#121212';
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    for (let enemy of enemies) {
        for (let i = 0; i < enemy.length; i++) {
            ctx.fillStyle = 'orange';
            ctx.fillRect(enemy[i].x, enemy[i].y, box, box);
            ctx.strokeStyle = '#121212';
            ctx.strokeRect(enemy[i].x, enemy[i].y, box, box);
        }
    }

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, box, box);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction === 'LEFT') snakeX -= box;
    if (direction === 'UP') snakeY -= box;
    if (direction === 'RIGHT') snakeX += box;
    if (direction === 'DOWN') snakeY += box;

    if (snakeX === food.x && snakeY === food.y) {
        foodCount++;
        score += snake.length * level;
        eatSound.play();
        updateInfo();
        food = {
            x: Math.floor(Math.random() * (canvasSize / box)) * box,
            y: Math.floor(Math.random() * (canvasSize / box)) * box,
        };
        if (foodCount >= level * 10) {
            levelUp();
        }
    } else {
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    if (snakeX < 0 || snakeY < 0 || snakeX >= canvasSize || snakeY >= canvasSize || collision(newHead, snake)) {
        loseLifeSound.play();
        loseLife();
        return;
    }

    for (let enemy of enemies) {
        if (collision(newHead, enemy)) {
            loseLifeSound.play();
            loseLife();
            return;
        }
    }

    snake.unshift(newHead);

    for (let i = 0; i < enemies.length; i++) {
        enemies[i] = moveEnemy(enemies[i]);
        let enemyHead = enemies[i][0];
        if (enemyHead.x === food.x && enemyHead.y === food.y) {
            enemies[i].unshift({ x: enemyHead.x, y: enemyHead.y });
            food = {
                x: Math.floor(Math.random() * (canvasSize / box)) * box,
                y: Math.floor(Math.random() * (canvasSize / box)) * box,
            };
        } else {
            enemies[i].pop();
        }

        if (collision(enemyHead, enemies[i])) {
            enemies.splice(i, 1);
            i--;
        }
    }
}

function levelUp() {
    level++;
    foodCount = 0;
    gameSpeed -= 10;
    clearInterval(game);
    game = setInterval(draw, gameSpeed);
    levelUpSound.play();
    updateInfo();
    for (let i = 0; i < level - 1; i++) {
        enemies.push(createEnemy());
    }
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) {
            return true;
        }
    }
    return false;
}

function getRandomColor() {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function loseLife() {
    lives--;
    updateInfo();
    if (lives <= 0) {
        clearInterval(game);
        showGameOverScreen();
    } else {
        resetGame(false);
    }
}

function resetGame(newGame = true) {
    if (newGame) {
        snake = [{ x: 9 * box, y: 9 * box }];
        direction = 'RIGHT';
    }
    food = {
        x: Math.floor(Math.random() * (canvasSize / box)) * box,
        y: Math.floor(Math.random() * (canvasSize / box)) * box,
    };
    foodCount = 0;
    clearInterval(game);
    game = setInterval(draw, gameSpeed);
    updateInfo();
}

function startGame() {
    let difficultySelect = document.getElementById('difficulty');
    difficulty = difficultySelect.options[difficultySelect.selectedIndex].value;
    switch (difficulty) {
        case 'veryEasy':
            lives = 9;
            break;
        case 'easy':
            lives = 6;
            break;
        case 'normal':
            lives = 3;
            break;
        case 'hard':
            lives = 1;
            break;
    }
    level = 1;
    score = 0;
    enemies = [];
    gameSpeed = 150;
    resetGame(true);
    document.getElementById('splashScreen').style.display = 'none';
}

function showGameOverScreen() {
    document.getElementById('finalScore').innerText = score;
    document.getElementById('splashScreen').style.display = 'flex';
}

function saveScore() {
    const name = document.getElementById('nameInput').value;
    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    document.getElementById('rank').innerText = highScores.findIndex(scoreEntry => scoreEntry.name === name && scoreEntry.score === score) + 1;
    restartGame();
}

function restartGame() {
    lives = 3;
    level = 1;
    score = 0;
    snake = [{ x: 9 * box, y: 9 * box }];
    enemies = [];
    direction = 'RIGHT';
    resetGame(true);
}

function updateInfo() {
    document.getElementById('level').innerText = level;
    document.getElementById('score').innerText = score;
    document.getElementById('lives').innerText = lives;
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseButton').innerText = isPaused ? 'Resume' : 'Pause';
}

document.addEventListener('DOMContentLoaded', () => {
    snake = [{ x: 9 * box, y: 9 * box }];
    enemies = [];
    direction = 'RIGHT';
    food = {
        x: Math.floor(Math.random() * (canvasSize / box)) * box,
        y: Math.floor(Math.random() * (canvasSize / box)) * box,
    };
    level = 1;
    foodCount = 0;
    gameSpeed = 150;
});
