// static/js/game.js
// 移动设备检测
function detectMobileDevice() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobile && hasTouch;
}

const isRealMobileDevice = detectMobileDevice();
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// 游戏变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const score1Element = document.getElementById('score1');
const score2Element = document.getElementById('score2');
const highScoreElement = document.getElementById('highScore');
const finalScore1Element = document.getElementById('finalScore1');
const finalScore2Element = document.getElementById('finalScore2');
const winnerTextElement = document.getElementById('winnerText');
const gameOverScreen = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const modeButton = document.getElementById('modeButton');
const soundButton = document.getElementById('soundButton');
const restartButton = document.getElementById('restartButton');
const modeSingleRadio = document.getElementById('modeSingle');
const modeDualRadio = document.getElementById('modeDual');
const wallTurnRadio = document.getElementById('wallTurn');
const wallDieRadio = document.getElementById('wallDie');

const dpad1 = document.getElementById('dpad1');
const dpad2 = document.getElementById('dpad2');
const pauseMobileBtn = document.getElementById('pauseMobileBtn');
const restartMobileBtn = document.getElementById('restartMobileBtn');

// 游戏常量
const gridSize = 20;
const gridWidth = canvas.width / gridSize;
const gridHeight = canvas.height / gridSize;

// 游戏状态
let snake1 = [];
let snake2 = [];
let food = [];
let direction1 = 'right';
let nextDirection1 = 'right';
let direction2 = 'right';
let nextDirection2 = 'right';
let score1 = 0;
let score2 = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameSpeed = 130;
let gameRunning = false;
let gameLoop = null;
let soundEnabled = true;
let dualMode = false;
let wallCollisionMode = 'turn';

// 食物生成相关变量
let foodGenerationInterval = null;
const FOOD_GENERATION_TIME = 3000; // 3秒
const FOOD_GENERATION_COUNT = 2;   // 每次生成2个

// 检测是否应该显示虚拟摇杆
function shouldShowVirtualJoystick() {
    // 在移动设备上总是显示
    if (isRealMobileDevice) return true;
    
    // 在电脑上，当窗口宽度小于一定值时显示（模拟半个屏幕的情况）
    const isHalfScreen = window.innerWidth < 1000;
    
    return isHalfScreen;
}

// 初始化移动控制
function initMobileControls() {
    setupDpad(dpad1, 1);
    if (dualMode) {
        setupDpad(dpad2, 2);
    }
    
    // 移除旧的事件监听器
    pauseMobileBtn.removeEventListener('touchstart', handlePauseMobile);
    restartMobileBtn.removeEventListener('touchstart', handleRestartMobile);
    
    // 添加新的事件监听器
    pauseMobileBtn.addEventListener('touchstart', handlePauseMobile);
    restartMobileBtn.addEventListener('touchstart', handleRestartMobile);
    
    // 确保控制元素显示
    const joystickContainer = document.querySelector('.joystick-container');
    const mobileControls = document.querySelector('.mobile-controls');
    if (joystickContainer) joystickContainer.style.display = 'flex';
    if (mobileControls) mobileControls.style.display = 'flex';
}

// 移动端暂停按钮处理
function handlePauseMobile(e) {
    e.preventDefault();
    togglePause();
}

// 移动端重置按钮处理
function handleRestartMobile(e) {
    e.preventDefault();
    resetGame();
}

// 设置十字键控制
function setupDpad(dpad, player) {
    const directions = dpad.querySelectorAll('[data-direction]');
    
    directions.forEach(button => {
        const direction = button.getAttribute('data-direction');
        
        // 移除旧的事件监听器
        button.removeEventListener('touchstart', handleDpadTouch);
        button.removeEventListener('touchend', handleDpadEnd);
        button.removeEventListener('mousedown', handleDpadMouse);
        button.removeEventListener('mouseup', handleDpadEnd);
        
        // 添加新的事件监听器
        button.addEventListener('touchstart', handleDpadTouch);
        button.addEventListener('touchend', handleDpadEnd);
        button.addEventListener('mousedown', handleDpadMouse);
        button.addEventListener('mouseup', handleDpadEnd);
        
        function handleDpadTouch(e) {
            e.preventDefault();
            handleDpadInput(direction, player);
        }
        
        function handleDpadEnd(e) {
            e.preventDefault();
        }
        
        function handleDpadMouse(e) {
            e.preventDefault();
            handleDpadInput(direction, player);
        }
    });
}

function handleDpadInput(direction, player) {
    if (player === 1) {
        switch(direction) {
            case 'up': if (direction1 !== 'down') nextDirection1 = 'up'; break;
            case 'down': if (direction1 !== 'up') nextDirection1 = 'down'; break;
            case 'left': if (direction1 !== 'right') nextDirection1 = 'left'; break;
            case 'right': if (direction1 !== 'left') nextDirection1 = 'right'; break;
        }
    } else if (player === 2 && dualMode) {
        switch(direction) {
            case 'up': if (direction2 !== 'down') nextDirection2 = 'up'; break;
            case 'down': if (direction2 !== 'up') nextDirection2 = 'down'; break;
            case 'left': if (direction2 !== 'right') nextDirection2 = 'left'; break;
            case 'right': if (direction2 !== 'left') nextDirection2 = 'right'; break;
        }
    }
}

// 开始食物生成定时器
function startFoodGeneration() {
    // 清除现有的定时器
    if (foodGenerationInterval) {
        clearInterval(foodGenerationInterval);
    }
    
    // 每3秒生成2个食物
    foodGenerationInterval = setInterval(() => {
        if (gameRunning) {
            generateFood(FOOD_GENERATION_COUNT);
        }
    }, FOOD_GENERATION_TIME);
}

// 生成食物
function generateFood(count = 1) {
    // 如果食物数量为0，立即生成指定数量的食物
    if (food.length === 0) {
        for (let i = 0; i < count; i++) {
            generateSingleFood();
        }
        return;
    }
    
    // 否则按正常逻辑生成
    for (let i = 0; i < count; i++) {
        // 有80%的几率生成食物，或者食物数量少于5个时强制生成
        if (Math.random() < 0.8 || food.length < 5) {
            generateSingleFood();
        }
    }
}

// 生成单个食物
function generateSingleFood() {
    let newFood;
    let overlapping;
    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环
    
    do {
        newFood = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight),
            type: Math.random() < 0.2 ? 'special' : 'normal' // 20%几率生成特殊食物
        };
        
        overlapping = false;
        attempts++;
        
        // 检查是否与蛇身重叠
        for (let i = 0; i < snake1.length; i++) {
            if (snake1[i].x === newFood.x && snake1[i].y === newFood.y) {
                overlapping = true;
                break;
            }
        }
        
        if (!overlapping && dualMode) {
            for (let i = 0; i < snake2.length; i++) {
                if (snake2[i].x === newFood.x && snake2[i].y === newFood.y) {
                    overlapping = true;
                    break;
                }
            }
        }
        
        // 检查是否与其他食物重叠
        if (!overlapping) {
            for (let i = 0; i < food.length; i++) {
                if (food[i].x === newFood.x && food[i].y === newFood.y) {
                    overlapping = true;
                    break;
                }
            }
        }
        
    } while (overlapping && attempts < maxAttempts);
    
    if (!overlapping) {
        food.push(newFood);
    }
}

// 初始化游戏
function initGame() {
    snake1 = [
        {x: 5, y: 10},
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];
    
    snake2 = [
        {x: 15, y: 10},
        {x: 16, y: 10},
        {x: 17, y: 10}
    ];
    
    // 初始化食物数组
    food = [];
    
    // 立即生成初始食物
    generateFood(FOOD_GENERATION_COUNT);
    
    score1 = 0;
    score2 = 0;
    direction1 = 'right';
    nextDirection1 = 'right';
    direction2 = 'left';
    nextDirection2 = 'left';
    
    score1Element.textContent = score1;
    score2Element.textContent = score2;
    highScoreElement.textContent = highScore;
    
    gameOverScreen.classList.remove('active');
    
    updateUIBasedOnMode();
    
    // 修改这里：不再仅检测移动设备，而是根据屏幕大小决定是否显示控制
    if (shouldShowVirtualJoystick()) {
        initMobileControls();
    } else {
        // 隐藏控制元素
        const joystickContainer = document.querySelector('.joystick-container');
        const mobileControls = document.querySelector('.mobile-controls');
        if (joystickContainer) joystickContainer.style.display = 'none';
        if (mobileControls) mobileControls.style.display = 'none';
    }
    
    // 启动食物生成定时器
    startFoodGeneration();
}

// 根据模式更新UI显示
function updateUIBasedOnMode() {
    if (dualMode) {
        score2Element.parentElement.style.display = 'block';
        document.querySelectorAll('.player-control')[1].style.display = 'block';
        modeButton.textContent = '模式: 双人';
        modeDualRadio.checked = true;
        
        if (isRealMobileDevice && dpad2) {
            dpad2.style.display = 'flex';
        }
    } else {
        score2Element.parentElement.style.display = 'none';
        document.querySelectorAll('.player-control')[1].style.display = 'none';
        modeButton.textContent = '模式: 单人';
        modeSingleRadio.checked = true;
        
        if (isRealMobileDevice && dpad2) {
            dpad2.style.display = 'none';
        }
    }
}

// 处理墙壁碰撞 - 自动转弯
function handleWallCollision(head, direction) {
    let newHead = {...head};
    let newDirection = direction;
    
    // 检查是否碰到墙壁
    if (head.x < 0) {
        newHead.x = gridWidth - 1; // 从右边出现
    } else if (head.x >= gridWidth) {
        newHead.x = 0; // 从左边出现
    } else if (head.y < 0) {
        newHead.y = gridHeight - 1; // 从底部出现
    } else if (head.y >= gridHeight) {
        newHead.y = 0; // 从顶部出现
    }
    
    return {newHead, newDirection};
}

// 游戏主循环
function runGame() {
    if (!gameRunning) return;
    
    direction1 = nextDirection1;
    if (dualMode) direction2 = nextDirection2;
    
    // 移动蛇头
    const head1 = {x: snake1[0].x, y: snake1[0].y};
    
    switch(direction1) {
        case 'up': head1.y--; break;
        case 'down': head1.y++; break;
        case 'left': head1.x--; break;
        case 'right': head1.x++; break;
    }
    
    let head2;
    if (dualMode) {
        head2 = {x: snake2[0].x, y: snake2[0].y};
        
        switch(direction2) {
            case 'up': head2.y--; break;
            case 'down': head2.y++; break;
            case 'left': head2.x--; break;
            case 'right': head2.x++; break;
        }
    }
    
    // 处理墙壁碰撞
    let finalHead1 = head1;
    if (wallCollisionMode === 'turn') {
        const result1 = handleWallCollision(head1, direction1);
        finalHead1 = result1.newHead;
    }
    
    let finalHead2;
    if (dualMode) {
        finalHead2 = head2;
        if (wallCollisionMode === 'turn') {
            const result2 = handleWallCollision(head2, direction2);
            finalHead2 = result2.newHead;
        }
    }
    
    // 检查碰撞（不包括墙壁碰撞，如果开启了转弯模式）
    const collision1 = checkCollision(finalHead1, snake1, dualMode ? snake2 : []);
    const collision2 = dualMode ? checkCollision(finalHead2, snake2, snake1) : false;
    
    if (collision1 || (dualMode && collision2)) {
        gameOver(collision1, collision2);
        return;
    }
    
    // 添加新的蛇头
    snake1.unshift(finalHead1);
    if (dualMode) snake2.unshift(finalHead2);
    
    // 检查是否吃到食物（玩家1）
    let ateFood1 = false;
    for (let i = food.length - 1; i >= 0; i--) {
        if (finalHead1.x === food[i].x && finalHead1.y === food[i].y) {
            // 增加分数
            score1 += food[i].type === 'special' ? 20 : 10;
            score1Element.textContent = score1;
            
            // 播放吃食物音效
            if (soundEnabled) playEatSound();
            
            // 创建粒子效果
            createParticles(finalHead1.x * gridSize, finalHead1.y * gridSize, 1);
            
            // 移除被吃的食物
            food.splice(i, 1);
            ateFood1 = true;
            
            // 立即生成新的食物来补充
            if (food.length < 3) {
                generateFood(1);
            }
            break;
        }
    }
    
    // 检查是否吃到食物（玩家2）
    let ateFood2 = false;
    if (dualMode) {
        for (let i = food.length - 1; i >= 0; i--) {
            if (finalHead2.x === food[i].x && finalHead2.y === food[i].y) {
                // 增加分数
                score2 += food[i].type === 'special' ? 20 : 10;
                score2Element.textContent = score2;
                
                // 播放吃食物音效
                if (soundEnabled) playEatSound();
                
                // 创建粒子效果
                createParticles(finalHead2.x * gridSize, finalHead2.y * gridSize, 2);
                
                // 移除被吃的食物
                food.splice(i, 1);
                ateFood2 = true;
                
                // 立即生成新的食物来补充
                if (food.length < 3) {
                    generateFood(1);
                }
                break;
            }
        }
    }
    
    // 如果没吃到食物，移除蛇尾
    if (!ateFood1) {
        snake1.pop();
    }
    if (dualMode && !ateFood2) {
        snake2.pop();
    }
    
    // 确保地图上始终有食物
    if (food.length === 0) {
        generateFood(FOOD_GENERATION_COUNT);
    }
    
    // 绘制游戏
    draw();
}

// 检查碰撞（不包括墙壁）
function checkCollision(head, ownSnake, otherSnake) {
    // 如果开启了碰墙死亡模式，检查墙壁碰撞
    if (wallCollisionMode === 'die') {
        if (
            head.x < 0 || 
            head.y < 0 || 
            head.x >= gridWidth || 
            head.y >= gridHeight
        ) {
            return true;
        }
    }
    
    // 检查自身碰撞
    for (let i = 1; i < ownSnake.length; i++) {
        if (head.x === ownSnake[i].x && head.y === ownSnake[i].y) {
            return true;
        }
    }
    
    // 检查与其他蛇的碰撞
    for (let i = 0; i < otherSnake.length; i++) {
        if (head.x === otherSnake[i].x && head.y === otherSnake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#0d1721';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    ctx.strokeStyle = '#1a2a37';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // 绘制蛇1
    snake1.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = '#4ecdc4';
        } else {
            const colorPos = index / snake1.length;
            const r = Math.floor(78 - (78 * colorPos));
            const g = Math.floor(205 - (105 * colorPos));
            const b = Math.floor(196 - (96 * colorPos));
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        }
        
        roundRect(ctx, segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1, 4);
    });
    
    // 绘制蛇2（双人模式）
    if (dualMode) {
        snake2.forEach((segment, index) => {
            if (index === 0) {
                ctx.fillStyle = '#ff6b6b';
            } else {
                const colorPos = index / snake2.length;
                const r = Math.floor(255 - (55 * colorPos));
                const g = Math.floor(107 - (57 * colorPos));
                const b = Math.floor(107 - (57 * colorPos));
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            }
            
            roundRect(ctx, segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1, 4);
        });
    }
    
    // 绘制所有食物
    food.forEach(foodItem => {
        if (foodItem.type === 'special') {
            // 特殊食物 - 金色
            ctx.fillStyle = '#ffd700';
        } else {
            // 普通食物 - 橙色
            ctx.fillStyle = '#ff7b25';
        }
        
        roundRect(ctx, foodItem.x * gridSize, foodItem.y * gridSize, gridSize - 1, gridSize - 1, 8);
        
        // 食物光泽效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(
            foodItem.x * gridSize + gridSize/4, 
            foodItem.y * gridSize + gridSize/4, 
            gridSize/5, 
            gridSize/5, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
    });
}

// 绘制圆角矩形
function roundRect(ctx, x, y, width, height, radius) {
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
    ctx.fill();
}

// 游戏结束
function gameOver(collision1, collision2) {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // 清除食物生成定时器
    if (foodGenerationInterval) {
        clearInterval(foodGenerationInterval);
        foodGenerationInterval = null;
    }
    
    const maxScore = Math.max(score1, score2);
    if (maxScore > highScore) {
        highScore = maxScore;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    finalScore1Element.textContent = score1;
    finalScore2Element.textContent = score2;
    
    if (dualMode) {
        if (collision1 && collision2) {
            winnerTextElement.textContent = "平局！双方都撞到了";
        } else if (collision1) {
            winnerTextElement.textContent = "玩家2获胜！";
        } else {
            winnerTextElement.textContent = "玩家1获胜！";
        }
    } else {
        winnerTextElement.textContent = "";
    }
    
    gameOverScreen.classList.add('active');
    
    if (soundEnabled) playGameOverSound();
}

// 创建粒子效果
function createParticles(x, y, player) {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = player === 1 ? 'snake-particle' : 'snake-particle particle-player2';
        
        const posX = x + Math.random() * gridSize;
        const posY = y + Math.random() * gridSize;
        
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        
        const colors = player === 1 
            ? ['#4ecdc4', '#45b7d1', '#6fc2ce', '#3aa9b9'] 
            : ['#ff6b6b', '#ff8e8e', '#f96969', '#ff5252'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        document.querySelector('.game-board').appendChild(particle);
        
        const animX = (Math.random() - 0.5) * 100;
        const animY = (Math.random() - 0.5) * 100;
        
        particle.animate([
            { transform: `translate(0, 0) scale(1)`, opacity: 1 },
            { transform: `translate(${animX}px, ${animY}px) scale(0.2)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 400, easing: 'ease-out' });
        
        setTimeout(() => particle.remove(), 1200);
    }
}

// 音效函数
function playEatSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = 523.25;
    gainNode.gain.value = 0.2;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.2);
    
    setTimeout(() => oscillator.stop(), 200);
}

function playGameOverSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 220;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.frequency.exponentialRampToValueAtTime(110, context.currentTime + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
    
    setTimeout(() => oscillator.stop(), 500);
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
    }
    
    switch(e.key) {
        case 'ArrowUp': if (direction1 !== 'down') nextDirection1 = 'up'; break;
        case 'ArrowDown': if (direction1 !== 'up') nextDirection1 = 'down'; break;
        case 'ArrowLeft': if (direction1 !== 'right') nextDirection1 = 'left'; break;
        case 'ArrowRight': if (direction1 !== 'left') nextDirection1 = 'right'; break;
    }
    
    if (dualMode) {
        switch(e.key) {
            case 'w': case 'W': if (direction2 !== 'down') nextDirection2 = 'up'; break;
            case 's': case 'S': if (direction2 !== 'up') nextDirection2 = 'down'; break;
            case 'a': case 'A': if (direction2 !== 'right') nextDirection2 = 'left'; break;
            case 'd': case 'D': if (direction2 !== 'left') nextDirection2 = 'right'; break;
        }
    }
    
    if (e.key === ' ') togglePause();
});

// 开始游戏
function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    startButton.textContent = '重新开始';
    
    const speedValue = document.querySelector('input[name="speed"]:checked').value;
    switch(speedValue) {
        case 'slow': gameSpeed = 180; break;
        case 'medium': gameSpeed = 130; break;
        case 'fast': gameSpeed = 80; break;
    }
    
    dualMode = document.querySelector('input[name="mode"]:checked').value === 'dual';
    wallCollisionMode = document.querySelector('input[name="wall"]:checked').value;
    
    updateUIBasedOnMode();
    
    clearInterval(gameLoop);
    gameLoop = setInterval(runGame, gameSpeed);
    
    // 确保食物生成定时器运行
    startFoodGeneration();
}

// 暂停游戏
function togglePause() {
    if (!gameRunning && snake1.length > 0) {
        // 继续游戏
        gameRunning = true;
        pauseButton.textContent = '暂停';
        gameLoop = setInterval(runGame, gameSpeed);
        
        // 重新开始食物生成
        startFoodGeneration();
    } else if (gameRunning) {
        // 暂停游戏
        gameRunning = false;
        pauseButton.textContent = '继续';
        clearInterval(gameLoop);
        
        // 暂停食物生成
        if (foodGenerationInterval) {
            clearInterval(foodGenerationInterval);
            foodGenerationInterval = null;
        }
    }
}

// 重置游戏
function resetGame() {
    clearInterval(gameLoop);
    
    // 清除食物生成定时器
    if (foodGenerationInterval) {
        clearInterval(foodGenerationInterval);
        foodGenerationInterval = null;
    }
    
    initGame();
    gameRunning = false;
    startButton.textContent = '开始游戏';
    pauseButton.textContent = '暂停';
    
    // 重新初始化移动控制
    if (shouldShowVirtualJoystick()) {
        initMobileControls();
    }
}

// 切换游戏模式
function toggleMode() {
    dualMode = !dualMode;
    updateUIBasedOnMode();
    
    // 更新移动控制
    if (shouldShowVirtualJoystick()) {
        initMobileControls();
    }
}

// 切换音效
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundButton.textContent = soundEnabled ? '音效: 开' : '音效: 关';
}

// 横屏检测
function checkOrientation() {
    const rotateMessage = document.getElementById('rotate-message');
    if (!rotateMessage) return;
    
    if (isRealMobileDevice) {
        if (window.innerHeight > window.innerWidth) {
            rotateMessage.style.display = 'flex';
            if (gameRunning) {
                gameRunning = false;
                if (gameLoop) clearInterval(gameLoop);
                pauseButton.textContent = '继续';
                
                // 暂停食物生成
                if (foodGenerationInterval) {
                    clearInterval(foodGenerationInterval);
                    foodGenerationInterval = null;
                }
            }
        } else {
            rotateMessage.style.display = 'none';
        }
    } else {
        rotateMessage.style.display = 'none';
    }
}

// 全屏功能
const fullscreenBtn = document.createElement('button');
fullscreenBtn.textContent = '全屏';
fullscreenBtn.style.position = 'fixed';
fullscreenBtn.style.top = '10px';
fullscreenBtn.style.right = '10px';
fullscreenBtn.style.zIndex = '100';
fullscreenBtn.style.padding = '10px 15px';
fullscreenBtn.style.background = 'linear-gradient(45deg, #4568dc, #b06ab3)';
fullscreenBtn.style.color = 'white';
fullscreenBtn.style.border = 'none';
fullscreenBtn.style.borderRadius = '25px';
fullscreenBtn.style.fontSize = '16px';
fullscreenBtn.style.fontWeight = 'bold';
fullscreenBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
fullscreenBtn.style.cursor = 'pointer';
document.body.appendChild(fullscreenBtn);

function toggleFullscreen() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        alert('由于技术还没那么厉害，所以iOS暂时没有的全屏--俊毅');
        return;
    }
    
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => console.log('全屏错误:', err));
        } else {
            document.exitFullscreen();
        }
    } else if (elem.webkitRequestFullscreen) {
        if (!document.webkitFullscreenElement) {
            elem.webkitRequestFullscreen();
        } else {
            document.webkitExitFullscreen();
        }
    }
}

function updateFullscreenButton() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        fullscreenBtn.textContent = '退出全屏';
    } else {
        fullscreenBtn.textContent = '全屏';
    }
}

fullscreenBtn.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);

// 绑定按钮事件
startButton.addEventListener('click', () => gameRunning ? resetGame() : startGame());
pauseButton.addEventListener('click', togglePause);
resetButton.addEventListener('click', resetGame);
modeButton.addEventListener('click', toggleMode);
soundButton.addEventListener('click', toggleSound);
restartButton.addEventListener('click', resetGame);

modeSingleRadio.addEventListener('change', () => { dualMode = false; updateUIBasedOnMode(); });
modeDualRadio.addEventListener('change', () => { dualMode = true; updateUIBasedOnMode(); });

// 窗口大小改变监听器
window.addEventListener('resize', function() {
    if (shouldShowVirtualJoystick()) {
        initMobileControls();
    } else {
        // 隐藏控制元素
        const joystickContainer = document.querySelector('.joystick-container');
        const mobileControls = document.querySelector('.mobile-controls');
        if (joystickContainer) joystickContainer.style.display = 'none';
        if (mobileControls) mobileControls.style.display = 'none';
    }
});

// 横屏检测
if (isRealMobileDevice) {
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    setTimeout(checkOrientation, 100);
}

// 初始化游戏
initGame();
draw();