const DEFAULT_SPEED = 5;

export default class Paddle {
  constructor(x, y, height) {
    this.x = x;
    this.y = y;
    this.height = height;
    this.speed = DEFAULT_SPEED;
    this.movingDown = false;
    this.movingUp = false;
  }

  resetSpeed() {
    this.speed = DEFAULT_SPEED;
  }

  increaseSpeed() {
    this.speed = 8;
  }

  decreaseSpeed() {
    this.speed = 3;
  }

  moveUp() {
    this.y -= this.speed;
  }

  moveDown() {
    this.y += this.speed;
  }
}
