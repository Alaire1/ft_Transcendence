import { BALL_RADIUS } from "../DomUtils.js";

export default class Ball {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.speed = 6;
    this.radius = 9;
    this.angle = angle;
    this.dx = Math.cos(angle) * this.speed;
    this.dy = Math.sin(angle) * this.speed;
  }

  restart(angle) {
    this.dx = Math.cos(angle) * this.speed;
    this.dy = Math.sin(angle) * this.speed;
  }

  stop() {
    this.dx = 0;
    this.dy = 0;
  }

  move(deltaTime) {
    this.x += this.dx * deltaTime * 60;
    this.y += this.dy * deltaTime * 60;
  }

  hitPaddle(paddle) {
    return (
      this.x + BALL_RADIUS <= paddle.x + 20 &&
      this.x + BALL_RADIUS >= paddle.x - 20 &&
      this.y + BALL_RADIUS >= paddle.y &&
      this.y + BALL_RADIUS <= paddle.y + paddle.height
    );
  }

  handlePaddleCollision(paddle) {
    let relativeY = (this.y - paddle.y) / paddle.height - 0.5;
    this.angle = (relativeY * Math.PI) / 2;
    this.dx = -this.dx;
    this.dy = Math.sin(this.angle) * this.speed;
  }
}
