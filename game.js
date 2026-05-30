// 游戏配置
const config = {
    maxChargeTime: 500,  // 最大蓄力时间（毫秒）- 缩短蓄力时间
    minChargeTime: 150,  // 最小蓄力时间
    dashSpeed: 0.08,     // 冲刺速度（从0.12降低到0.08，降低约33%）
    playerRadius: 25,    // 玩家半径
    chargeRingWidth: 4,  // 蓄力圈宽度
    trailLength: 15,     // 剑光拖尾长度
    bgParticleSpacing: 80, // 背景粒子间距
    bgParticleForce: 150,  // 剑气推力范围
    walkAcceleration: 0.25, // 行走加速度（从0.15增加到0.25）
    walkMaxSpeed: 3.0,   // 最大行走速度（从1.8增加到3.0）
    walkFriction: 0.88,  // 摩擦力（惯性）
    walkPushForce: 30,   // 行走推开粒子的力度范围
    bulletSpeed: 8,      // 子弹速度（从12降低到8，降低约33%）
    bulletRadius: 5,     // 子弹半径（宽度）
    bulletLength: 16,    // 子弹长度
    bulletPushForce: 60, // 子弹推开粒子的范围
    maxBullets: 3,       // 最大子弹数
    shootAnimDuration: 200, // 射击动画持续时间（毫秒）
    shootCooldown: 600,  // 射击冷却时间（毫秒）
    aimTime: 400,        // 瞄准锁定时间（毫秒）
    maxDashDistance: 700, // 最大冲刺距离（从500增加到700）
    // AI配置
    aiThinkInterval: 100, // AI决策间隔（毫秒，从200缩短到100，反应更快）
    aiDashRange: 400,    // AI冲刺攻击范围
    aiShootRange: 500,   // AI射击范围
    aiSafeDistance: 150, // AI安全距离
    aiAggressiveness: 0.7 // AI攻击性（0-1）
};

// 画布设置
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 玩家对象
const player = {
    x: canvas.width / 2 - 150,
    y: canvas.height / 2,
    vx: 0, // 速度X
    vy: 0, // 速度Y
    radius: config.playerRadius,
    charging: false,
    chargeStartTime: 0,
    chargeProgress: 0,
    targetX: 0,
    targetY: 0,
    dashing: false,
    dashStartX: 0,
    dashStartY: 0,
    dashEndX: 0,
    dashEndY: 0,
    dashProgress: 0,
    collisionBodies: [], // 碰撞体积数组
    trail: [], // 剑光拖尾
    bullets: 3, // 当前子弹数
    shooting: false, // 是否正在射击
    shootStartTime: 0, // 射击开始时间
    aimAngle: 0, // 瞄准角度
    lastShootTime: 0, // 上次射击时间
    aiming: false, // 是否正在瞄准
    aimStartTime: 0, // 瞄准开始时间
    aimProgress: 0, // 瞄准进度
    aimTargetX: 0, // 瞄准目标X
    aimTargetY: 0, // 瞄准目标Y
    dying: false, // 是否正在死亡
    deathPhase: null, // 死亡阶段
    dissolveStartTime: 0, // 消散开始时间
    dissolveProgress: 0 // 消散进度
};

// 游戏状态
let gameOver = false;
let gameStarted = false;
let gameInitialized = false; // 游戏是否已初始化
let countdownStartTime = 0;
let countdownValue = 3; // 3, 2, 1

// 慢动作效果
let slowMotionActive = false;
let slowMotionStartTime = 0;
let slowMotionDuration = 500; // 慢动作持续时间（毫秒，从300增加到500）
let slowMotionFactor = 0.2; // 慢动作速度因子（0.2 = 20%速度，即5倍慢）

// 波次系统
let currentWave = 1; // 当前波次
let enemiesKilledThisWave = 0; // 本波已击杀敌人数
let totalScore = 0; // 总积分
let scorePerKill = 100; // 每次击杀得分

// 粒子系统
const particles = [];

// 子弹系统
const bullets = [];

// 敌人系统
const enemies = [];

// 背景水墨粒子系统
const bgParticles = [];
const bgParticleCount = 1000;

// 初始化背景粒子 - 随机分布
function initBgParticles() {
    bgParticles.length = 0;
    
    for (let i = 0; i < bgParticleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        bgParticles.push({
            x: x,
            y: y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
            size: Math.random() * 6 + 1,
            opacity: Math.random() * 0.08 + 0.01,
            floatSpeed: Math.random() * 0.3 + 0.1,
            floatOffsetX: Math.random() * Math.PI * 2,
            floatOffsetY: Math.random() * Math.PI * 2
        });
    }
}

// 鼠标状态
let mouseDown = false;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// 追踪鼠标位置
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (mouseDown && player.charging) {
        // 限制冲刺距离
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > config.maxDashDistance) {
            // 限制在最大距离内
            const angle = Math.atan2(dy, dx);
            player.targetX = player.x + Math.cos(angle) * config.maxDashDistance;
            player.targetY = player.y + Math.sin(angle) * config.maxDashDistance;
        } else {
            player.targetX = mouseX;
            player.targetY = mouseY;
        }
    }
    
    if (player.aiming) {
        player.aimTargetX = mouseX;
        player.aimTargetY = mouseY;
    }
});

// 键盘状态
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// 键盘事件监听
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // 空格键重启游戏
    if (e.code === 'Space' && gameOver) {
        e.preventDefault();
        restartGame();
        return;
    }
    
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keys[key] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keys[key] = false;
        e.preventDefault();
    }
});

// 事件监听
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // 左键
        // 倒计时期间也可以开始蓄力
        if (player.dashing || player.dying || gameOver) return;
        
        mouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
        player.charging = true;
        player.chargeStartTime = Date.now();
        
        // 限制冲刺距离
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > config.maxDashDistance) {
            const angle = Math.atan2(dy, dx);
            player.targetX = player.x + Math.cos(angle) * config.maxDashDistance;
            player.targetY = player.y + Math.sin(angle) * config.maxDashDistance;
        } else {
            player.targetX = mouseX;
            player.targetY = mouseY;
        }
    }
});



canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // 左键
        // 松开左键取消蓄力（如果还没完成）
        mouseDown = false;
        if (player.charging && player.chargeProgress < 1) {
            player.charging = false;
            player.chargeProgress = 0;
        }
    }
});

// 右键瞄准
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // 右键
        e.preventDefault();
        const now = Date.now();
        // 倒计时期间也可以开始瞄准，但需要检查CD
        if (!player.dying && !gameOver && !player.dashing && 
            now - player.lastShootTime >= config.shootCooldown) {
            player.aiming = true;
            player.aimStartTime = now;
            player.aimProgress = 0;
            player.aimTargetX = e.clientX;
            player.aimTargetY = e.clientY;
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 2) { // 右键
        e.preventDefault();
        // 松开右键取消瞄准（如果还没完成）
        if (player.aiming && player.aimProgress < 1) {
            player.aiming = false;
            player.aimProgress = 0;
        }
    }
});

// 触摸事件支持
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    // 倒计时期间也可以开始蓄力
    if (player.dashing || player.dying || gameOver) return;
    
    const touch = e.touches[0];
    mouseDown = true;
    mouseX = touch.clientX;
    mouseY = touch.clientY;
    player.charging = true;
    player.chargeStartTime = Date.now();
    
    // 限制冲刺距离
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance > config.maxDashDistance) {
        const angle = Math.atan2(dy, dx);
        player.targetX = player.x + Math.cos(angle) * config.maxDashDistance;
        player.targetY = player.y + Math.sin(angle) * config.maxDashDistance;
    } else {
        player.targetX = mouseX;
        player.targetY = mouseY;
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (mouseDown && player.charging) {
        const touch = e.touches[0];
        mouseX = touch.clientX;
        mouseY = touch.clientY;
        
        // 限制冲刺距离
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > config.maxDashDistance) {
            const angle = Math.atan2(dy, dx);
            player.targetX = player.x + Math.cos(angle) * config.maxDashDistance;
            player.targetY = player.y + Math.sin(angle) * config.maxDashDistance;
        } else {
            player.targetX = mouseX;
            player.targetY = mouseY;
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    // 松开触摸取消蓄力（如果还没完成）
    mouseDown = false;
    if (player.charging && player.chargeProgress < 1) {
        player.charging = false;
        player.chargeProgress = 0;
    }
});

// 开始冲刺
function startDash() {
    player.dashing = true;
    player.dashStartX = player.x;
    player.dashStartY = player.y;
    player.dashEndX = player.targetX;
    player.dashEndY = player.targetY;
    player.dashProgress = 0;
    player.collisionBodies = [];
    player.trail = [];
    
    // 清除所有敌人的击中标记
    enemies.forEach(enemy => {
        enemy.hitByCurrentDash = false;
    });
    
    // 生成冲刺起始粒子
    createDashParticles(player.x, player.y, 20);
}

// 射击
function shoot(targetX, targetY) {
    const now = Date.now();
    
    // 检查冷却时间
    if (now - player.lastShootTime < config.shootCooldown) return;
    if (player.bullets <= 0 || player.dashing) return;
    
    player.bullets--;
    player.shooting = true;
    player.shootStartTime = now;
    player.lastShootTime = now;
    
    // 计算射击方向（使用瞄准角度）
    const angle = player.aimAngle;
    
    // 创建子弹
    bullets.push({
        x: player.x + Math.cos(angle) * player.radius,
        y: player.y + Math.sin(angle) * player.radius,
        vx: Math.cos(angle) * config.bulletSpeed,
        vy: Math.sin(angle) * config.bulletSpeed,
        angle: angle,
        life: 1
    });
    
    // 生成射击粒子
    createDashParticles(player.x, player.y, 10);
}

// 创建冲刺粒子
function createDashParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            size: Math.random() * 3 + 2,
            isBlood: false
        });
    }
}

// 创建击中冲击波粒子 - 强烈的爆发效果
function createImpactParticles(x, y, count, direction) {
    for (let i = 0; i < count; i++) {
        const angle = direction + (Math.random() - 0.5) * Math.PI;
        const speed = Math.random() * 8 + 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.025 + Math.random() * 0.025,
            size: Math.random() * 5 + 2.5, // 更小的冲击粒子
            isBlood: false,
            isImpact: true
        });
    }
}

// 创建剑光击中飞溅粒子 - 朝冲刺方向
function createSlashSplashParticles(x, y, count, direction) {
    for (let i = 0; i < count; i++) {
        // 在冲刺方向的扇形范围内飞溅（±60度）
        const angle = direction + (Math.random() - 0.5) * Math.PI / 1.5;
        const speed = Math.random() * 10 + 6; // 更快的速度
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.012 + Math.random() * 0.012, // 更慢消失
            size: Math.random() * 6 + 3, // 更大的粒子
            isBlood: false
        });
    }
}





// 创建血液消散粒子 - 融入背景永久保留
function createInkDissolveParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1; // 更快的初始速度
        const particleX = x + (Math.random() - 0.5) * 35;
        const particleY = y + (Math.random() - 0.5) * 35;
        
        // 添加到背景粒子系统，永久存在
        bgParticles.push({
            x: particleX,
            y: particleY,
            originX: particleX,
            originY: particleY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5, // 轻微向上飘散
            size: Math.random() * 3 + 1, // 更小的粒子
            opacity: Math.random() * 0.2 + 0.15, // 更高的不透明度
            floatSpeed: Math.random() * 0.2 + 0.05,
            floatOffsetX: Math.random() * Math.PI * 2,
            floatOffsetY: Math.random() * Math.PI * 2,
            isBloodStain: true, // 标记为血液污渍
            fadeInProgress: 0 // 淡入进度
        });
    }
}

// 更新游戏状态
function update() {
    // 更新慢动作状态
    updateSlowMotion();
    const timeScale = getTimeScale();
    
    // 更新玩家死亡动画
    if (player.dying && player.deathPhase === 'dissolve') {
        const dissolveElapsed = Date.now() - player.dissolveStartTime;
        player.dissolveProgress = Math.min(dissolveElapsed / 100, 1);
        
        if (player.dissolveProgress >= 1) {
            // 完全消散，游戏结束
            gameOver = true;
        }
    }
    
    // 如果游戏结束，不再更新游戏逻辑
    if (gameOver) return;
    
    // 倒计时逻辑
    if (!gameStarted) {
        const elapsed = Date.now() - countdownStartTime;
        const newCountdown = 3 - Math.floor(elapsed / 1000);
        
        if (newCountdown !== countdownValue) {
            countdownValue = newCountdown;
        }
        
        if (elapsed >= 3000) {
            gameStarted = true;
            // 倒计时结束，继续执行游戏逻辑
        }
        // 倒计时期间允许所有操作（移动、蓄力、瞄准），但不允许攻击
    }
    
    // WASD移动（不在冲刺时才能移动，且玩家未死亡）
    if (!player.dashing && !player.dying) {
        let moveX = 0;
        let moveY = 0;
        
        if (keys.w) moveY -= 1;
        if (keys.s) moveY += 1;
        if (keys.a) moveX -= 1;
        if (keys.d) moveX += 1;
        
        // 归一化对角线移动速度
        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            if (length > 0) {
                moveX /= length;
                moveY /= length;
            }
            
            // 加速度
            player.vx += moveX * config.walkAcceleration;
            player.vy += moveY * config.walkAcceleration;
        }
        
        // 应用摩擦力（惯性效果）
        player.vx *= config.walkFriction;
        player.vy *= config.walkFriction;
        
        // 限制最大速度
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (speed > config.walkMaxSpeed) {
            player.vx = (player.vx / speed) * config.walkMaxSpeed;
            player.vy = (player.vy / speed) * config.walkMaxSpeed;
        }
        
        // 应用速度
        player.x += player.vx;
        player.y += player.vy;
        
        // 边界限制
        if (player.x < player.radius) {
            player.x = player.radius;
            player.vx = 0;
        }
        if (player.x > canvas.width - player.radius) {
            player.x = canvas.width - player.radius;
            player.vx = 0;
        }
        if (player.y < player.radius) {
            player.y = player.radius;
            player.vy = 0;
        }
        if (player.y > canvas.height - player.radius) {
            player.y = canvas.height - player.radius;
            player.vy = 0;
        }
    }
    
    // 更新玩家蓄力（倒计时期间也可以蓄力）
    if (player.charging && !player.dying) {
        const distance = Math.hypot(player.targetX - player.x, player.targetY - player.y);
        
        // 使用S形曲线计算蓄力时间
        // 近距离快速增长，中距离平缓，远距离再次快速增长
        const normalizedDist = Math.min(distance / 500, 1); // 归一化到0-1
        const sigmoid = 1 / (1 + Math.exp(-10 * (normalizedDist - 0.5))); // S形曲线
        const chargeTime = config.minChargeTime + (config.maxChargeTime - config.minChargeTime) * sigmoid;
        
        const elapsed = Date.now() - player.chargeStartTime;
        player.chargeProgress = Math.min(elapsed / chargeTime, 1);
        
        // 蓄力完成后自动冲刺（只有游戏开始后才能释放）
        if (player.chargeProgress >= 1 && gameStarted) {
            startDash();
            player.charging = false;
            player.chargeProgress = 0;
        }
    }
    
    // 更新玩家瞄准（倒计时期间也可以瞄准）
    if (player.aiming && !player.dying) {
        const elapsed = Date.now() - player.aimStartTime;
        player.aimProgress = Math.min(elapsed / config.aimTime, 1);
        
        // 更新瞄准角度
        const dx = player.aimTargetX - player.x;
        const dy = player.aimTargetY - player.y;
        player.aimAngle = Math.atan2(dy, dx);
        
        // 瞄准完成后自动射击（只有游戏开始后才能释放）
        if (player.aimProgress >= 1 && gameStarted) {
            shoot(player.aimTargetX, player.aimTargetY);
            player.aiming = false;
            player.aimProgress = 0;
        }
    }
    
    if (player.dashing && !player.dying) {
        player.dashProgress += config.dashSpeed * timeScale;
        
        if (player.dashProgress >= 1) {
            player.dashProgress = 1;
            player.x = player.dashEndX;
            player.y = player.dashEndY;
            player.dashing = false;
            
            // 冲刺结束时生成粒子
            createDashParticles(player.x, player.y, 30);
        } else {
            // 使用更激进的缓动函数增强速度感
            const eased = easeInOutQuint(player.dashProgress);
            
            player.x = player.dashStartX + (player.dashEndX - player.dashStartX) * eased;
            player.y = player.dashStartY + (player.dashEndY - player.dashStartY) * eased;
            
            // 添加拖尾效果
            player.trail.push({
                x: player.x,
                y: player.y,
                alpha: 1
            });
            
            // 限制拖尾长度
            if (player.trail.length > config.trailLength) {
                player.trail.shift();
            }
            
            // 记录冲刺路径上的碰撞体积
            player.collisionBodies.push({
                x: player.x,
                y: player.y,
                radius: player.radius * 0.8
            });
            
            // 生成冲刺粒子
            if (Math.random() < 0.5) {
                createDashParticles(player.x, player.y, 2);
            }
        }
    }
    
    // 检测剑气轨迹与敌人碰撞（在冲刺时持续检测）
    if (player.dashing && !player.dying) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            // 跳过已经被标记为击中的敌人
            if (enemy.hitByCurrentDash) continue;
            
            // 计算敌人到当前已冲刺轨迹的距离
            // 使用点到线段的距离公式（从起点到当前位置）
            const lineStartX = player.dashStartX;
            const lineStartY = player.dashStartY;
            const lineEndX = player.x; // 使用当前位置而不是目标位置
            const lineEndY = player.y;
            
            // 线段向量
            const lineDx = lineEndX - lineStartX;
            const lineDy = lineEndY - lineStartY;
            const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
            
            if (lineLength === 0) continue;
            
            // 敌人到线段起点的向量
            const toDx = enemy.x - lineStartX;
            const toDy = enemy.y - lineStartY;
            
            // 投影到线段上的参数 t (0到1之间表示在线段上)
            let t = (toDx * lineDx + toDy * lineDy) / (lineLength * lineLength);
            t = Math.max(0, Math.min(1, t)); // 限制在线段范围内
            
            // 线段上最近的点
            const closestX = lineStartX + t * lineDx;
            const closestY = lineStartY + t * lineDy;
            
            // 敌人到最近点的距离
            const distX = enemy.x - closestX;
            const distY = enemy.y - closestY;
            const dist = Math.sqrt(distX * distX + distY * distY);
            
            // 判断是否碰撞（剑气宽度较窄，更锋锐）
            if (dist < enemy.radius + player.radius * 0.8 && !enemy.dying) {
                // 标记敌人已被当前冲刺击中
                enemy.hitByCurrentDash = true;
                
                // 计算冲刺方向
                const dashAngle = Math.atan2(player.dashEndY - player.dashStartY, player.dashEndX - player.dashStartX);
                
                // 敌人进入死亡状态，立刻开始消散
                enemy.dying = true;
                enemy.deathPhase = 'dissolve';
                enemy.dissolveStartTime = Date.now();
                
                // 触发慢动作效果
                triggerSlowMotion();
                
                // 记录击杀
                onEnemyKilled();
                
                // 创建大量黑色飞溅粒子，朝冲刺方向
                createSlashSplashParticles(enemy.x, enemy.y, 120, dashAngle);
                
                // 创建强烈的冲击波粒子
                createImpactParticles(enemy.x, enemy.y, 40, dashAngle);
                
                // 立刻生成大量血液消散粒子
                createInkDissolveParticles(enemy.x, enemy.y, 300);
            }
        }
    }
    
    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * timeScale;
        p.y += p.vy * timeScale;
        p.life -= p.decay * timeScale;
        p.vx *= 0.95;
        p.vy *= 0.95;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // 更新拖尾透明度
    player.trail.forEach((t, i) => {
        t.alpha = i / player.trail.length;
    });
    
    // 更新射击动画
    if (player.shooting) {
        const elapsed = Date.now() - player.shootStartTime;
        if (elapsed > config.shootAnimDuration) {
            player.shooting = false;
        }
    }
    
    // 更新子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * timeScale;
        b.y += b.vy * timeScale;
        
        // 检测子弹与玩家剑光的碰撞（反弹）
        if (player.dashing && b.isEnemyBullet) {
            if (checkBulletDashCollision(b, player)) {
                // 反弹子弹
                reflectBullet(b, player);
                b.isEnemyBullet = false; // 反弹后变成玩家的子弹
                b.owner = null;
                createDashParticles(b.x, b.y, 10); // 反弹特效
            }
        }
        
        // 检测子弹与敌人剑光的碰撞（反弹）
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (enemy.dashing && !b.isEnemyBullet) {
                if (checkBulletDashCollision(b, enemy)) {
                    // 反弹子弹
                    reflectBullet(b, enemy);
                    b.isEnemyBullet = true; // 反弹后变成敌人的子弹
                    b.owner = enemy;
                    createDashParticles(b.x, b.y, 10); // 反弹特效
                    break;
                }
            }
        }
        
        // 子弹推开粒子
        const bulletPushRadius = config.bulletPushForce;
        for (let j = 0; j < bgParticles.length; j++) {
            const p = bgParticles[j];
            const dx = p.x - b.x;
            const dy = p.y - b.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq < bulletPushRadius * bulletPushRadius && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const force = (1 - dist / bulletPushRadius) * 2;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }
        }
        
        // 检测子弹碰撞
        let hitTarget = false;
        let bulletOwner = b.owner; // 子弹的发射者
        
        if (b.isEnemyBullet) {
            // 敌人子弹检测与玩家碰撞
            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < player.radius + config.bulletRadius && !player.dying) {
                hitTarget = true;
                killPlayer();
            }
            
            // 敌人子弹也检测与其他敌人的碰撞
            if (!hitTarget) {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    
                    // 跳过发射者自己和已死亡的敌人
                    if (enemy === bulletOwner || enemy.dying) continue;
                    
                    const dx = b.x - enemy.x;
                    const dy = b.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < enemy.radius + config.bulletRadius) {
                        hitTarget = true;
                        
                        enemy.dying = true;
                        enemy.deathPhase = 'dissolve';
                        enemy.dissolveStartTime = Date.now();
                        
                        createDashParticles(enemy.x, enemy.y, 15);
                        createInkDissolveParticles(enemy.x, enemy.y, 300);
                        
                        console.log('Enemy hit by another enemy bullet!');
                        break;
                    }
                }
            }
        } else {
            // 玩家子弹检测与敌人碰撞
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const dx = b.x - enemy.x;
                const dy = b.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < enemy.radius + config.bulletRadius && !enemy.dying) {
                    hitTarget = true;
                    
                    enemy.dying = true;
                    enemy.deathPhase = 'dissolve';
                    enemy.dissolveStartTime = Date.now();
                    
                    // 触发慢动作效果
                    triggerSlowMotion();
                    
                    // 记录击杀
                    onEnemyKilled();
                    
                    createDashParticles(enemy.x, enemy.y, 15);
                    createInkDissolveParticles(enemy.x, enemy.y, 300);
                    
                    break;
                }
            }
        }
        
        // 子弹离开屏幕或击中目标后移除
        if (hitTarget || b.x < -50 || b.x > canvas.width + 50 || 
            b.y < -50 || b.y > canvas.height + 50) {
            bullets.splice(i, 1);
            // 子弹消失后恢复弹药
            if (!b.isEnemyBullet) {
                player.bullets = Math.min(player.bullets + 1, config.maxBullets);
            } else {
                // 恢复敌人弹药
                for (let j = 0; j < enemies.length; j++) {
                    if (enemies[j].bullets < config.maxBullets) {
                        enemies[j].bullets = Math.min(enemies[j].bullets + 1, config.maxBullets);
                        break;
                    }
                }
            }
        } else {
            // 生成子弹轨迹粒子
            if (Math.random() < 0.3) {
                createDashParticles(b.x, b.y, 1);
            }
        }
    }
    
    // 更新敌人AI
    updateEnemiesAI();
    
    // 更新背景粒子
    const time = Date.now() * 0.001;
    
    // 只对剑气附近的粒子进行推力计算（性能优化）
    const forceRadius = config.bgParticleForce;
    
    for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        
        // 自然漂浮效果（受慢动作影响）
        const floatX = Math.sin(time * p.floatSpeed + p.floatOffsetX) * 0.3 * timeScale;
        const floatY = Math.cos(time * p.floatSpeed * 0.7 + p.floatOffsetY) * 0.3 * timeScale;
        
        // 剑气推力效果 - 检测整个轨迹
        if (player.dashing && player.collisionBodies.length > 0) {
            // 检测与整个剑气轨迹的距离
            let minDistSq = Infinity;
            let closestDx = 0;
            let closestDy = 0;
            
            // 遍历剑气轨迹上的所有碰撞体
            for (let j = 0; j < player.collisionBodies.length; j++) {
                const body = player.collisionBodies[j];
                const dx = p.x - body.x;
                const dy = p.y - body.y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    closestDx = dx;
                    closestDy = dy;
                }
            }
            
            // 如果粒子在剑气范围内，施加推力（受慢动作影响）
            if (minDistSq < forceRadius * forceRadius && minDistSq > 0) {
                const dist = Math.sqrt(minDistSq);
                const force = (1 - dist / forceRadius) * 6 * timeScale;
                p.vx += (closestDx / dist) * force;
                p.vy += (closestDy / dist) * force;
            }
        } else if (!player.dashing) {
            // 行走时推开粒子（温和的推力，受慢动作影响）
            const dx = p.x - player.x;
            const dy = p.y - player.y;
            const distSq = dx * dx + dy * dy;
            const walkForceRadius = config.walkPushForce;
            
            if (distSq < walkForceRadius * walkForceRadius && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const force = (1 - dist / walkForceRadius) * 0.8 * timeScale;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }
        }
        
        // 阻尼（让粒子逐渐减速，但不回归原位）
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        // 更新位置（受慢动作影响）
        p.x += (p.vx + floatX) * timeScale;
        p.y += (p.vy + floatY) * timeScale;
        
        // 边界处理 - 粒子离开屏幕后从对面重新进入
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
    }
    
    // 粒子数量控制：当超过8000个时逐渐清除
    if (bgParticles.length > 8000) {
        // 计算需要清除的数量
        const excess = bgParticles.length - 8000;
        const removeCount = Math.min(Math.ceil(excess * 0.1), 100); // 每帧最多清除100个
        
        // 优先清除最老的非血液粒子
        let removed = 0;
        for (let i = bgParticles.length - 1; i >= 0 && removed < removeCount; i--) {
            if (!bgParticles[i].isBloodStain) {
                bgParticles.splice(i, 1);
                removed++;
            }
        }
        
        // 如果还需要清除，清除最老的血液粒子
        if (removed < removeCount) {
            const stillNeedRemove = removeCount - removed;
            bgParticles.splice(0, stillNeedRemove);
        }
    }
}

// 更激进的缓动函数 - 先加速后减速
function easeInOutQuint(t) {
    return t < 0.5 
        ? 16 * t * t * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景水墨粒子
    ctx.save();
    
    for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        
        // 血液污渍的淡入效果
        let opacity = p.opacity;
        if (p.isBloodStain && p.fadeInProgress < 1) {
            p.fadeInProgress = Math.min(p.fadeInProgress + 0.015, 1);
            opacity *= p.fadeInProgress;
        }
        
        if (p.isBloodStain) {
            // 血液污渍粒子 - 鲜红色血液
            // 外层晕染
            if (p.size > 1.5) {
                ctx.fillStyle = `rgba(200, 30, 30, ${opacity * 0.5})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 主粒子 - 鲜红色血液
            ctx.fillStyle = `rgba(180, 20, 20, ${opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 核心 - 深红色，更浓
            ctx.fillStyle = `rgba(140, 10, 10, ${Math.min(opacity * 1.3, 1)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 普通黑色墨迹粒子
            // 只对较大的粒子添加晕染效果
            if (p.size > 3) {
                ctx.fillStyle = `rgba(60, 60, 65, ${opacity * 0.25})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 主粒子（圆点）
            ctx.fillStyle = `rgba(40, 40, 45, ${opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
    
    // 绘制粒子 - 水墨风格
    ctx.save();
    particles.forEach(p => {
        if (p.isImpact) {
            // 冲击波粒子 - 更实的黑色
            // 最外层晕染
            ctx.fillStyle = `rgba(60, 60, 70, ${p.life * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life * 1.8, 0, Math.PI * 2);
            ctx.fill();
            
            // 中层晕染
            ctx.fillStyle = `rgba(35, 35, 45, ${p.life * 0.75})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life * 1.3, 0, Math.PI * 2);
            ctx.fill();
            
            // 核心 - 深黑色，更不透明
            ctx.fillStyle = `rgba(15, 15, 20, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 水墨黑色粒子
            ctx.fillStyle = `rgba(30, 30, 35, ${p.life * 0.7})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            
            // 外层淡墨晕染效果
            ctx.fillStyle = `rgba(60, 60, 70, ${p.life * 0.3})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.restore();
    
    // 绘制冲刺轨迹（剑光效果）- 水墨风格
    if (player.dashing) {
        ctx.save();
        
        // 绘制外层墨晕 - 最淡的灰色晕染
        const outerGradient = ctx.createLinearGradient(
            player.dashStartX, player.dashStartY,
            player.x, player.y
        );
        outerGradient.addColorStop(0, 'rgba(100, 100, 110, 0)');
        outerGradient.addColorStop(0.3, 'rgba(80, 80, 90, 0.1)');
        outerGradient.addColorStop(0.7, 'rgba(60, 60, 70, 0.15)');
        outerGradient.addColorStop(1, 'rgba(40, 40, 50, 0.2)');
        
        ctx.strokeStyle = outerGradient;
        ctx.lineWidth = player.radius * 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(player.dashStartX, player.dashStartY);
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
        
        // 绘制中层墨迹
        const midGradient = ctx.createLinearGradient(
            player.dashStartX, player.dashStartY,
            player.x, player.y
        );
        midGradient.addColorStop(0, 'rgba(60, 60, 70, 0)');
        midGradient.addColorStop(0.3, 'rgba(50, 50, 60, 0.4)');
        midGradient.addColorStop(0.7, 'rgba(35, 35, 45, 0.6)');
        midGradient.addColorStop(1, 'rgba(25, 25, 35, 0.75)');
        
        ctx.strokeStyle = midGradient;
        ctx.lineWidth = player.radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(player.dashStartX, player.dashStartY);
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
        
        // 绘制主剑光 - 浓墨锋刃
        const gradient = ctx.createLinearGradient(
            player.dashStartX, player.dashStartY,
            player.x, player.y
        );
        gradient.addColorStop(0, 'rgba(40, 40, 50, 0)');
        gradient.addColorStop(0.3, 'rgba(30, 30, 40, 0.6)');
        gradient.addColorStop(0.7, 'rgba(20, 20, 30, 0.9)');
        gradient.addColorStop(1, 'rgba(15, 15, 20, 1)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = player.radius * 0.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(player.dashStartX, player.dashStartY);
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
        
        // 绘制拖尾效果 - 水墨残影
        if (player.trail.length > 1) {
            for (let i = 0; i < player.trail.length - 1; i++) {
                const t1 = player.trail[i];
                const t2 = player.trail[i + 1];
                const alpha = t1.alpha * 0.5;
                
                ctx.strokeStyle = `rgba(30, 30, 40, ${alpha})`;
                ctx.lineWidth = player.radius * 2 * alpha;
                ctx.beginPath();
                ctx.moveTo(t1.x, t1.y);
                ctx.lineTo(t2.x, t2.y);
                ctx.stroke();
            }
        }
        
        // 绘制碰撞体积（调试用，半透明圆圈）
        ctx.fillStyle = 'rgba(255, 100, 100, 0.1)';
        player.collisionBodies.forEach(body => {
            ctx.beginPath();
            ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    // 绘制蓄力圈和冲刺引导线
    if (player.charging && player.chargeProgress > 0) {
        ctx.save();
        
        // 绘制最大冲刺范围圈
        ctx.strokeStyle = 'rgba(80, 80, 90, 0.15)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, config.maxDashDistance, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 冲刺引导线（实线，带箭头）- 更淡的颜色
        const alpha = 0.15 + player.chargeProgress * 0.25;
        const lineWidth = 2 + player.chargeProgress * 2;
        
        // 主引导线
        ctx.strokeStyle = `rgba(80, 80, 90, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.targetX, player.targetY);
        ctx.stroke();
        
        // 引导线外发光
        ctx.strokeStyle = `rgba(100, 100, 110, ${alpha * 0.4})`;
        ctx.lineWidth = lineWidth + 4;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.targetX, player.targetY);
        ctx.stroke();
        
        // 绘制箭头
        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        const angle = Math.atan2(dy, dx);
        const arrowSize = 15 + player.chargeProgress * 10;
        
        ctx.fillStyle = `rgba(80, 80, 90, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(player.targetX, player.targetY);
        ctx.lineTo(
            player.targetX - arrowSize * Math.cos(angle - Math.PI / 6),
            player.targetY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            player.targetX - arrowSize * Math.cos(angle + Math.PI / 6),
            player.targetY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        // 目标位置圆圈
        ctx.strokeStyle = `rgba(80, 80, 90, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.targetX, player.targetY, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        // 蓄力完成时的脉冲效果
        if (player.chargeProgress >= 1) {
            const pulseSize = 20 + Math.sin(Date.now() * 0.01) * 5;
            ctx.strokeStyle = `rgba(80, 80, 90, ${0.2 + Math.sin(Date.now() * 0.01) * 0.15})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.targetX, player.targetY, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 蓄力圈
        ctx.strokeStyle = '#333';
        ctx.lineWidth = config.chargeRingWidth;
        ctx.beginPath();
        ctx.arc(
            player.x, 
            player.y, 
            player.radius + 8, 
            -Math.PI / 2, 
            -Math.PI / 2 + Math.PI * 2 * player.chargeProgress
        );
        ctx.stroke();
        ctx.restore();
    }
    
    // 绘制瞄准UI
    if (player.aiming && player.aimProgress > 0) {
        ctx.save();
        
        // 瞄准线
        ctx.strokeStyle = `rgba(255, 50, 50, ${0.3 + player.aimProgress * 0.4})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.aimTargetX, player.aimTargetY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 瞄准圈（在玩家周围）
        ctx.strokeStyle = `rgba(255, 50, 50, ${0.5 + player.aimProgress * 0.5})`;
        ctx.lineWidth = config.chargeRingWidth;
        ctx.beginPath();
        ctx.arc(
            player.x, 
            player.y, 
            player.radius + 8, 
            -Math.PI / 2, 
            -Math.PI / 2 + Math.PI * 2 * player.aimProgress
        );
        ctx.stroke();
        
        // 目标准星
        const crosshairSize = 10 + player.aimProgress * 5;
        const crosshairAlpha = 0.4 + player.aimProgress * 0.6;
        ctx.strokeStyle = `rgba(255, 50, 50, ${crosshairAlpha})`;
        ctx.lineWidth = 2;
        
        // 十字准星
        ctx.beginPath();
        ctx.moveTo(player.aimTargetX - crosshairSize, player.aimTargetY);
        ctx.lineTo(player.aimTargetX + crosshairSize, player.aimTargetY);
        ctx.moveTo(player.aimTargetX, player.aimTargetY - crosshairSize);
        ctx.lineTo(player.aimTargetX, player.aimTargetY + crosshairSize);
        ctx.stroke();
        
        // 准星外圈
        ctx.beginPath();
        ctx.arc(player.aimTargetX, player.aimTargetY, crosshairSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // 锁定完成时的效果
        if (player.aimProgress >= 1) {
            ctx.fillStyle = `rgba(255, 50, 50, ${0.2 + Math.sin(Date.now() * 0.01) * 0.1})`;
            ctx.beginPath();
            ctx.arc(player.aimTargetX, player.aimTargetY, crosshairSize + 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 绘制玩家（圆形斗笠）
    ctx.save();
    
    // 如果正在死亡，应用特殊效果
    if (player.dying && player.deathPhase === 'dissolve') {
        ctx.globalAlpha = 1 - player.dissolveProgress;
        ctx.shadowColor = 'rgba(180, 30, 30, 0.8)';
        ctx.shadowBlur = 20 * player.dissolveProgress;
    }
    
    // 冲刺时添加水墨晕染效果
    if (player.dashing && !player.dying) {
        ctx.shadowColor = 'rgba(30, 30, 40, 0.6)';
        ctx.shadowBlur = 15;
    }
    
    // 射击动画 - 枪械
    if (player.shooting && !player.dying) {
        const elapsed = Date.now() - player.shootStartTime;
        const animProgress = elapsed / config.shootAnimDuration;
        const recoil = (1 - animProgress) * 5; // 后坐力效果
        
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // 枪身
        const gunLength = 20 - recoil;
        const gunX = player.x + Math.cos(player.aimAngle) * gunLength;
        const gunY = player.y + Math.sin(player.aimAngle) * gunLength;
        
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(gunX, gunY);
        ctx.stroke();
        
        // 枪口闪光
        if (animProgress < 0.3) {
            ctx.fillStyle = `rgba(255, 200, 100, ${1 - animProgress * 3})`;
            ctx.beginPath();
            ctx.arc(gunX, gunY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 根据死亡状态选择颜色
    let outerColor = '#2a2a2a';
    let innerColor = '#1a1a1a';
    let lineColor = '#3a3a3a';
    
    if (player.dying && player.deathPhase === 'dissolve') {
        // 死亡时变为红色
        const redProgress = 0.8;
        outerColor = `rgba(180, 30, 30, ${redProgress})`;
        innerColor = `rgba(140, 20, 20, ${redProgress})`;
        lineColor = `rgba(200, 50, 50, ${redProgress})`;
    }
    
    // 外圈（斗笠边缘）
    ctx.fillStyle = outerColor;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 内圈（斗笠中心）
    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // 斗笠纹理线条
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const x1 = player.x + Math.cos(angle) * player.radius * 0.6;
        const y1 = player.y + Math.sin(angle) * player.radius * 0.6;
        const x2 = player.x + Math.cos(angle) * player.radius;
        const y2 = player.y + Math.sin(angle) * player.radius;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // 消散阶段额外效果 - 绘制飘散的红色墨迹碎片
    if (player.dying && player.deathPhase === 'dissolve') {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + player.dissolveProgress * 0.5;
            const distance = player.radius * (1 + player.dissolveProgress * 0.5);
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;
            const size = player.radius * 0.2 * (1 - player.dissolveProgress);
            
            ctx.fillStyle = `rgba(180, 30, 30, ${(1 - player.dissolveProgress) * 0.6})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
    

    
    // 绘制子弹
    ctx.save();
    bullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        
        // 外层晕染
        ctx.fillStyle = 'rgba(40, 40, 45, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, config.bulletLength * 0.6, config.bulletRadius * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 子弹本体 - 椭圆形
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(0, 0, config.bulletLength * 0.5, config.bulletRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 子弹头部 - 圆锥形
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(config.bulletLength * 0.5, 0);
        ctx.lineTo(config.bulletLength * 0.2, -config.bulletRadius);
        ctx.lineTo(-config.bulletLength * 0.5, -config.bulletRadius * 0.7);
        ctx.lineTo(-config.bulletLength * 0.5, config.bulletRadius * 0.7);
        ctx.lineTo(config.bulletLength * 0.2, config.bulletRadius);
        ctx.closePath();
        ctx.fill();
        
        // 子弹底部 - 弹壳
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.ellipse(-config.bulletLength * 0.3, 0, config.bulletLength * 0.2, config.bulletRadius * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.ellipse(config.bulletLength * 0.1, -config.bulletRadius * 0.3, config.bulletLength * 0.15, config.bulletRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
    ctx.restore();
    
    // 更新敌人死亡动画
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (enemy.dying && enemy.deathPhase === 'dissolve') {
            // 水墨消散阶段 - 持续100ms（更快）
            const dissolveElapsed = Date.now() - enemy.dissolveStartTime;
            enemy.dissolveProgress = Math.min(dissolveElapsed / 100, 1);
            
            if (enemy.dissolveProgress >= 1) {
                // 完全消散，移除敌人
                enemies.splice(i, 1);
            }
        }
    }
    
    // 绘制敌人
    enemies.forEach(enemy => {
        drawEnemy(enemy);
    });
    
    // 绘制UI - 子弹状态
    ctx.save();
    const bulletUIX = 30;
    const bulletUIY = 30;
    const bulletUISpacing = 20;
    
    for (let i = 0; i < config.maxBullets; i++) {
        if (i < player.bullets) {
            // 有子弹 - 红色实心圆
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(bulletUIX + i * bulletUISpacing, bulletUIY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // 外圈
            ctx.strokeStyle = '#cc0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bulletUIX + i * bulletUISpacing, bulletUIY, 6, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // 无子弹 - 空心圆
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bulletUIX + i * bulletUISpacing, bulletUIY, 6, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.restore();
    
    // 绘制教程UI（左下角）
    if (!gameOver) {
        ctx.save();
        
        const tutorialX = 30;
        const tutorialY = canvas.height - 30;
        const lineHeight = 24;
        let currentY = tutorialY;
        
        // 绘制圆角矩形背景
        const rectX = tutorialX - 15;
        const rectY = tutorialY - 145;
        const rectWidth = 280;
        const rectHeight = 155;
        const borderRadius = 15;
        
        // 半透明白色背景（圆角）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(rectX + borderRadius, rectY);
        ctx.lineTo(rectX + rectWidth - borderRadius, rectY);
        ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + borderRadius, borderRadius);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius);
        ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - borderRadius, rectY + rectHeight, borderRadius);
        ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
        ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius, borderRadius);
        ctx.lineTo(rectX, rectY + borderRadius);
        ctx.arcTo(rectX, rectY, rectX + borderRadius, rectY, borderRadius);
        ctx.closePath();
        ctx.fill();
        
        // 边框（圆角）
        ctx.strokeStyle = 'rgba(45, 45, 45, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 标题
        ctx.fillStyle = '#2d2d2d';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 2;
        currentY -= 120;
        ctx.fillText('操作指南', tutorialX, currentY);
        
        // 操作说明
        ctx.fillStyle = '#2d2d2d';
        ctx.font = '16px Arial';
        ctx.shadowBlur = 0;
        
        currentY += lineHeight;
        ctx.fillText('WASD - 移动', tutorialX, currentY);
        
        currentY += lineHeight;
        ctx.fillText('左键按住 - 蓄力冲刺', tutorialX, currentY);
        
        currentY += lineHeight;
        ctx.fillText('右键按住 - 瞄准射击', tutorialX, currentY);
        
        currentY += lineHeight;
        ctx.fillText('冲刺可反弹子弹', tutorialX, currentY);
        
        currentY += lineHeight;
        ctx.fillText('击杀触发慢动作', tutorialX, currentY);
        
        ctx.restore();
    }
    
    // 绘制波次和积分信息
    if (gameStarted && !gameOver) {
        ctx.save();
        
        // 右上角显示波次
        ctx.fillStyle = '#2d2d2d';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 3;
        ctx.fillText(`波次: ${currentWave}`, canvas.width - 30, 30);
        
        // 右上角显示积分
        ctx.fillStyle = '#2d2d2d';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`${totalScore}`, canvas.width - 30, 70);
        
        // 显示剩余敌人数
        const aliveEnemies = enemies.filter(e => !e.dying).length;
        ctx.fillStyle = '#ff3333';
        ctx.font = '24px Arial';
        ctx.fillText(`敌人: ${aliveEnemies}/${currentWave}`, canvas.width - 30, 115);
        
        ctx.restore();
    }
    
    // 绘制慢动作效果
    if (slowMotionActive) {
        ctx.save();
        
        const elapsed = Date.now() - slowMotionStartTime;
        const progress = elapsed / slowMotionDuration;
        const alpha = (1 - progress) * 0.3; // 逐渐消失
        
        // 屏幕边缘金色发光
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(1, `rgba(255, 215, 0, ${alpha})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 边框金色闪光
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 2})`;
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        ctx.restore();
    }
    
    // 绘制倒计时UI
    if (!gameStarted && !gameOver) {
        ctx.save();
        
        const elapsed = Date.now() - countdownStartTime;
        const secondProgress = (elapsed % 1000) / 1000; // 当前秒的进度 0-1
        
        // 屏幕边缘跳动效果（红色）
        if (countdownValue > 0) {
            // 使用缓动函数创建跳动效果
            const pulse = Math.max(0, 1 - secondProgress * 2); // 前半秒跳动，后半秒消失
            const pulseIntensity = pulse * 0.4; // 增加强度
            
            // 绘制边缘红色发光效果
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
            );
            gradient.addColorStop(0, `rgba(255, 50, 50, 0)`);
            gradient.addColorStop(0.7, `rgba(255, 50, 50, 0)`);
            gradient.addColorStop(1, `rgba(255, 50, 50, ${pulseIntensity})`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制红色边框闪光
            ctx.strokeStyle = `rgba(255, 50, 50, ${pulseIntensity * 2.5})`;
            ctx.lineWidth = 15 + pulse * 25;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            
            // 添加内层红色边框增强效果
            ctx.strokeStyle = `rgba(255, 100, 100, ${pulseIntensity * 1.5})`;
            ctx.lineWidth = 8 + pulse * 15;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        }
        
        // 屏幕中央倒计时数字（红色）
        if (countdownValue > 0) {
            const scale = 1 + (1 - secondProgress) * 0.5; // 数字缩放效果
            const alpha = 0.8 + (1 - secondProgress) * 0.2; // 透明度变化
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scale, scale);
            
            // 倒计时数字 - 红色
            ctx.fillStyle = `rgba(255, 51, 51, ${alpha})`;
            ctx.font = 'bold 120px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255, 51, 51, 0.5)';
            ctx.shadowBlur = 20;
            ctx.fillText(countdownValue.toString(), 0, 0);
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    // 绘制游戏结束UI
    if (gameOver) {
        ctx.save();
        
        // 半透明白色背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 游戏结束文字
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 51, 51, 0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 100);
        
        // 显示波次
        ctx.fillStyle = '#2d2d2d';
        ctx.font = 'bold 48px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.fillText(`波次: ${currentWave - 1}`, canvas.width / 2, canvas.height / 2 - 20);
        
        // 显示总积分
        ctx.fillStyle = '#2d2d2d';
        ctx.font = 'bold 56px Arial';
        ctx.fillText(`总分: ${totalScore}`, canvas.width / 2, canvas.height / 2 + 40);
        
        // 提示文字
        ctx.fillStyle = '#666666';
        ctx.font = '32px Arial';
        ctx.shadowBlur = 3;
        ctx.fillText('按空格键重新开始', canvas.width / 2, canvas.height / 2 + 110);
        
        ctx.restore();
    }
    
    // 绘制自定义鼠标光标 - 黑色墨点
    if (!gameOver) {
        ctx.save();
        
        // 外层晕染
        ctx.fillStyle = 'rgba(40, 40, 45, 0.2)';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 中层
        ctx.fillStyle = 'rgba(30, 30, 35, 0.4)';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心 - 黑色墨点
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(mouseX - 1.5, mouseY - 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// 游戏主循环
function gameLoop() {
    // 如果游戏未初始化，只更新和绘制背景粒子
    if (!gameInitialized) {
        // 更新背景粒子
        const time = Date.now() * 0.001;
        for (let i = 0; i < bgParticles.length; i++) {
            const p = bgParticles[i];
            const floatX = Math.sin(time * p.floatSpeed + p.floatOffsetX) * 0.3;
            const floatY = Math.cos(time * p.floatSpeed * 0.7 + p.floatOffsetY) * 0.3;
            p.x += floatX;
            p.y += floatY;
            
            // 边界处理
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = canvas.height + 10;
            if (p.y > canvas.height + 10) p.y = -10;
        }
        
        // 只绘制背景
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        for (let i = 0; i < bgParticles.length; i++) {
            const p = bgParticles[i];
            ctx.fillStyle = `rgba(40, 40, 50, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    } else {
        // 游戏已初始化，正常更新和绘制
        update();
        draw();
    }
    
    requestAnimationFrame(gameLoop);
}

// 窗口大小调整
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = Math.min(player.x, canvas.width);
    player.y = Math.min(player.y, canvas.height);
    initBgParticles();
});

// 创建敌人
function createEnemy(x, y, aiType) {
    // 随机AI类型（如果未指定）
    if (!aiType) {
        const types = ['aggressive', 'sniper', 'balanced'];
        aiType = types[Math.floor(Math.random() * types.length)];
    }
    
    // 根据AI类型设置参数
    let aiParams = {};
    switch(aiType) {
        case 'aggressive': // 近战型
            aiParams = {
                preferDash: 0.8,
                preferShoot: 0.3,
                safeDistance: 100,
                dashRange: 500,
                shootRange: 300,
                aggressiveness: 0.9
            };
            break;
        case 'sniper': // 远程型
            aiParams = {
                preferDash: 0.2,
                preferShoot: 0.9,
                safeDistance: 250,
                dashRange: 350,
                shootRange: 600,
                aggressiveness: 0.6
            };
            break;
        case 'balanced': // 平衡型
            aiParams = {
                preferDash: 0.5,
                preferShoot: 0.6,
                safeDistance: 150,
                dashRange: 400,
                shootRange: 500,
                aggressiveness: 0.7
            };
            break;
    }
    
    enemies.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: config.playerRadius,
        hatColor: 'brown', // 斗笠颜色
        // AI类型和参数
        aiType: aiType,
        aiParams: aiParams,
        currentTarget: null, // 当前攻击目标（玩家或其他敌人）
        targetLockTime: 0, // 目标锁定时间
        // AI状态
        charging: false,
        chargeStartTime: 0,
        chargeProgress: 0,
        targetX: 0,
        targetY: 0,
        dashing: false,
        dashStartX: 0,
        dashStartY: 0,
        dashEndX: 0,
        dashEndY: 0,
        dashProgress: 0,
        collisionBodies: [],
        trail: [],
        bullets: 3,
        shooting: false,
        shootStartTime: 0,
        aimAngle: 0,
        lastShootTime: 0,
        aiming: false,
        aimStartTime: 0,
        aimProgress: 0,
        aimTargetX: 0,
        aimTargetY: 0,
        // AI决策
        lastThinkTime: 0,
        currentAction: 'idle', // idle, move, charge, dash, shoot
        moveTargetX: 0,
        moveTargetY: 0,
        actionCooldown: 0,
        dodgeDirection: 0, // 闪避方向
        lastDodgeTime: 0, // 上次闪避时间
        lastDashTime: 0 // 上次冲刺时间
    });
}

// 绘制敌人
function drawEnemy(enemy) {
    // 绘制冲刺轨迹（水墨风格）
    if (enemy.dashing) {
        ctx.save();
        
        // 外层墨晕
        const outerGradient = ctx.createLinearGradient(
            enemy.dashStartX, enemy.dashStartY,
            enemy.x, enemy.y
        );
        outerGradient.addColorStop(0, 'rgba(100, 100, 110, 0)');
        outerGradient.addColorStop(0.3, 'rgba(80, 80, 90, 0.1)');
        outerGradient.addColorStop(0.7, 'rgba(60, 60, 70, 0.15)');
        outerGradient.addColorStop(1, 'rgba(40, 40, 50, 0.2)');
        
        ctx.strokeStyle = outerGradient;
        ctx.lineWidth = enemy.radius * 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(enemy.dashStartX, enemy.dashStartY);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.stroke();
        
        // 中层墨迹
        const midGradient = ctx.createLinearGradient(
            enemy.dashStartX, enemy.dashStartY,
            enemy.x, enemy.y
        );
        midGradient.addColorStop(0, 'rgba(60, 60, 70, 0)');
        midGradient.addColorStop(0.3, 'rgba(50, 50, 60, 0.4)');
        midGradient.addColorStop(0.7, 'rgba(35, 35, 45, 0.6)');
        midGradient.addColorStop(1, 'rgba(25, 25, 35, 0.75)');
        
        ctx.strokeStyle = midGradient;
        ctx.lineWidth = enemy.radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(enemy.dashStartX, enemy.dashStartY);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.stroke();
        
        // 主剑光
        const gradient = ctx.createLinearGradient(
            enemy.dashStartX, enemy.dashStartY,
            enemy.x, enemy.y
        );
        gradient.addColorStop(0, 'rgba(40, 40, 50, 0)');
        gradient.addColorStop(0.3, 'rgba(30, 30, 40, 0.6)');
        gradient.addColorStop(0.7, 'rgba(20, 20, 30, 0.9)');
        gradient.addColorStop(1, 'rgba(15, 15, 20, 1)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = enemy.radius * 0.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(enemy.dashStartX, enemy.dashStartY);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.stroke();
        
        // 拖尾效果
        if (enemy.trail.length > 1) {
            for (let i = 0; i < enemy.trail.length - 1; i++) {
                const t1 = enemy.trail[i];
                const t2 = enemy.trail[i + 1];
                const alpha = t1.alpha * 0.5;
                
                ctx.strokeStyle = `rgba(30, 30, 40, ${alpha})`;
                ctx.lineWidth = enemy.radius * 2 * alpha;
                ctx.beginPath();
                ctx.moveTo(t1.x, t1.y);
                ctx.lineTo(t2.x, t2.y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    ctx.save();
    
    // 如果正在死亡，应用特殊效果
    if (enemy.dying && enemy.deathPhase === 'dissolve') {
        ctx.globalAlpha = 1 - enemy.dissolveProgress;
        ctx.shadowColor = 'rgba(180, 30, 30, 0.8)';
        ctx.shadowBlur = 20 * enemy.dissolveProgress;
    }
    
    // 根据死亡阶段选择颜色
    let outerColor = '#8b7355';
    let innerColor = '#6b5644';
    let lineColor = '#a08060';
    
    if (enemy.dying && (enemy.deathPhase === 'pause' || enemy.deathPhase === 'dissolve')) {
        const redProgress = enemy.deathPhase === 'pause' ? 0.5 : 0.8;
        outerColor = `rgba(180, 30, 30, ${redProgress})`;
        innerColor = `rgba(140, 20, 20, ${redProgress})`;
        lineColor = `rgba(200, 50, 50, ${redProgress})`;
    }
    
    // 射击动画
    if (enemy.shooting) {
        const elapsed = Date.now() - enemy.shootStartTime;
        const animProgress = elapsed / config.shootAnimDuration;
        const recoil = (1 - animProgress) * 5;
        
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        const gunLength = 20 - recoil;
        const gunX = enemy.x + Math.cos(enemy.aimAngle) * gunLength;
        const gunY = enemy.y + Math.sin(enemy.aimAngle) * gunLength;
        
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(gunX, gunY);
        ctx.stroke();
        
        if (animProgress < 0.3) {
            ctx.fillStyle = `rgba(255, 200, 100, ${1 - animProgress * 3})`;
            ctx.beginPath();
            ctx.arc(gunX, gunY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 外圈（斗笠边缘）
    ctx.fillStyle = outerColor;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 内圈（斗笠中心）
    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // 斗笠纹理线条
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const x1 = enemy.x + Math.cos(angle) * enemy.radius * 0.6;
        const y1 = enemy.y + Math.sin(angle) * enemy.radius * 0.6;
        const x2 = enemy.x + Math.cos(angle) * enemy.radius;
        const y2 = enemy.y + Math.sin(angle) * enemy.radius;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // 蓄力圈和冲刺引导线
    if (enemy.charging && enemy.chargeProgress > 0) {
        // 绘制最大冲刺范围圈
        ctx.strokeStyle = 'rgba(80, 80, 90, 0.15)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, config.maxDashDistance, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 冲刺引导线（实线，带箭头，水墨色）- 更淡的颜色
        const alpha = 0.15 + enemy.chargeProgress * 0.25;
        const lineWidth = 2 + enemy.chargeProgress * 2;
        
        // 主引导线
        ctx.strokeStyle = `rgba(80, 80, 90, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.targetX, enemy.targetY);
        ctx.stroke();
        
        // 引导线外发光
        ctx.strokeStyle = `rgba(100, 100, 110, ${alpha * 0.4})`;
        ctx.lineWidth = lineWidth + 4;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.targetX, enemy.targetY);
        ctx.stroke();
        
        // 绘制箭头
        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const angle = Math.atan2(dy, dx);
        const arrowSize = 15 + enemy.chargeProgress * 10;
        
        ctx.fillStyle = `rgba(80, 80, 90, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(enemy.targetX, enemy.targetY);
        ctx.lineTo(
            enemy.targetX - arrowSize * Math.cos(angle - Math.PI / 6),
            enemy.targetY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            enemy.targetX - arrowSize * Math.cos(angle + Math.PI / 6),
            enemy.targetY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        // 目标位置圆圈
        ctx.strokeStyle = `rgba(80, 80, 90, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.targetX, enemy.targetY, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        // 蓄力完成时的脉冲效果
        if (enemy.chargeProgress >= 1) {
            const pulseSize = 20 + Math.sin(Date.now() * 0.01) * 5;
            ctx.strokeStyle = `rgba(80, 80, 90, ${0.2 + Math.sin(Date.now() * 0.01) * 0.15})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemy.targetX, enemy.targetY, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 蓄力圈
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = config.chargeRingWidth;
        ctx.beginPath();
        ctx.arc(
            enemy.x, 
            enemy.y, 
            enemy.radius + 8, 
            -Math.PI / 2, 
            -Math.PI / 2 + Math.PI * 2 * enemy.chargeProgress
        );
        ctx.stroke();
    }
    
    // 瞄准UI
    if (enemy.aiming && enemy.aimProgress > 0) {
        // 瞄准线
        ctx.strokeStyle = `rgba(139, 115, 85, ${0.3 + enemy.aimProgress * 0.4})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.aimTargetX, enemy.aimTargetY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 瞄准圈
        ctx.strokeStyle = `rgba(139, 115, 85, ${0.5 + enemy.aimProgress * 0.5})`;
        ctx.lineWidth = config.chargeRingWidth;
        ctx.beginPath();
        ctx.arc(
            enemy.x, 
            enemy.y, 
            enemy.radius + 8, 
            -Math.PI / 2, 
            -Math.PI / 2 + Math.PI * 2 * enemy.aimProgress
        );
        ctx.stroke();
    }
    
    // 消散阶段额外效果
    if (enemy.dying && enemy.deathPhase === 'dissolve') {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + enemy.dissolveProgress * 0.5;
            const distance = enemy.radius * (1 + enemy.dissolveProgress * 0.5);
            const x = enemy.x + Math.cos(angle) * distance;
            const y = enemy.y + Math.sin(angle) * distance;
            const size = enemy.radius * 0.2 * (1 - enemy.dissolveProgress);
            
            ctx.fillStyle = `rgba(180, 30, 30, ${(1 - enemy.dissolveProgress) * 0.6})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

// AI决策树系统
function updateEnemiesAI() {
    const now = Date.now();
    
    enemies.forEach(enemy => {
        if (enemy.dying) return;
        
        // 更新敌人的冲刺状态
        updateEnemyDash(enemy);
        
        // 更新敌人的射击动画
        if (enemy.shooting) {
            const elapsed = now - enemy.shootStartTime;
            if (elapsed > config.shootAnimDuration) {
                enemy.shooting = false;
            }
        }
        
        // 更新敌人的蓄力状态
        if (enemy.charging) {
            const distance = Math.hypot(enemy.targetX - enemy.x, enemy.targetY - enemy.y);
            const normalizedDist = Math.min(distance / 500, 1);
            const sigmoid = 1 / (1 + Math.exp(-10 * (normalizedDist - 0.5)));
            const chargeTime = config.minChargeTime + (config.maxChargeTime - config.minChargeTime) * sigmoid;
            
            const elapsed = now - enemy.chargeStartTime;
            enemy.chargeProgress = Math.min(elapsed / chargeTime, 1);
            
            // 蓄力完成后自动冲刺（只有游戏开始后才能释放）
            if (enemy.chargeProgress >= 1 && gameStarted) {
                startEnemyDash(enemy);
            }
        }
        
        // 更新敌人的瞄准状态
        if (enemy.aiming) {
            const elapsed = now - enemy.aimStartTime;
            enemy.aimProgress = Math.min(elapsed / config.aimTime, 1);
            
            // 更新瞄准角度
            const dx = enemy.aimTargetX - enemy.x;
            const dy = enemy.aimTargetY - enemy.y;
            enemy.aimAngle = Math.atan2(dy, dx);
            
            // 瞄准完成后自动射击（只有游戏开始后才能释放）
            if (enemy.aimProgress >= 1 && gameStarted) {
                enemyShoot(enemy, enemy.aimTargetX, enemy.aimTargetY);
                enemy.aiming = false;
                enemy.aimProgress = 0;
            }
        }
        
        // 如果正在闪避，持续朝目标移动
        if (enemy.dodging && enemy.dodgeTarget) {
            const dx = enemy.dodgeTarget.x - enemy.x;
            const dy = enemy.dodgeTarget.y - enemy.y;
            const dist = Math.hypot(dx, dy);
            
            // 到达目标或超时（1秒）则停止闪避
            if (dist < 10 || now - enemy.dodgeStartTime > 1000) {
                enemy.dodging = false;
                enemy.dodgeTarget = null;
                enemy.lastDodgeTime = now; // 更新闪避时间，开始冷却
            } else {
                // 持续朝目标移动
                const normalizedDx = dx / dist;
                const normalizedDy = dy / dist;
                enemy.vx += normalizedDx * config.walkAcceleration * 2;
                enemy.vy += normalizedDy * config.walkAcceleration * 2;
                applyEnemyMovement(enemy); // 应用移动
                return; // 闪避期间不执行其他动作
            }
        }
        
        // AI决策间隔
        if (now - enemy.lastThinkTime < config.aiThinkInterval) {
            // 非决策时刻，继续执行当前动作
            executeCurrentAction(enemy);
            return;
        }
        
        enemy.lastThinkTime = now;
        
        // 决策树
        const decision = makeAIDecision(enemy);
        enemy.currentAction = decision;
    });
    
    // 检查是否所有敌人都已死亡（无论是谁击杀的）
    checkWaveCompletion();
}

// 选择AI攻击目标
function selectAITarget(enemy) {
    const now = Date.now();
    
    // 如果已有目标且锁定时间未过，继续攻击当前目标
    if (enemy.currentTarget && now - enemy.targetLockTime < 3000) {
        // 检查目标是否还有效
        if (enemy.currentTarget === player && !player.dying) {
            return enemy.currentTarget;
        }
        if (enemy.currentTarget !== player && !enemy.currentTarget.dying) {
            return enemy.currentTarget;
        }
    }
    
    // 30%概率攻击其他敌人
    if (Math.random() < 0.3) {
        const otherEnemies = enemies.filter(e => e !== enemy && !e.dying);
        if (otherEnemies.length > 0) {
            const target = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
            enemy.currentTarget = target;
            enemy.targetLockTime = now;
            return target;
        }
    }
    
    // 默认攻击玩家
    enemy.currentTarget = player;
    enemy.targetLockTime = now;
    return player;
}

// 预判目标位置
function predictTargetPosition(enemy, target, leadTime) {
    if (target === player) {
        return {
            x: target.x + target.vx * leadTime,
            y: target.y + target.vy * leadTime
        };
    } else {
        return {
            x: target.x + target.vx * leadTime,
            y: target.y + target.vy * leadTime
        };
    }
}

// 检测是否需要闪避
function shouldDodge(enemy) {
    const now = Date.now();
    
    // 如果正在闪避中，不再触发新的闪避
    if (enemy.dodging) return false;
    
    // 闪避冷却（800ms，比射击CD 600ms更长，避免频繁闪避）
    if (now - enemy.lastDodgeTime < 800) return false;
    
    // 检测玩家是否正在冲向敌人
    if (player.dashing) {
        const dashAngle = Math.atan2(player.dashEndY - player.dashStartY, player.dashEndX - player.dashStartX);
        const toEnemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        const angleDiff = Math.abs(dashAngle - toEnemyAngle);
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        
        if (angleDiff < Math.PI / 3 && distToPlayer < 350) {
            enemy.dodgeThreat = { type: 'dash', angle: dashAngle };
            return true;
        }
    }
    
    // 检测玩家瞄准威胁
    if (player.aiming && player.aimProgress > 0.5) {
        const aimAngle = Math.atan2(player.aimTargetY - player.y, player.aimTargetX - player.x);
        const toEnemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        const angleDiff = Math.abs(aimAngle - toEnemyAngle);
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        
        if (angleDiff < Math.PI / 6 && distToPlayer < 400) {
            enemy.dodgeThreat = { type: 'aim', angle: aimAngle };
            return true;
        }
    }
    
    // 全屏子弹威胁检测 - 距离越远越容易躲避
    let closestThreat = null;
    let highestThreatScore = 0;
    
    for (let bullet of bullets) {
        // 跳过自己发射的子弹
        if (bullet.isEnemyBullet && bullet.owner === enemy) continue;
        
        const toBullet = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        const bulletSpeed = Math.hypot(bullet.vx, bullet.vy);
        
        // 全屏检测，不限制距离
        // 计算子弹轨迹与敌人的最近距离
        const bulletAngle = Math.atan2(bullet.vy, bullet.vx);
        
        // 根据距离动态调整预测时间（远距离预测更长）
        const predictTime = Math.min(toBullet / bulletSpeed + 30, 100); // 最多预测100帧
        const futureX = bullet.x + bullet.vx * predictTime;
        const futureY = bullet.y + bullet.vy * predictTime;
        
        // 计算敌人到子弹轨迹线的距离
        const lineDx = futureX - bullet.x;
        const lineDy = futureY - bullet.y;
        const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
        
        if (lineLength > 0) {
            const toDx = enemy.x - bullet.x;
            const toDy = enemy.y - bullet.y;
            
            let t = (toDx * lineDx + toDy * lineDy) / (lineLength * lineLength);
            t = Math.max(0, Math.min(1, t));
            
            const closestX = bullet.x + t * lineDx;
            const closestY = bullet.y + t * lineDy;
            
            const distToLine = Math.hypot(enemy.x - closestX, enemy.y - closestY);
            
            // 判定子弹是否会击中（考虑敌人半径）
            const hitRadius = enemy.radius + 30; // 留一些余量
            if (distToLine < hitRadius && t > 0.05) {
                // 计算到达时间
                const timeToImpact = toBullet / bulletSpeed;
                
                // 威胁评分：距离越近威胁越高，但远距离也能检测到
                // 近距离（<200px）：高威胁，难以躲避
                // 中距离（200-500px）：中等威胁，较容易躲避
                // 远距离（>500px）：低威胁，容易躲避
                let dodgeDifficulty;
                if (toBullet < 200) {
                    dodgeDifficulty = 1.0; // 近距离很难躲
                } else if (toBullet < 500) {
                    dodgeDifficulty = 0.5 + (500 - toBullet) / 600; // 中距离
                } else {
                    dodgeDifficulty = 0.3; // 远距离容易躲
                }
                
                // 综合威胁评分
                const urgency = 1 - (distToLine / hitRadius);
                const threatScore = urgency * dodgeDifficulty * (1 / (timeToImpact + 0.1));
                
                if (threatScore > highestThreatScore) {
                    highestThreatScore = threatScore;
                    closestThreat = {
                        type: 'bullet',
                        angle: bulletAngle,
                        bullet: bullet,
                        distToLine: distToLine,
                        distance: toBullet,
                        dodgeDifficulty: dodgeDifficulty,
                        closestPoint: { x: closestX, y: closestY }
                    };
                }
            }
        }
    }
    
    // 根据距离和AI类型决定是否触发闪避
    if (closestThreat) {
        const distance = closestThreat.distance;
        
        // 根据AI类型设置基础闪避概率
        const baseChance = enemy.aiType === 'sniper' ? 0.9 :      // 远程型：90%
                          enemy.aiType === 'balanced' ? 0.75 :    // 平衡型：75%
                          0.6;                                     // 近战型：60%
        
        // 距离因子：距离越近，闪避概率越低（反应时间不足）
        let distanceFactor;
        if (distance < 100) {
            // 极近距离：很难闪避（20-35%）
            distanceFactor = 0.2 + (distance / 100) * 0.15;
        } else if (distance < 300) {
            // 近距离：较难闪避（35-50%）
            distanceFactor = 0.35 + ((distance - 100) / 200) * 0.15;
        } else if (distance < 600) {
            // 中距离：中等闪避（40-60%）
            distanceFactor = 0.4 + ((distance - 300) / 300) * 0.2;
        } else {
            // 远距离：概率降低（因为有充足时间，不必每次都躲）
            distanceFactor = Math.max(0.3, 0.6 - (distance - 600) / 1000);
        }
        
        const dodgeChance = baseChance * distanceFactor;
        
        if (Math.random() < dodgeChance) {
            enemy.dodgeThreat = closestThreat;
            return true;
        }
    }
    
    return false;
}

// AI决策树
function makeAIDecision(enemy) {
    const now = Date.now();
    
    // 如果正在冲刺、蓄力或瞄准，不改变决策
    if (enemy.dashing || enemy.charging || enemy.aiming) {
        return enemy.currentAction;
    }
    
    // 选择攻击目标
    const target = selectAITarget(enemy);
    const distToTarget = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    
    // 使用AI类型的参数
    const params = enemy.aiParams;
    
    // 1. 紧急闪避：检测威胁
    if (shouldDodge(enemy)) {
        enemy.lastDodgeTime = now;
        
        // 高级技巧：使用冲刺闪避子弹（限制概率）
        if (enemy.dodgeThreat && enemy.dodgeThreat.type === 'bullet') {
            // 根据AI类型决定使用冲刺闪避的概率
            const dashDodgeChance = enemy.aiType === 'sniper' ? 0.25 :    // 远程型：25%
                                   enemy.aiType === 'balanced' ? 0.15 :   // 平衡型：15%
                                   0.08;                                   // 近战型：8%
            
            // 检查是否可以使用冲刺（不在冷却中）
            const canDash = now - enemy.lastDodgeTime >= 300;
            
            if (canDash && Math.random() < dashDodgeChance) {
                // 使用冲刺闪避
                enemy.useDashDodge = true;
                return 'dashDodge';
            }
        }
        
        return 'dodge';
    }
    
    // 2. 远程射击：根据AI类型偏好
    if (distToTarget > params.safeDistance && distToTarget < params.shootRange && 
        enemy.bullets > 0 && now - enemy.lastShootTime >= config.shootCooldown) {
        if (Math.random() < params.preferShoot) {
            return 'shoot';
        }
    }
    
    // 3. 快速接近：距离很远时使用冲刺快速接近（新增战术）
    if (target === player && distToTarget > params.dashRange * 1.5 && distToTarget < 800) {
        // 根据AI类型决定使用冲刺接近的概率
        const dashApproachChance = enemy.aiType === 'aggressive' ? 0.3 :  // 近战型：30%（最激进）
                                   enemy.aiType === 'balanced' ? 0.15 :   // 平衡型：15%
                                   0.05;                                   // 远程型：5%（很少接近）
        
        // 检查冲刺冷却
        const dashCooldown = enemy.aiType === 'aggressive' ? 2000 :
                            enemy.aiType === 'balanced' ? 2500 :
                            3000;
        const canDash = now - enemy.lastDashTime >= dashCooldown;
        
        if (canDash && Math.random() < dashApproachChance) {
            enemy.lastDashTime = now; // 更新冲刺时间
            return 'dashApproach';
        }
    }
    
    // 4. 冲刺攻击：根据AI类型偏好（添加冷却时间）
    if (distToTarget > params.safeDistance && distToTarget < params.dashRange) {
        const targetDashing = (target === player) ? player.dashing : target.dashing;
        
        // 冲刺冷却时间：根据AI类型调整
        const dashCooldown = enemy.aiType === 'aggressive' ? 2000 :  // 近战型：2秒
                            enemy.aiType === 'balanced' ? 2500 :     // 平衡型：2.5秒
                            3000;                                     // 远程型：3秒
        
        const canDash = now - enemy.lastDashTime >= dashCooldown;
        
        if (!targetDashing && canDash && Math.random() < params.preferDash) {
            enemy.lastDashTime = now; // 更新冲刺时间
            return 'charge';
        }
    }
    
    // 5. 包围战术：多个敌人时尝试包围玩家
    if (target === player && enemies.filter(e => !e.dying).length >= 2) {
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        const otherEnemies = enemies.filter(e => e !== enemy && !e.dying);
        
        // 计算其他敌人的角度
        let shouldFlank = true;
        for (let other of otherEnemies) {
            const otherAngle = Math.atan2(player.y - other.y, player.x - other.x);
            const angleDiff = Math.abs(angleToPlayer - otherAngle);
            if (angleDiff < Math.PI / 3) {
                shouldFlank = true;
                break;
            }
        }
        
        if (shouldFlank && distToTarget > params.safeDistance) {
            return 'flank';
        }
    }
    
    // 6. 保持距离：太近时后退
    if (distToTarget < params.safeDistance) {
        return 'retreat';
    }
    
    // 7. 接近目标：距离太远时
    if (distToTarget > params.dashRange) {
        return 'approach';
    }
    
    // 8. 游走：保持在攻击范围内
    return 'strafe';
}

// 执行当前动作
function executeCurrentAction(enemy) {
    if (enemy.dashing || enemy.charging) return;
    
    const target = enemy.currentTarget || player;
    
    switch (enemy.currentAction) {
        case 'approach':
            moveTowardsTarget(enemy, target, 1.0);
            break;
        case 'retreat':
            moveAwayFromTarget(enemy, target, 1.0);
            break;
        case 'strafe':
            strafeAroundTarget(enemy, target);
            break;
        case 'flank':
            flankTarget(enemy, target);
            break;
        case 'charge':
            // 预判目标位置
            const predictedPos = predictTargetPosition(enemy, target, 20);
            startEnemyCharge(enemy, predictedPos.x, predictedPos.y);
            break;
        case 'dashApproach':
            // 快速接近：冲刺到玩家附近
            performDashApproach(enemy, target);
            break;
        case 'shoot':
            // 预判目标位置
            const aimPos = predictTargetPosition(enemy, target, 15);
            startEnemyAim(enemy, aimPos.x, aimPos.y);
            break;
        case 'dodge':
            performDodge(enemy);
            break;
        case 'dashDodge':
            performDashDodge(enemy);
            break;
    }
}

// 敌人移动向目标
function moveTowardsTarget(enemy, target, speedMultiplier) {
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
        const moveX = (dx / dist) * speedMultiplier;
        const moveY = (dy / dist) * speedMultiplier;
        
        enemy.vx += moveX * config.walkAcceleration;
        enemy.vy += moveY * config.walkAcceleration;
    }
    
    applyEnemyMovement(enemy);
}

// 敌人远离目标
function moveAwayFromTarget(enemy, target, speedMultiplier) {
    const dx = enemy.x - target.x;
    const dy = enemy.y - target.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
        const moveX = (dx / dist) * speedMultiplier;
        const moveY = (dy / dist) * speedMultiplier;
        
        enemy.vx += moveX * config.walkAcceleration;
        enemy.vy += moveY * config.walkAcceleration;
    }
    
    applyEnemyMovement(enemy);
}

// 敌人环绕目标
function strafeAroundTarget(enemy, target) {
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
        // 垂直于目标方向移动
        const perpX = -dy / dist;
        const perpY = dx / dist;
        
        // 随机选择顺时针或逆时针
        const direction = enemy.strafeDirection || (Math.random() > 0.5 ? 1 : -1);
        enemy.strafeDirection = direction;
        
        enemy.vx += perpX * direction * config.walkAcceleration * 0.8;
        enemy.vy += perpY * direction * config.walkAcceleration * 0.8;
    }
    
    applyEnemyMovement(enemy);
}

// 敌人包围目标
function flankTarget(enemy, target) {
    const angleToTarget = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    
    // 尝试移动到目标侧面
    const flankAngle = angleToTarget + (enemy.dodgeDirection || 1) * Math.PI / 2;
    const targetDist = 200; // 包围距离
    
    const flankX = target.x + Math.cos(flankAngle) * targetDist;
    const flankY = target.y + Math.sin(flankAngle) * targetDist;
    
    const dx = flankX - enemy.x;
    const dy = flankY - enemy.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
        enemy.vx += (dx / dist) * config.walkAcceleration;
        enemy.vy += (dy / dist) * config.walkAcceleration;
    }
    
    applyEnemyMovement(enemy);
}

// 执行闪避 - 增强版
function performDodge(enemy) {
    // 根据威胁类型选择最优闪避方向
    let dodgeAngle = 0;
    let dodgeDist = 200; // 增加基础闪避距离
    let dodgeSpeed = 4; // 闪避速度倍数
    
    if (enemy.dodgeThreat) {
        const threatAngle = enemy.dodgeThreat.angle;
        
        if (enemy.dodgeThreat.type === 'bullet') {
            // 子弹威胁：垂直于子弹轨迹方向闪避
            const bullet = enemy.dodgeThreat.bullet;
            const distToLine = enemy.dodgeThreat.distToLine;
            
            // 计算子弹方向
            const bulletAngle = Math.atan2(bullet.vy, bullet.vx);
            
            // 垂直于子弹方向的两个选择
            const perpAngle1 = bulletAngle + Math.PI / 2;
            const perpAngle2 = bulletAngle - Math.PI / 2;
            
            // 动态计算闪避距离：只需要闪避到安全距离即可
            // 安全距离 = 子弹半径 + 敌人半径 + 安全余量(30px)
            const safeDistance = config.bulletRadius + enemy.radius + 30;
            // 需要移动的距离 = 安全距离 - 当前到轨迹的距离
            const needToMove = Math.max(safeDistance - distToLine, 40); // 最少移动40px
            dodgeDist = Math.min(needToMove + 15, 70); // 最多70px，避免闪避太远
            
            // 测试两个垂直方向，选择更安全的
            const test1X = enemy.x + Math.cos(perpAngle1) * dodgeDist;
            const test1Y = enemy.y + Math.sin(perpAngle1) * dodgeDist;
            const test2X = enemy.x + Math.cos(perpAngle2) * dodgeDist;
            const test2Y = enemy.y + Math.sin(perpAngle2) * dodgeDist;
            
            // 检查哪个方向更安全（在屏幕内 + 远离玩家）
            let bestAngle = perpAngle1;
            let bestScore = -Infinity;
            
            // 评估方向1
            if (test1X > enemy.radius && test1X < canvas.width - enemy.radius &&
                test1Y > enemy.radius && test1Y < canvas.height - enemy.radius) {
                const toPlayerDist = Math.hypot(test1X - player.x, test1Y - player.y);
                const toBorderDist = Math.min(test1X, canvas.width - test1X, test1Y, canvas.height - test1Y);
                const score1 = toPlayerDist + toBorderDist * 2; // 优先考虑边界距离
                bestScore = score1;
                bestAngle = perpAngle1;
            }
            
            // 评估方向2
            if (test2X > enemy.radius && test2X < canvas.width - enemy.radius &&
                test2Y > enemy.radius && test2Y < canvas.height - enemy.radius) {
                const toPlayerDist = Math.hypot(test2X - player.x, test2Y - player.y);
                const toBorderDist = Math.min(test2X, canvas.width - test2X, test2Y, canvas.height - test2Y);
                const score2 = toPlayerDist + toBorderDist * 2;
                if (score2 > bestScore) {
                    bestScore = score2;
                    bestAngle = perpAngle2;
                }
            }
            
            dodgeAngle = bestAngle;
            dodgeSpeed = 5; // 子弹威胁需要更快的闪避
            
        } else if (enemy.dodgeThreat.type === 'aim') {
            // 瞄准威胁：预判射击方向，提前闪避
            const toPlayerAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            const perpAngle1 = threatAngle + Math.PI / 2;
            const perpAngle2 = threatAngle - Math.PI / 2;
            
            // 选择远离玩家的垂直方向
            const diff1 = Math.abs(perpAngle1 - toPlayerAngle);
            const diff2 = Math.abs(perpAngle2 - toPlayerAngle);
            dodgeAngle = diff1 > diff2 ? perpAngle1 : perpAngle2;
            dodgeDist = 200;
            dodgeSpeed = 4.5;
            
        } else if (enemy.dodgeThreat.type === 'dash') {
            // 冲刺威胁：垂直于冲刺方向快速闪避
            const perpAngle1 = threatAngle + Math.PI / 2;
            const perpAngle2 = threatAngle - Math.PI / 2;
            
            // 选择更安全的方向（远离屏幕边界）
            const test1X = enemy.x + Math.cos(perpAngle1) * 250;
            const test1Y = enemy.y + Math.sin(perpAngle1) * 250;
            const test2X = enemy.x + Math.cos(perpAngle2) * 250;
            const test2Y = enemy.y + Math.sin(perpAngle2) * 250;
            
            const dist1ToBorder = Math.min(test1X, canvas.width - test1X, test1Y, canvas.height - test1Y);
            const dist2ToBorder = Math.min(test2X, canvas.width - test2X, test2Y, canvas.height - test2Y);
            
            dodgeAngle = dist1ToBorder > dist2ToBorder ? perpAngle1 : perpAngle2;
            dodgeDist = 250; // 冲刺威胁需要更大的闪避距离
            dodgeSpeed = 5.5; // 最快的闪避速度
        }
    } else {
        // 没有明确威胁，随机闪避
        dodgeAngle = Math.random() * Math.PI * 2;
        dodgeSpeed = 3;
    }
    
    // 计算闪避目标位置
    let targetX = enemy.x + Math.cos(dodgeAngle) * dodgeDist;
    let targetY = enemy.y + Math.sin(dodgeAngle) * dodgeDist;
    
    // 确保目标位置在屏幕内
    targetX = Math.max(enemy.radius + 10, Math.min(canvas.width - enemy.radius - 10, targetX));
    targetY = Math.max(enemy.radius + 10, Math.min(canvas.height - enemy.radius - 10, targetY));
    
    // 设置闪避目标和状态
    enemy.dodgeTarget = { x: targetX, y: targetY };
    enemy.dodging = true;
    enemy.dodgeStartTime = Date.now();
    
    // 清除威胁信息
    enemy.dodgeThreat = null;
}

// 执行冲刺闪避 - 使用剑光冲刺躲避子弹
function performDashDodge(enemy) {
    if (!enemy.dodgeThreat || enemy.dodgeThreat.type !== 'bullet') {
        // 如果没有子弹威胁，降级为普通闪避
        performDodge(enemy);
        return;
    }
    
    const bullet = enemy.dodgeThreat.bullet;
    
    // 计算子弹方向
    const bulletAngle = Math.atan2(bullet.vy, bullet.vx);
    
    // 垂直于子弹方向的两个选择
    const perpAngle1 = bulletAngle + Math.PI / 2;
    const perpAngle2 = bulletAngle - Math.PI / 2;
    
    // 冲刺距离：根据AI类型调整
    const dashDist = enemy.aiType === 'sniper' ? 200 :      // 远程型：200px
                     enemy.aiType === 'balanced' ? 160 :    // 平衡型：160px
                     120;                                    // 近战型：120px
    
    // 测试两个垂直方向，选择最优的冲刺方向
    let bestAngle = perpAngle1;
    let bestScore = -Infinity;
    
    // 测试方向1
    {
        const testAngle = perpAngle1;
        const testX = enemy.x + Math.cos(testAngle) * dashDist;
        const testY = enemy.y + Math.sin(testAngle) * dashDist;
        
        // 检查是否在屏幕内
        if (testX > enemy.radius + 20 && testX < canvas.width - enemy.radius - 20 &&
            testY > enemy.radius + 20 && testY < canvas.height - enemy.radius - 20) {
            
            // 计算这个方向的得分
            const toPlayerDist = Math.hypot(testX - player.x, testY - player.y);
            const toBorderDist = Math.min(testX, canvas.width - testX, testY, canvas.height - testY);
            const score = toPlayerDist + toBorderDist * 2;
            
            if (score > bestScore) {
                bestScore = score;
                bestAngle = testAngle;
            }
        }
    }
    
    // 测试方向2
    {
        const testAngle = perpAngle2;
        const testX = enemy.x + Math.cos(testAngle) * dashDist;
        const testY = enemy.y + Math.sin(testAngle) * dashDist;
        
        // 检查是否在屏幕内
        if (testX > enemy.radius + 20 && testX < canvas.width - enemy.radius - 20 &&
            testY > enemy.radius + 20 && testY < canvas.height - enemy.radius - 20) {
            
            // 计算这个方向的得分
            const toPlayerDist = Math.hypot(testX - player.x, testY - player.y);
            const toBorderDist = Math.min(testX, canvas.width - testX, testY, canvas.height - testY);
            const score = toPlayerDist + toBorderDist * 2;
            
            if (score > bestScore) {
                bestScore = score;
                bestAngle = testAngle;
            }
        }
    }
    
    // 计算冲刺目标位置
    const targetX = enemy.x + Math.cos(bestAngle) * dashDist;
    const targetY = enemy.y + Math.sin(bestAngle) * dashDist;
    
    // 确保目标位置在屏幕内
    const finalX = Math.max(enemy.radius + 20, Math.min(canvas.width - enemy.radius - 20, targetX));
    const finalY = Math.max(enemy.radius + 20, Math.min(canvas.height - enemy.radius - 20, targetY));
    
    // 开始冲刺（使用正常的冲刺机制）
    startEnemyCharge(enemy, finalX, finalY);
    
    // 清除威胁信息
    enemy.dodgeThreat = null;
    enemy.useDashDodge = false;
}

// 执行快速接近 - 使用剑光冲刺快速接近目标
function performDashApproach(enemy, target) {
    // 计算到目标的方向
    const toTargetAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    
    // 根据AI类型决定接近距离
    const approachDist = enemy.aiType === 'aggressive' ? 300 :  // 近战型：接近到300px
                        enemy.aiType === 'balanced' ? 350 :     // 平衡型：接近到350px
                        400;                                     // 远程型：接近到400px（保持距离）
    
    // 计算冲刺目标位置（不要冲到目标身上，保持一定距离）
    const distToTarget = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    const dashDist = Math.min(distToTarget - approachDist, 400); // 最多冲刺400像素
    
    if (dashDist < 100) {
        // 距离太近，不需要冲刺接近，改用普通移动
        moveTowardsTarget(enemy, target, 1.0);
        applyEnemyMovement(enemy);
        return;
    }
    
    // 计算冲刺目标位置
    let targetX = enemy.x + Math.cos(toTargetAngle) * dashDist;
    let targetY = enemy.y + Math.sin(toTargetAngle) * dashDist;
    
    // 确保目标位置在屏幕内
    targetX = Math.max(enemy.radius + 20, Math.min(canvas.width - enemy.radius - 20, targetX));
    targetY = Math.max(enemy.radius + 20, Math.min(canvas.height - enemy.radius - 20, targetY));
    
    // 开始冲刺（使用正常的冲刺机制）
    startEnemyCharge(enemy, targetX, targetY);
}

// 应用敌人移动
function applyEnemyMovement(enemy) {
    // 应用摩擦力
    enemy.vx *= config.walkFriction;
    enemy.vy *= config.walkFriction;
    
    // 限制最大速度
    const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    if (speed > config.walkMaxSpeed) {
        enemy.vx = (enemy.vx / speed) * config.walkMaxSpeed;
        enemy.vy = (enemy.vy / speed) * config.walkMaxSpeed;
    }
    
    // 应用速度
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    
    // 边界限制
    if (enemy.x < enemy.radius) {
        enemy.x = enemy.radius;
        enemy.vx = 0;
    }
    if (enemy.x > canvas.width - enemy.radius) {
        enemy.x = canvas.width - enemy.radius;
        enemy.vx = 0;
    }
    if (enemy.y < enemy.radius) {
        enemy.y = enemy.radius;
        enemy.vy = 0;
    }
    if (enemy.y > canvas.height - enemy.radius) {
        enemy.y = canvas.height - enemy.radius;
        enemy.vy = 0;
    }
}

// 敌人开始蓄力
function startEnemyCharge(enemy, targetX, targetY) {
    if (enemy.charging || enemy.dashing) return;
    
    enemy.charging = true;
    enemy.chargeStartTime = Date.now();
    enemy.chargeProgress = 0;
    
    // 限制冲刺距离
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance > config.maxDashDistance) {
        const angle = Math.atan2(dy, dx);
        enemy.targetX = enemy.x + Math.cos(angle) * config.maxDashDistance;
        enemy.targetY = enemy.y + Math.sin(angle) * config.maxDashDistance;
    } else {
        enemy.targetX = targetX;
        enemy.targetY = targetY;
    }
}

// 敌人开始冲刺
function startEnemyDash(enemy) {
    enemy.dashing = true;
    enemy.charging = false;
    enemy.chargeProgress = 0;
    enemy.dashStartX = enemy.x;
    enemy.dashStartY = enemy.y;
    enemy.dashEndX = enemy.targetX;
    enemy.dashEndY = enemy.targetY;
    enemy.dashProgress = 0;
    enemy.collisionBodies = [];
    enemy.trail = [];
    
    // 清除所有敌人的被此敌人击中的标记
    enemies.forEach(e => {
        if (e.hitByEnemyDash === enemy) {
            e.hitByEnemyDash = null;
        }
    });
    
    createDashParticles(enemy.x, enemy.y, 20);
}

// 更新敌人冲刺
function updateEnemyDash(enemy) {
    if (!enemy.dashing) return;
    
    const timeScale = getTimeScale();
    enemy.dashProgress += config.dashSpeed * timeScale;
    
    if (enemy.dashProgress >= 1) {
        enemy.dashProgress = 1;
        enemy.x = enemy.dashEndX;
        enemy.y = enemy.dashEndY;
        enemy.dashing = false;
        createDashParticles(enemy.x, enemy.y, 30);
    } else {
        const eased = easeInOutQuint(enemy.dashProgress);
        enemy.x = enemy.dashStartX + (enemy.dashEndX - enemy.dashStartX) * eased;
        enemy.y = enemy.dashStartY + (enemy.dashEndY - enemy.dashStartY) * eased;
        
        enemy.trail.push({ x: enemy.x, y: enemy.y, alpha: 1 });
        if (enemy.trail.length > config.trailLength) {
            enemy.trail.shift();
        }
        
        enemy.collisionBodies.push({
            x: enemy.x,
            y: enemy.y,
            radius: enemy.radius * 0.8
        });
        
        if (Math.random() < 0.5) {
            createDashParticles(enemy.x, enemy.y, 2);
        }
        
        // 检测与玩家的碰撞
        checkEnemyDashCollision(enemy);
    }
    
    // 更新拖尾透明度
    enemy.trail.forEach((t, i) => {
        t.alpha = i / enemy.trail.length;
    });
}

// 检测敌人冲刺与玩家和其他敌人碰撞
function checkEnemyDashCollision(enemy) {
    const lineStartX = enemy.dashStartX;
    const lineStartY = enemy.dashStartY;
    const lineEndX = enemy.x; // 使用当前位置而不是目标位置
    const lineEndY = enemy.y;
    
    const lineDx = lineEndX - lineStartX;
    const lineDy = lineEndY - lineStartY;
    const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
    
    if (lineLength === 0) return;
    
    // 检测与玩家的碰撞
    if (!player.dying) {
        const toDx = player.x - lineStartX;
        const toDy = player.y - lineStartY;
        
        let t = (toDx * lineDx + toDy * lineDy) / (lineLength * lineLength);
        t = Math.max(0, Math.min(1, t));
        
        const closestX = lineStartX + t * lineDx;
        const closestY = lineStartY + t * lineDy;
        
        const distX = player.x - closestX;
        const distY = player.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        if (dist < player.radius + enemy.radius * 0.8) {
            killPlayer();
        }
    }
    
    // 检测与其他敌人的碰撞
    for (let i = 0; i < enemies.length; i++) {
        const otherEnemy = enemies[i];
        
        // 跳过自己、已死亡的敌人和已被当前冲刺击中的敌人
        if (otherEnemy === enemy || otherEnemy.dying || otherEnemy.hitByEnemyDash === enemy) continue;
        
        const toDx = otherEnemy.x - lineStartX;
        const toDy = otherEnemy.y - lineStartY;
        
        let t = (toDx * lineDx + toDy * lineDy) / (lineLength * lineLength);
        t = Math.max(0, Math.min(1, t));
        
        const closestX = lineStartX + t * lineDx;
        const closestY = lineStartY + t * lineDy;
        
        const distX = otherEnemy.x - closestX;
        const distY = otherEnemy.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        if (dist < otherEnemy.radius + enemy.radius * 0.8) {
            // 标记敌人已被当前冲刺击中
            otherEnemy.hitByEnemyDash = enemy;
            
            // 其他敌人被击中
            const dashAngle = Math.atan2(enemy.dashEndY - enemy.dashStartY, enemy.dashEndX - enemy.dashStartX);
            
            otherEnemy.dying = true;
            otherEnemy.deathPhase = 'dissolve';
            otherEnemy.dissolveStartTime = Date.now();
            
            createSlashSplashParticles(otherEnemy.x, otherEnemy.y, 120, dashAngle);
            createImpactParticles(otherEnemy.x, otherEnemy.y, 40, dashAngle);
            createInkDissolveParticles(otherEnemy.x, otherEnemy.y, 300);
            
            console.log('Enemy hit by another enemy dash!');
        }
    }
}

// 敌人开始瞄准
function startEnemyAim(enemy, targetX, targetY) {
    const now = Date.now();
    
    if (enemy.aiming || enemy.dashing || enemy.charging) return;
    if (enemy.bullets <= 0) return;
    // 检查冷却时间
    if (now - enemy.lastShootTime < config.shootCooldown) return;
    
    enemy.aiming = true;
    enemy.aimStartTime = Date.now();
    enemy.aimProgress = 0;
    enemy.aimTargetX = targetX;
    enemy.aimTargetY = targetY;
}

// 敌人射击
function enemyShoot(enemy, targetX, targetY) {
    const now = Date.now();
    
    // 检查冷却时间
    if (now - enemy.lastShootTime < config.shootCooldown) return;
    if (enemy.bullets <= 0 || enemy.dashing) return;
    
    enemy.bullets--;
    enemy.shooting = true;
    enemy.shootStartTime = now;
    enemy.lastShootTime = now;
    
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const angle = Math.atan2(dy, dx);
    enemy.aimAngle = angle;
    
    bullets.push({
        x: enemy.x + Math.cos(angle) * enemy.radius,
        y: enemy.y + Math.sin(angle) * enemy.radius,
        vx: Math.cos(angle) * config.bulletSpeed,
        vy: Math.sin(angle) * config.bulletSpeed,
        angle: angle,
        life: 1,
        isEnemyBullet: true,
        owner: enemy // 记录子弹的发射者
    });
    
    createDashParticles(enemy.x, enemy.y, 10);
}

// 闪避冲刺
function dodgeDash(enemy) {
    // 向垂直于玩家方向冲刺
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        const dashDist = 200;
        const targetX = enemy.x + perpX * direction * dashDist;
        const targetY = enemy.y + perpY * direction * dashDist;
        
        startEnemyCharge(enemy, targetX, targetY);
    }
}

// 玩家死亡
function killPlayer() {
    if (player.dying) return;
    
    player.dying = true;
    player.deathPhase = 'dissolve';
    player.dissolveStartTime = Date.now();
    player.charging = false;
    player.dashing = false;
    
    // 计算击中方向（如果有的话）
    let deathAngle = 0;
    
    // 创建死亡粒子效果
    createSlashSplashParticles(player.x, player.y, 120, deathAngle);
    createImpactParticles(player.x, player.y, 40, deathAngle);
    createInkDissolveParticles(player.x, player.y, 300);
    
    console.log('Player died! Game Over!');
}

// 重启游戏
function restartGame() {
    // 重置玩家状态 - 位于屏幕中央偏左
    player.x = canvas.width / 2 - 150;
    player.y = canvas.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.charging = false;
    player.chargeStartTime = 0;
    player.chargeProgress = 0;
    player.targetX = 0;
    player.targetY = 0;
    player.dashing = false;
    player.dashStartX = 0;
    player.dashStartY = 0;
    player.dashEndX = 0;
    player.dashEndY = 0;
    player.dashProgress = 0;
    player.collisionBodies = [];
    player.trail = [];
    player.bullets = 3;
    player.shooting = false;
    player.shootStartTime = 0;
    player.aimAngle = 0;
    player.lastShootTime = 0;
    player.aiming = false;
    player.aimStartTime = 0;
    player.aimProgress = 0;
    player.aimTargetX = 0;
    player.aimTargetY = 0;
    player.dying = false;
    player.deathPhase = null;
    player.dissolveStartTime = 0;
    player.dissolveProgress = 0;
    
    // 重置游戏状态
    gameOver = false;
    gameStarted = false;
    countdownStartTime = Date.now();
    countdownValue = 3;
    
    // 重置波次和积分
    currentWave = 1;
    enemiesKilledThisWave = 0;
    totalScore = 0;
    
    // 清空敌人
    enemies.length = 0;
    
    // 清空子弹
    bullets.length = 0;
    
    // 清空粒子
    particles.length = 0;
    
    // 重新初始化背景粒子
    initBgParticles();
    
    // 创建第一波敌人（只有一个）- 位于屏幕中央偏右
    const aiTypes = ['aggressive', 'sniper', 'balanced'];
    const randomType = aiTypes[Math.floor(Math.random() * aiTypes.length)];
    createEnemy(canvas.width / 2 + 150, canvas.height / 2, randomType);
    
    console.log('Game restarted!');
}

// 触发慢动作效果
function triggerSlowMotion() {
    slowMotionActive = true;
    slowMotionStartTime = Date.now();
}

// 敌人被击杀时调用
function onEnemyKilled() {
    // 增加积分
    totalScore += scorePerKill;
    enemiesKilledThisWave++;
}

// 波次完成检查（每帧调用）
let waveCompletionChecked = false; // 防止重复触发

function checkWaveCompletion() {
    // 如果游戏未开始或已结束，不检查
    if (!gameStarted || gameOver) return;
    
    // 检查是否所有敌人都已死亡
    const aliveEnemies = enemies.filter(e => !e.dying).length;
    
    if (aliveEnemies === 0 && enemies.length > 0 && !waveCompletionChecked) {
        // 标记已检查，防止重复触发
        waveCompletionChecked = true;
        
        // 延迟生成下一波
        setTimeout(() => {
            spawnNextWave();
            waveCompletionChecked = false; // 重置标记
        }, 2000);
    }
}

// 生成下一波敌人
function spawnNextWave() {
    currentWave++;
    enemiesKilledThisWave = 0;
    
    // 生成敌人数量 = 当前波次
    const enemyCount = currentWave;
    const aiTypes = ['aggressive', 'sniper', 'balanced'];
    
    for (let i = 0; i < enemyCount; i++) {
        // 从屏幕边缘随机位置生成
        const edge = Math.floor(Math.random() * 4); // 0=上, 1=右, 2=下, 3=左
        let x, y;
        
        switch(edge) {
            case 0: // 上
                x = Math.random() * canvas.width;
                y = -50;
                break;
            case 1: // 右
                x = canvas.width + 50;
                y = Math.random() * canvas.height;
                break;
            case 2: // 下
                x = Math.random() * canvas.width;
                y = canvas.height + 50;
                break;
            case 3: // 左
                x = -50;
                y = Math.random() * canvas.height;
                break;
        }
        
        // 随机AI类型
        const aiType = aiTypes[Math.floor(Math.random() * aiTypes.length)];
        createEnemy(x, y, aiType);
    }
}

// 更新慢动作状态
function updateSlowMotion() {
    if (slowMotionActive) {
        const elapsed = Date.now() - slowMotionStartTime;
        if (elapsed >= slowMotionDuration) {
            slowMotionActive = false;
        }
    }
}

// 获取当前时间缩放因子
function getTimeScale() {
    return slowMotionActive ? slowMotionFactor : 1.0;
}

// 检测子弹与剑光轨迹的碰撞
function checkBulletDashCollision(bullet, dasher) {
    // 计算子弹到剑光直线的距离
    const lineStartX = dasher.dashStartX;
    const lineStartY = dasher.dashStartY;
    const lineEndX = dasher.x;
    const lineEndY = dasher.y;
    
    const lineDx = lineEndX - lineStartX;
    const lineDy = lineEndY - lineStartY;
    const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
    
    if (lineLength === 0) return false;
    
    const toDx = bullet.x - lineStartX;
    const toDy = bullet.y - lineStartY;
    
    let t = (toDx * lineDx + toDy * lineDy) / (lineLength * lineLength);
    t = Math.max(0, Math.min(1, t));
    
    const closestX = lineStartX + t * lineDx;
    const closestY = lineStartY + t * lineDy;
    
    const distX = bullet.x - closestX;
    const distY = bullet.y - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);
    
    // 判断是否在剑光范围内（使用较宽的碰撞范围）
    return dist < dasher.radius * 1.2;
}

// 反弹子弹
function reflectBullet(bullet, dasher) {
    // 计算剑光方向
    const dashDx = dasher.x - dasher.dashStartX;
    const dashDy = dasher.y - dasher.dashStartY;
    const dashLength = Math.sqrt(dashDx * dashDx + dashDy * dashDy);
    
    if (dashLength === 0) return;
    
    // 剑光方向的单位向量
    const dashNormX = dashDx / dashLength;
    const dashNormY = dashDy / dashLength;
    
    // 剑光的法线（垂直方向）
    const normalX = -dashNormY;
    const normalY = dashNormX;
    
    // 子弹速度向量
    const bulletSpeed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
    const bulletDirX = bullet.vx / bulletSpeed;
    const bulletDirY = bullet.vy / bulletSpeed;
    
    // 计算反射向量
    // reflect = velocity - 2 * (velocity · normal) * normal
    const dotProduct = bulletDirX * normalX + bulletDirY * normalY;
    const reflectDirX = bulletDirX - 2 * dotProduct * normalX;
    const reflectDirY = bulletDirY - 2 * dotProduct * normalY;
    
    // 应用反射速度（保持原速度）
    bullet.vx = reflectDirX * bulletSpeed;
    bullet.vy = reflectDirY * bulletSpeed;
    bullet.angle = Math.atan2(bullet.vy, bullet.vx);
}

// 初始化背景粒子
initBgParticles();

// 开始界面粒子系统
const startParticlesCanvas = document.getElementById('startParticles');
const startParticlesCtx = startParticlesCanvas ? startParticlesCanvas.getContext('2d') : null;
const startParticles = [];

if (startParticlesCanvas) {
    startParticlesCanvas.width = window.innerWidth;
    startParticlesCanvas.height = window.innerHeight;
    
    // 初始化开始界面粒子（1000个）
    for (let i = 0; i < 1000; i++) {
        startParticles.push({
            x: Math.random() * startParticlesCanvas.width,
            y: Math.random() * startParticlesCanvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 6 + 2, // 增大尺寸：2-8px
            opacity: Math.random() * 0.15 + 0.05, // 降低透明度以适应白色背景
            color: Math.random() > 0.7 ? 'blood' : 'normal' // 30%红色血液粒子
        });
    }
    
    // 开始界面粒子动画循环
    function startParticlesLoop() {
        if (!startParticlesCanvas || !startParticlesCtx) return;
        if (gameInitialized) return; // 游戏开始后停止
        
        startParticlesCtx.clearRect(0, 0, startParticlesCanvas.width, startParticlesCanvas.height);
        
        for (let i = 0; i < startParticles.length; i++) {
            const p = startParticles[i];
            
            // 更新位置
            p.x += p.vx;
            p.y += p.vy;
            
            // 边界处理
            if (p.x < -10) p.x = startParticlesCanvas.width + 10;
            if (p.x > startParticlesCanvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = startParticlesCanvas.height + 10;
            if (p.y > startParticlesCanvas.height + 10) p.y = -10;
            
            // 绘制粒子
            if (p.color === 'blood') {
                // 红色血液粒子（更深的红色）
                startParticlesCtx.fillStyle = `rgba(180, 20, 20, ${p.opacity})`;
            } else {
                // 普通深灰色粒子（在白色背景上更明显）
                startParticlesCtx.fillStyle = `rgba(60, 60, 70, ${p.opacity})`;
            }
            
            startParticlesCtx.beginPath();
            startParticlesCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            startParticlesCtx.fill();
        }
        
        requestAnimationFrame(startParticlesLoop);
    }
    
    startParticlesLoop();
}

// 开始游戏循环（但游戏还未开始）
gameLoop();

// 开始游戏函数（从开始界面调用）
function startGame() {
    if (gameInitialized) return; // 防止重复初始化
    
    gameInitialized = true;
    
    // 隐藏开始界面
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.classList.add('hidden');
    }
    
    // 创建初始敌人（第一波只有一个）- 位于屏幕中央偏右
    const aiTypes = ['aggressive', 'sniper', 'balanced'];
    const randomType = aiTypes[Math.floor(Math.random() * aiTypes.length)];
    createEnemy(canvas.width / 2 + 150, canvas.height / 2, randomType);
    
    // 开始倒计时
    countdownStartTime = Date.now();
}

// 将startGame函数暴露到全局，供HTML调用
window.startGame = startGame;
