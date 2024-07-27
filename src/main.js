const app = new PIXI.Application({
  width: 1280,
  height: 720,
  backgroundColor: 0x0f0058
});
document.body.appendChild(app.view);

const shipTexture = PIXI.Texture.from('images/spaceship.png');
const asteroidTexture = PIXI.Texture.from('images/asteroid.png');
const bossTexture = PIXI.Texture.from('images/boss.webp');

const ship = new PIXI.Sprite(shipTexture);
ship.width = 80;
ship.height = 100;
ship.anchor.set(0.5);
ship.x = app.screen.width / 2;
ship.y = app.screen.height - 70;
app.stage.addChild(ship);

const boss = new PIXI.Sprite(bossTexture);
boss.width = 250;
boss.height = 200;
boss.anchor.set(0.5);
boss.x = app.screen.width / 2;
boss.y = 160;
boss.visible = false;

const bullets = [];
let maxBullets = 10;
const asteroids = [];
const maxAsteroids = 10;
let totalAsteroids = 0;
let remainingShots = maxBullets;

let bossShots = [];
let bossShotInterval;
let timeRemaining = 60;
let gameOver = false;
let timerInterval;

let bossState = 'moving';
const idleDuration = 4000;
const moveDuration = 4000;
let stateStartTime = 0;
let moveDirection = 1;

let bossHP = 4; 
const maxBossHP = 4;
const hpBarWidth = 200;
const hpBarHeight = 10;
const hpBarPadding = 10;
const hpBarBackgroundColor = 0x000000;
const hpBarFillColor = 0xff0000;

window.addEventListener('keydown', (e) => {
  if (gameOver) return;
  if (e.key === 'ArrowLeft') {
    ship.x -= 20;
  } else if (e.key === 'ArrowRight') {
    ship.x += 20;
  } else if (e.key === ' ' && bullets.length < maxBullets && remainingShots > 0) {
    maxBullets--;
    shootBullet();
    updateRemainingShotsDisplay();
  }
  ship.x = Math.max(ship.width / 2, Math.min(app.screen.width - ship.width / 2, ship.x));
});

function shootBullet() {
  const bullet = new PIXI.Graphics();
  bullet.beginFill(0x00ff00);
  bullet.drawRect(-5, -10, 10, 20);
  bullet.endFill();
  bullet.x = ship.x;
  bullet.y = ship.y - ship.height / 2;
  bullet.speed = 15;
  app.stage.addChild(bullet);
  bullets.push(bullet);
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.y -= bullet.speed;
    if (bullet.y < 0) {
      app.stage.removeChild(bullet);
      bullets.splice(i, 1); 
      remainingShots--;
      updateRemainingShotsDisplay();
      checkGameStatus();
    }
  }
}

function initializeAsteroids() {
  for (let i = 0; i < maxAsteroids; i++) {
    createAsteroid();
  }
}

function isOverlapping(newAsteroid, existingAsteroids) {
  const newBounds = newAsteroid.getBounds();
  return existingAsteroids.some((asteroid) => {
    const bounds = asteroid.getBounds();
    return newBounds.x < bounds.x + bounds.width &&
           newBounds.x + newBounds.width > bounds.x &&
           newBounds.y < bounds.y + bounds.height &&
           newBounds.y + newBounds.height > bounds.y;
  });
}

function createAsteroid() {
  let asteroid;
  let isValidPosition = false;

  while (!isValidPosition) {
    asteroid = new PIXI.Sprite(asteroidTexture);
    asteroid.width = 70;
    asteroid.height = 70;
    asteroid.anchor.set(0.5);
    asteroid.x = Math.random() * (app.screen.width - asteroid.width) + asteroid.width / 2;
    asteroid.y = Math.random() * (app.screen.height - 250 - asteroid.height) + asteroid.height / 2;

    isValidPosition = !isOverlapping(asteroid, asteroids);
  }

  app.stage.addChild(asteroid);
  asteroids.push(asteroid);
  totalAsteroids++;
}

function hitTestRectangle(obj1, obj2) {
  const obj1Bounds = obj1.getBounds();
  const obj2Bounds = obj2.getBounds();

  const obj1Center = {
    x: obj1Bounds.x + obj1Bounds.width / 2,
    y: obj1Bounds.y + obj1Bounds.height / 2
  };
  const obj2Center = {
    x: obj2Bounds.x + obj2Bounds.width / 2,
    y: obj2Bounds.y + obj2Bounds.height / 2
  };

  const dx = obj1Center.x - obj2Center.x;
  const dy = obj1Center.y - obj2Center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const radius1 = Math.min(obj1Bounds.width, obj1Bounds.height) / 2;
  const radius2 = Math.min(obj2Bounds.width, obj2Bounds.height) / 2;

  return distance < (radius1 + radius2);
}

function checkCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    for (let j = asteroids.length - 1; j >= 0; j--) {
      const asteroid = asteroids[j];

      if (hitTestRectangle(bullet, asteroid)) {
        app.stage.removeChild(bullet);
        app.stage.removeChild(asteroid);
        bullets.splice(i, 1);
        asteroids.splice(j, 1);
        remainingShots--;
        totalAsteroids--;
        updateRemainingShotsDisplay();
        checkGameStatus();
        break;
      }
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    for (let j = bossShots.length - 1; j >= 0; j--) {
      const bossBullet = bossShots[j];

      if (hitTestRectangle(bullet, bossBullet)) {
        app.stage.removeChild(bullet);
        app.stage.removeChild(bossBullet);
        bullets.splice(i, 1);
        bossShots.splice(j, 1);
        remainingShots--;
        updateRemainingShotsDisplay();
        checkGameStatus();
        break;
      }
    }
  }
}


let finalBossMessage;

function displayFinalBossMessage() {
  finalBossMessage = new PIXI.Text('FINAL BOSS!', {
    fontFamily: 'Arial',
    fontSize: 72,
    fill: 0xffffff,
    align: 'center'
  });
  finalBossMessage.anchor.set(0.5);
  finalBossMessage.x = app.screen.width / 2;
  finalBossMessage.y = app.screen.height / 2;
  app.stage.addChild(finalBossMessage);

  setTimeout(() => {
    app.stage.removeChild(finalBossMessage);
    startFinalBoss();
  }, 3000);
}

function resetGame() {
  timeRemaining = 60;
  maxBullets = 10;
  remainingShots = maxBullets;
  updateRemainingShotsDisplay();
  updateTimer();
}

function startFinalBoss() {
  resetGame();

  boss.visible = true;
  bossHP = 4;
  updateHPBar();

  app.ticker.add(updateBoss);
  app.ticker.add(updateBossBullets);
}

function showBoss() {
  app.stage.addChild(boss);
  app.ticker.add(checkBossCollisions);
  app.stage.addChild(hpBarContainer);
  startBossShooting();
}

function updateBoss() {
  const currentTime = performance.now();
  const elapsedTime = currentTime - stateStartTime;
  
  if (bossState === 'idle') {
    if (elapsedTime > idleDuration) {
      bossState = 'moving';
      stateStartTime = currentTime;
      
      moveDirection = Math.random() < 0.5 ? 1 : -1;
    }
  } else if (bossState === 'moving') {
    if (elapsedTime > moveDuration) {
      bossState = 'idle';
      stateStartTime = currentTime;
    } else {
      boss.x += moveDirection * 2;

      if (boss.x - boss.width / 2 < 0) {
        boss.x = boss.width / 2;
        moveDirection = 1;
      } else if (boss.x + boss.width / 2 > app.screen.width) {
        boss.x = app.screen.width - boss.width / 2;
        moveDirection = -1;
      }
    }
  }
  positionHPBar();
}

function startBossShooting() {
  setInterval(shootBossBullet, 2000)
}

function checkBossCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    if (hitTestRectangle(bullet, boss)) {
      app.stage.removeChild(bullet);
      bullets.splice(i, 1);
      bossHP -= 1;
      remainingShots--;
      checkGameStatus();
      updateHPBar();
      updateRemainingShotsDisplay();
      if (bossHP <= 0) {
        app.stage.removeChild(boss);
        app.stage.removeChild(hpBarContainer);
        displayWinMessage();
      }
      break;
    }
  }

  for (let i = bossShots.length - 1; i >= 0; i--) {
    const bossShot = bossShots[i];
    bossShot.y += bossShot.speed;
    if (hitTestRectangle(bossShot, ship)) {
      displayLoseMessage();
    } else if (bossShot.y > app.screen.height) {
      app.stage.removeChild(bossShot);
      bossShots.splice(i, 1);
    }
  }
}

function shootBossBullet() {
  const bossBullet = new PIXI.Graphics();
  bossBullet.beginFill(0xff0000);
  bossBullet.drawCircle(0, 0, 20);
  bossBullet.endFill();

  const dx = ship.x - boss.x;
  const dy = ship.y - boss.y - boss.height;
  const angle = Math.atan2(dy, dx);

  bossBullet.x = boss.x + Math.cos(angle) * 50; 
  bossBullet.y = boss.y + Math.sin(angle) * 50;
  bossBullet.speed = 2;
  bossBullet.direction = angle;

  app.stage.addChild(bossBullet);
  setInterval(bossShots.push(bossBullet), 3000)
}

function updateBossBullets() {
  for (let i = bossShots.length - 1; i >= 0; i--) {
    const bossBullet = bossShots[i];
    
    bossBullet.x += Math.cos(bossBullet.direction) * bossBullet.speed;
    bossBullet.y += Math.sin(bossBullet.direction) * bossBullet.speed;
    
    if (bossBullet.y > app.screen.height || bossBullet.x < 0 || bossBullet.x > app.screen.width) {
      app.stage.removeChild(bossBullet);
      bossShots.splice(i, 1);
    }
  }
}

function checkGameStatus() {
  if (totalAsteroids === 0 && !boss.visible) {
    displayFinalBossMessage();
    setTimeout(showBoss, 3000);
    boss.visible = true
  } else if (totalAsteroids === 0 && boss.visible && bossHP <= 0) {
    displayWinMessage();
  } else if (remainingShots <= 0 && asteroids.length > 0) {
    displayLoseMessage();
  } else if (remainingShots <= 0 && boss.visible && bossHP > 0) {
    displayLoseMessage();
  }
}

function displayWinMessage() {
  const winMessage = new PIXI.Text('YOU WIN!', {
    fontFamily: 'Arial',
    fontSize: 72,
    fill: 0xffffff,
    align: 'center'
  });
  winMessage.anchor.set(0.5);
  winMessage.x = app.screen.width / 2;
  winMessage.y = app.screen.height / 2;
  app.stage.addChild(winMessage);

  app.ticker.stop();
  clearInterval(timerInterval);
  clearInterval(bossShotInterval);
}

function displayLoseMessage() {
  const loseMessage = new PIXI.Text('YOU LOSE!', {
    fontFamily: 'Arial',
    fontSize: 72,
    fill: 0xff0000,
    align: 'center'
  });
  loseMessage.anchor.set(0.5);
  loseMessage.x = app.screen.width / 2;
  loseMessage.y = app.screen.height / 2;
  app.stage.addChild(loseMessage);

  app.ticker.stop();
  clearInterval(timerInterval);
  clearInterval(bossShotInterval);
}

function updateRemainingShotsDisplay() {
  const existingText = app.stage.getChildByName('remainingShots');
  if (existingText) {
    app.stage.removeChild(existingText);
  }

  const shotsText = new PIXI.Text(`Shots Left: ${remainingShots}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xffffff
  });
  shotsText.name = 'remainingShots';
  shotsText.x = 10;
  shotsText.y = 10;
  app.stage.addChild(shotsText);
}

function updateTimer() {
  const existingText = app.stage.getChildByName('timer');
  if (existingText) {
    app.stage.removeChild(existingText);
  }

  const timerText = new PIXI.Text(`Time Left: ${timeRemaining}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xffffff
  });
  timerText.name = 'timer';
  timerText.x = app.screen.width - 150;
  timerText.y = 10;
  app.stage.addChild(timerText);
}

function decrementTimer() {
  if (timeRemaining > 0) {
    timeRemaining--;
    updateTimer();
  } else {
    gameOver = true;
    if (totalAsteroids > 0) {
      displayLoseMessage();
    }
  }
}

const hpBarContainer = new PIXI.Container();

const hpBarBackground = new PIXI.Graphics();
hpBarBackground.beginFill(hpBarBackgroundColor);
hpBarBackground.drawRect(0, 0, hpBarWidth, hpBarHeight);
hpBarBackground.endFill();
hpBarContainer.addChild(hpBarBackground);

const hpBarFill = new PIXI.Graphics();
hpBarFill.beginFill(hpBarFillColor);
hpBarFill.drawRect(0, 0, hpBarWidth, hpBarHeight);
hpBarFill.endFill();
hpBarContainer.addChild(hpBarFill);

function updateHPBar() {
  const hpPercentage = bossHP / maxBossHP;
  hpBarFill.width = hpBarWidth * hpPercentage;
}

function positionHPBar() {
  hpBarContainer.x = boss.x - hpBarWidth / 2;
  hpBarContainer.y = boss.y - boss.height / 2 - hpBarHeight - hpBarPadding;
}

updateHPBar();
positionHPBar();

initializeAsteroids();
updateRemainingShotsDisplay();
updateTimer();

app.ticker.add(updateBullets);
app.ticker.add(checkCollisions);
app.ticker.add(updateBossBullets);

timerInterval = setInterval(decrementTimer, 1000);
