const player = document.getElementById('player');
const enemy = document.getElementById('enemy');
const attack = document.getElementById('attack');
const shield = document.getElementById("shield");

let x = 300; //left me distance 
let y = 220; //top se girane ki height 
let velocityY = 0;
let isJumping = false;
let isReflected = false;
let gameOver = false;
let lastShieldDirection = "right"; // default direction
let blastDirection = null; // fixed direction at fire time
let blastInProgress = false; // ✅ Declare it globally

const gravity = 0.8;
const groundY = setResponsiveGround(); // player ka position 
let moveInterval = null;
let shieldDirectionLocked = false;
let gameStarted = false; // game lock default 

// ✅ Position Update
function updatePosition() {
  player.style.left = x + 'px';
  player.style.top = y + 'px';
  
    // Make camera (viewport) follow the player
  const container = document.getElementById("game-container");
  const world = document.getElementById("game-world");
  const scrollX = Math.max(0, x - window.innerWidth / 2 + 40); // center camera on player
  
  world.style.left = -scrollX + 'px';
}


// ✅ Movement
function move(direction) {
  
  if (!gameStarted) return;
  const step = 10;
  if (direction === 'left') x = Math.max(0, x - step);
  if (direction === 'right') x = Math.min(560, x + step);
  updatePosition();
  
  shieldDirectionLocked = false;
}

// ✅ Jumping
function jump() {
  if (!gameStarted) return;
  if (!isJumping) {
    velocityY = -15;
    isJumping = true;
  }
}

// Screen size check
function setResponsiveGround() {
  const screenWidth = window.innerWidth;

  // Mobile screen ke liye
  if (screenWidth <= 768) {
    return 360;
  }

  // Desktop screen ke liye
  return 1040;
}

// ✅ Gravity
function applyGravity() {
  velocityY += gravity;
  y += velocityY;
  if (y >= groundY) {
    y = groundY;
    velocityY = 0;
    isJumping = false;
  }
  updatePosition();
  requestAnimationFrame(applyGravity);
}
applyGravity();

// ✅ Intersection Checker
function intersect(r1, r2) {
  return !(r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top);
}

// ✅ Blast
function createBlast(x, y) {
  const blast = document.createElement('div');
  blast.classList.add('blast');
  blast.style.left = x + 'px';
  blast.style.top = y + 'px';
  document.body.appendChild(blast);
  setTimeout(() => blast.remove(), 300);
}

// ✅ Collision Check
function checkAttackCollision(posX, posY) {
  const attackBox = attack.getBoundingClientRect();
  const playerBox = player.getBoundingClientRect();
  const shieldBox = shield.getBoundingClientRect();
  
  if (intersect(attackBox, shieldBox) && !isReflected) {
    isReflected = true;
    return "reflected";
  }
  
  if (intersect(attackBox, playerBox) && !isReflected) {
  createBlast(attackBox.left, attackBox.top);
  const msg = document.createElement("h1");
  msg.innerText = "💀 Game Over!";
  msg.style.color = "red";
  document.body.appendChild(msg);
  
  gameOver = true;
  
  document.getElementById("bg-music").pause(); //background music end
  
  // 🔊 Play game over sound
  const gameoverSound = document          .getElementById("gameover-sound");
  gameoverSound.play();
  
  // Stop attack loop
  if (attackInterval) {
    clearInterval(attackInterval);
    attackInterval = null;
  }
  
  // Show Restart button
  document.getElementById('restartBtn').style.display = 'inline-block';
  
  return "gameover";
}
  
  return "none";
}

// ✅ Shield Logic
function moveShieldTowardAttack(posX, posY) {
  if (shieldDirectionLocked || isReflected || attack.style.display === 'none') return;
  
  const playerRect = player.getBoundingClientRect();
  const playerCenterX = playerRect.left + playerRect.width / 2;
  const playerCenterY = playerRect.top + playerRect.height / 2;
  
  const dx = posX - playerCenterX;
  const dy = posY - playerCenterY;
  
  shield.style.left = '';
  shield.style.top = '';
  shield.style.width = '';
  shield.style.height = '';
  
  if (Math.abs(dx) > Math.abs(dy)) {
    shield.style.width = '10px';
    shield.style.height = '40px';
    shield.style.top = '0px';
    shield.style.left = dx < 0 ? '-10px' : '40px';
  } else {
    shield.style.width = '40px';
    shield.style.height = '10px';
    shield.style.left = '0px';
    shield.style.top = dy < 0 ? '-10px' : '40px';
  }
  
  // Lock after 1st set
  shieldDirectionLocked = true;
}

// ✅ Attack Launching
function launchAttack() {
  if (gameOver) return;
  
  shieldDirectionLocked = false;
  
  const enemyX = Math.floor(Math.random() * 570);
  const enemyY = Math.floor(Math.random() * 200);
  enemy.style.left = enemyX + 'px';
  enemy.style.top = enemyY + 'px';
  
  attack.style.display = 'block';
  attack.style.left = enemyX + 10 + 'px';
  attack.style.top = enemyY + 10 + 'px';
  
  let posX = enemyX + 10;
  let posY = enemyY + 10;
  isReflected = false;
  
  const interval = setInterval(() => {
    if (gameOver) {
      clearInterval(interval);
      return;
    }
    
    let targetX, targetY;
    if (!isReflected) {
      targetX = x + 20;
      targetY = y + 20;
    } else {
      const enemyRect = enemy.getBoundingClientRect();
      targetX = enemyRect.left + enemyRect.width / 2;
      targetY = enemyRect.top + enemyRect.height / 2;
    }
    
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (!isReflected && attack.style.display !== 'none') {
      moveShieldTowardAttack(posX, posY);
      //shieldDirectionLocked = false;
      }
    
    const result = checkAttackCollision(posX, posY);
    if (result === "gameover") {
      clearInterval(interval);
      return;
    }
    if (result === "reflected") return;
    
    if (isReflected && dist < 10) {
     // createBlast(posX, posY);
      attack.style.display = 'none';
      clearInterval(interval);
      return;
    }
    
    posX += dx / 10;
    posY += dy / 10;
    attack.style.left = posX + 'px';
    attack.style.top = posY + 'px';
  }, 30);
}

// ✅ Button Movement for Left, Right, Jump
const leftBtn = document.querySelector('button:nth-child(1)');
const jumpBtn = document.querySelector('button:nth-child(2)');
const rightBtn = document.querySelector('button:nth-child(3)');

function startMove(direction) {
  if (moveInterval) return;
  moveInterval = setInterval(() => move(direction), 100);
}

function stopMove() {
  clearInterval(moveInterval);
  moveInterval = null;
}

leftBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  startMove('left');
});
leftBtn.addEventListener('touchend', stopMove);
leftBtn.addEventListener('mousedown', () => startMove('left'));
leftBtn.addEventListener('mouseup', stopMove);
leftBtn.addEventListener('click', () => move('left')); // single click

rightBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  startMove('right');
});
rightBtn.addEventListener('touchend', stopMove);
rightBtn.addEventListener('mousedown', () => startMove('right'));
rightBtn.addEventListener('mouseup', stopMove);
rightBtn.addEventListener('click', () => move('right')); // single click

jumpBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  jump();
});
jumpBtn.addEventListener('click', jump); // single click
let attackInterval = null;

function startGame() {
  if (gameOver || attackInterval) return;
  
  gameStarted = true;
  
  // 🔊 Play background music
  const bgMusic = document.getElementById("bg-music");
  if (bgMusic.paused) {
    bgMusic.play().catch(e => console.log("Autoplay blocked:", e));
  }

  // Hide start button, show nothing (restart only visible on gameover)
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('restartBtn').style.display = 'none';

  // Start attacks
  attackInterval = setInterval(launchAttack, 1500);
}

function restartGame() {
  gameStarted = false;
  // Reset all game states
  x = 100;
  y = 320;
  velocityY = 0;
  isJumping = false;
  isReflected = false;
  gameOver = false;

  updatePosition();

  // Hide attack and reposition enemy
  attack.style.display = 'none';
  enemy.style.display = 'block'; // after enemy hit 🎯 enemy will visible 
  enemy.style.left = '0px';
  enemy.style.top = '0px';

  // Remove any old "Game Over" message
  const oldMsg = document.querySelector('h1');
  if (oldMsg) oldMsg.remove();

  // Clear previous attack interval
  if (attackInterval) {
    clearInterval(attackInterval);
    attackInterval = null;
  }

  // Show start button again
  document.getElementById('startBtn').style.display = 'inline-block';
  document.getElementById('restartBtn').style.display = 'none';
}
function setShield(direction) {
  if (!gameStarted || gameOver) return;
  
  lastShieldDirection = direction;  // ✅ Store direction for blast

  // Reset shield position
  shield.style.left = '';
  shield.style.top = '';
  shield.style.width = '';
  shield.style.height = '';

  shieldDirectionLocked = true; // Lock after setting manually

  if (direction === 'left') {
    shield.style.width = '10px';
    shield.style.height = '40px';
    shield.style.left = '-10px';
    shield.style.top = '0px';
  } else if (direction === 'right') {
    shield.style.width = '10px';
    shield.style.height = '40px';
    shield.style.left = '40px';
    shield.style.top = '0px';
  } else if (direction === 'up') {
    shield.style.width = '40px';
    shield.style.height = '10px';
    shield.style.top = '-10px';
    shield.style.left = '0px';
  } else if (direction === 'down') {
    shield.style.width = '40px';
    shield.style.height = '10px';
    shield.style.top = '40px';
    shield.style.left = '0px';
  }
  // ✅ Only fire if no blast in progress
  if (!blastInProgress) {
    blastDirection = direction; // 🔒 Lock blast direction
    blastInProgress = true;
  // 🔥 Fire when shield is set
  fireBlast();
}

function fireBlast() {
  const blast = document.createElement("div");
  blast.classList.add("blast");
  
  let blastX = x + 20;
  let blastY = y + 20;
  
  blast.style.left = blastX + "px";
  blast.style.top = blastY + "px";
  document.getElementById("game-world").appendChild(blast);
  
  const speed = 10;
  
  const interval = setInterval(() => {
    // Move blast based on shield direction
    switch (blastDirection) {
      case 'left':
        blastX -= speed;
        break;
      case 'right':
        blastX += speed;
        break;
      case 'up':
        blastY -= speed;
        break;
      case 'down':
        blastY += speed;
        break;
    }
    
    blast.style.left = blastX + "px";
    blast.style.top = blastY + "px";
    
    // ✅ Check enemy collision
    const blastBox = blast.getBoundingClientRect();
    const enemyBox = enemy.getBoundingClientRect();
    if (intersect(blastBox, enemyBox)) {
      blast.remove();
      enemy.style.display = 'none'; // 🧨 Hide enemy
      
      // Optional: Explosion effect
      createBlast(enemyBox.left, enemyBox.top);
      
      gameOver = true;
      
      document.getElementById('restartBtn').style.display = 'inline-block';
      
      const msg = document.createElement("h1");
      msg.innerText = "🏆 Victory!";
      msg.style.color = "green";
      document.body.appendChild(msg);
  
      clearInterval(interval);
      blastInProgress = false;
      return;
    }
    
    // ✅ Blast out of screen
    if (
      blastX < 0 || blastX > window.innerWidth ||
      blastY < 0 || blastY > window.innerHeight
    ) {
      blast.remove();
      clearInterval(interval);
      blastInProgress = false;
    }
    
  }, 20);
}

// ✅ Keyboard support
document.addEventListener("keydown", (e) => {
  if (!gameStarted || gameOver) return;

  switch (e.key.toLowerCase()) {
    case "arrowleft":
    case "a":
      move("left");
      break;
    case "arrowright":
    case "d":
      move("right");
      break;
    case "arrowup":
    case "w":
      jump();
      break;
    case "j":
      setShield("left");
      break;
    case "l":
      setShield("right");
      break;
    case "i":
      setShield("up");
      break;
    case "k":
      setShield("down");
      break;
  }
})};
