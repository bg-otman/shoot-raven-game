const canvas = document.querySelector(".canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// canvas to detect if we hit target (collision with color)
const collisionCanvas = document.querySelector(".collisionCanvas");
const collisionctx = collisionCanvas.getContext("2d");
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

let score = 0;
let gameOver = false;
ctx.font = "50px Impact";

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.font = "50px Impact";
});

let cursorPositionX = 0;
let cursorPositionY = 0;

window.addEventListener("mousemove", (e) => {
  cursorPositionX = e.x;
  cursorPositionY = e.y;
});

const aimImg = new Image();
aimImg.src = "images/gun-target.png";

function animateAim() {
  ctx.drawImage(
    aimImg,
    0,
    0,
    aimImg.width,
    aimImg.height,
    cursorPositionX - aimImg.width + 33,
    cursorPositionY - aimImg.height + 30,
    aimImg.width,
    aimImg.height
  );
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.fillText(`score: ${score}`, 50, 75);
  ctx.fillStyle = "#FFA420";
  ctx.fillText(`score: ${score}`, 53, 78);
}

function youLost() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawScore();
  document.querySelector(".score").textContent = score;
  document.querySelector(".try-again").style.display = "flex";
}

// animate Explosion
const canvasPosition = canvas.getBoundingClientRect();
let explosion = [];

const boomSound = new Audio();
boomSound.src = "audio/boom.wav";

class Explosion {
  constructor(x, y) {
    this.image = new Image();
    this.image.src = "images/boom.png";
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.width = this.spriteWidth * 0.7;
    this.height = this.spriteHeight * 0.7;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.frame = 0;
    this.markedForDeletion = false;
    this.flapInterval = Math.random() * 50 + 50;
    this.timeSinceFlap = 0;
  }
  update(deltaTime) {
    if (this.frame > 4) this.markedForDeletion = true;
    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      this.frame > 4 ? (this.frame = 0) : this.frame++;
      this.timeSinceFlap = 0;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.drawImage(
      this.image,
      this.spriteWidth * this.frame,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

// animate ravens
let ravensArray = [];
let lastTime = 0;
let timeToNextRaven = 0;
let ravenInterval = 500;

class Ravens {
  constructor() {
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.width = this.spriteWidth / 2;
    this.height = this.spriteHeight / 2;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.directionX = Math.random() * 3 + 3;
    this.directionY = Math.random() * 3 - 1.5;
    this.image = new Image();
    this.image.src = "images/raven.png";
    this.frame = 0;
    this.markedForDeletion = false;
    this.flapInterval = Math.random() * 50 + 50;
    this.timeSinceFlap = 0;
    this.randomColor = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color = `rgb(${this.randomColor[0]}, ${this.randomColor[1]}, ${this.randomColor[2]})`;
  }
  update(deltaTime) {
    this.x -= this.directionX;
    if (this.x < 0 - this.width) gameOver = true;
    if (this.y < 0 || this.y > canvas.height - this.height) {
      this.directionY = this.directionY * -1;
    }
    this.y += this.directionY;

    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      this.frame > 4 ? (this.frame = 0) : this.frame++;
      this.timeSinceFlap = 0;
    }
  }
  draw() {
    collisionctx.fillStyle = this.color;
    collisionctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.spriteWidth * this.frame,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

window.addEventListener("click", function (e) {
  let detectPixelColor = collisionctx.getImageData(e.x, e.y, 1, 1);
  const pixleColor = detectPixelColor.data;

  ravensArray.forEach((raven) => {
    if (
      raven.randomColor[0] === pixleColor[0] &&
      raven.randomColor[1] === pixleColor[1] &&
      raven.randomColor[2] === pixleColor[2]
    ) {
      raven.markedForDeletion = true;
      explosion.push(new Explosion(e.x, e.y));
      // reset the audio to the start (to start again for next click)
      if (!gameOver) {
        boomSound.currentTime = 0;
        boomSound.play();
      }
      score++;
    }
  });
});

function animate(timestamp) {
  collisionctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltaTime;
  if (timeToNextRaven > ravenInterval) {
    ravensArray.push(new Ravens());
    timeToNextRaven = 0;
  }
  drawScore();
  [...ravensArray, ...explosion].forEach((raven) => raven.update(deltaTime));
  [...ravensArray, ...explosion].forEach((raven) => raven.draw());
  animateAim();
  ravensArray = ravensArray.filter((obj) => !obj.markedForDeletion);
  explosion = explosion.filter((obj) => !obj.markedForDeletion);

  if (!gameOver) {
    requestAnimationFrame(animate);
  } else {
    youLost();
  }
}

// game music
const gameMusic = new Audio();
gameMusic.src = "audio/magic.mp3";
let musicDuration = 2 * 60 + 41;
// repeat when music end
gameMusic.addEventListener("ended", () => {
  gameMusic.play();
});

// start game
document.querySelector(".container .play-btn").addEventListener("click", () => {
  document.querySelector(".play").style.display = "none";
  gameMusic.play();
  setTimeout(() => {
    animate(0);
  }, 1000);
});

// try-again
document
  .querySelector(".container .try-again-btn")
  .addEventListener("click", () => {
    document.querySelector(".try-again").style.display = "none";
    ravensArray = [];
    lastTime = 0;
    timeToNextRaven = 0;
    ravenInterval = 500;
    score = 0;
    gameOver = false;
    setTimeout(() => {
      animate(0);
    }, 1000);
  });
