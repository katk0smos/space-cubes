import { Framework } from 'framework';
import { SoundService } from '@rbxts/services';
import * as Graphics from 'framework/graphics';

const framework = new Framework();

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

interface Particle {
  x: number;
  _x: number; // The *real* X value, before amplitude offset
  y: number;
  vx: number;
  vy: number;
  a: number;
}

function checkInside(px: number, py: number, x: number, y: number, w: number, h: number): boolean {
  return (px >= x && px <= x + w) && (py >= y && py <= y + h);
}

function checkCollision(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
  return (x1 <= (x2 + w2)) && (x2 < (x1 + w1)) && (y1 < (y2 + h2)) && (y2 < (y1 + h1));
}

function generateEnemies(w: number = framework.graphics.getWidth(), h: number = framework.graphics.getHeight()/3, x: number = w/2, y: number = 0, sx: number = 0, sy: number = 0, ew: number = 64, eh: number = 64): Enemy[] {
  let enemies = [];
  for (let ey = y; ey <= h; ey += ew+sy) {
    for (let ex = x; ex <= w+x; ex += eh+sx) {
      enemies.push({
        x: ex,
        y: ey,
        w: ew,
        h: eh,
        vx: 200,
        vy: 25
      });
    }
  }
  return enemies;
}

function makeParticles(c: number, x: number, y: number): Particle[] {
  let particles: Particle[] = [];
  for (let i = 0; i < c; i++) {
    particles.push({
      x,
      _x: x,
      y,
      vx: math.random(-128, 128),
      vy: 400,
      a: math.random(-32, 32)
    })
  }
  return particles;
}

let posx: number, posy: number;
let score: number;
let spaceShip: ImageLabel;
let shootSound: Sound;
let explodeSound: Sound;
let bullets: Bullet[];
let enemies: Enemy[];
let particles: Particle[];
let difficulty: number;
let gameOverTimer: number;
let gameOver: boolean;
let gameTimer: number;
function init() {
  print('init started');
  framework.graphics.setColor(new Color3(1, 1, 1));
  framework.graphics.setMode(Graphics.ScalingMode.Center);
  framework.graphics.setSize(new UDim2(1, 0, 1, 0));

  spaceShip = framework.assets.loadImage('rbxassetid://168275673', 444, 412);
  shootSound = framework.assets.loadSound('rbxassetid://271111328');
  explodeSound = framework.assets.loadSound('rbxassetid://995908246');
  framework.assets.load();

  posx = 800/2 - 32;
  posy = 600/2 - 32;
  score = 0;
  difficulty = 1;

  bullets = [];
  enemies = generateEnemies(500, 200, 150, 0, 40, 16, 32, 32);
  particles = [];
  gameOver = false;
  gameOverTimer = 10;

  gameTimer = 0;
  print('init finished');
}

function update(dt: number): void {
  if (!gameOver) {
    gameTimer += dt;
    score += dt;
    let i: number = 0;
    let j: number = 0;
    let k: number = 0;
    while (k < particles.size()) {
      const particle: Particle = particles[k];
      particle._x += particle.vx*dt;
      particle.y += particle.vy*dt;
      particle.x = particle._x + math.sin(gameTimer*5)*particle.a;

      if (particle.y >= framework.graphics.getHeight()) particles.splice(k, 1);
      else k++;
    }
    while (i < bullets.size()) {
      const bullet: Bullet = bullets[i];
      bullet.x += bullet.vx*dt;
      bullet.y += bullet.vy*dt;
      if (bullet.y + 5 <= 0) {
        bullets.splice(i, 1);
      } else i++;
    }
    while (j < enemies.size()) {
      const enemy: Enemy = enemies[j];
      enemy.x += enemy.vx*dt*difficulty;
      enemy.y += enemy.vy*dt*difficulty;
      if (enemy.y >= framework.graphics.getHeight()) {
        enemies.splice(j, 1);
        gameOver = true;
      } else j++;
    }
    for (const enemy of enemies) {
      if (enemy.vx > 0 && (enemy.x + enemy.w >= framework.graphics.getWidth())) {
        for (const e of enemies) e.vx *= -1;
        break;
      } else if (enemy.vx < 0 && (enemy.x <= 0)) {
        for (const e of enemies) e.vx *= -1;
        break;
      }
    }

    i = bullets.size() - 1;
    j = enemies.size() - 1;
    while (i >= 0 && bullets.size() > 0) {
      j = enemies.size() - 1;
      const x1 = bullets[i].x;
      const y1 = bullets[i].y;
      const w1 = 5;
      const h1 = 5;
      let col: boolean = false;
      while (j >= 0 && enemies.size() > 0 && !col) {
        const x2 = enemies[j].x;
        const y2 = enemies[j].y;
        const w2 = enemies[j].w;
        const h2 = enemies[j].h;

        if (checkCollision(x1, y1, w1, h1, x2, y2, w2, h2)) {
          enemies.splice(j, 1);
          SoundService.PlayLocalSound(explodeSound);
          particles = particles.concat(makeParticles(math.random(2,3), x2, y2));
          score += 10;
          difficulty += 0.01;
          col = true;
        } else j--;
      }

      if (col) bullets.splice(i, 1);
      else i--;
    }

    if (enemies.size() === 0) {
      enemies = generateEnemies(500, 200, 150, 0, 40, 16, 32, 32);
      difficulty = difficulty + 0.1;
      score += 1000;
    }
    // posx = (posx + 300*dt) % framework.graphics.getWidth();
  } else {
    gameOverTimer -= dt;
    if (gameOverTimer <= 0) {
      gameOverTimer = 10;
      gameOver = false;
      init();
    }
  }
}

function draw(graphics: Graphics.Graphics): void {
  if (!gameOver) {
    graphics.setColor(new Color3(1, 1, 1));
    graphics.image(spaceShip, posx, posy, 64, 64*(412/444));
    graphics.setColor(new Color3(1, 1, 48/255));
    for (const bullet of bullets) graphics.rect(bullet.x, bullet.y, 5, 5, 0);
    graphics.setColor(new Color3(0, 0, 1));
    for (const enemy of enemies) graphics.rect(enemy.x, enemy.y, enemy.w, enemy.h, 0);
    graphics.setColor(new Color3(196/255, 83/255, 7/255));
    for (const particle of particles) graphics.rect(particle.x, particle.y, 5, 5, 0);
    graphics.setColor(new Color3(1, 1, 1));
    graphics.print(`Score: ${math.floor(score)}`, 8, 8, 0, undefined, 200, Enum.TextXAlignment.Left);
    /*if (posx <= (graphics.getWidth() - 128)) {
      graphics.image(spaceShip, posx, 128, 128, 128*(412/444));
    } else {
      graphics.image(spaceShip, posx, 128, 128, 128*(412/444));
      graphics.image(spaceShip, posx - graphics.getWidth(), 128, 128, 128*(412/444));
    }*/
  } else {
    graphics.print('Game Over!', 0, 200, 0, 36, undefined, Enum.TextXAlignment.Center);
    graphics.print(`Your Score: ${math.floor(score)}`, 0, 300, 0, 36, undefined, Enum.TextXAlignment.Center);
    graphics.print(`Restarting in ${math.floor(gameOverTimer)} seconds`, 0, graphics.getHeight() - 48, 0, 24, undefined, Enum.TextXAlignment.Center);
  }
}

function mousemoved(x: number, y: number, dx: number, dy: number, isTouch: boolean): void {
  if (!gameOver) {
    posx = x - 32;
    posy = y - 32;
  }
}

function mousepressed(x: number, y: number, button: number, isTouch: boolean): void {
  if (!gameOver) {
    if (button === 1) {
      bullets.push({
        x: posx + 32,
        y: posy,
        vx: 0,
        vy: -700
      });
      SoundService.PlayLocalSound(shootSound);
    }
  }
}

framework.input.addMousePressedHook(mousepressed);
framework.input.addMouseMovedHook(mousemoved);

framework.addInitHook(init);
framework.addUpdateHook(update);
framework.addDrawHook(draw);

framework.start();
