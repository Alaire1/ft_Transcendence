import { BALL_HEIGHT, BALL_RADIUS } from "../DomUtils.js";

export const Scorer = Object.freeze({
  NONE: 0,
  P1: 1,
  P2: 2,
});

export const Powerup = Object.freeze({
  COIN: "COIN",
  SKULL: "DANGER",
  SLOW: "SLOW",
  FAST: "FAST",
});

export const checkCollisions = (
  ball,
  leftPaddle,
  rightPaddle,
  field,
  objects
) => {
  if (ball.dx < 0 && ball.hitPaddle(leftPaddle)) {
    ball.handlePaddleCollision(leftPaddle);
  } else if (ball.dx > 0 && ball.hitPaddle(rightPaddle)) {
    ball.handlePaddleCollision(rightPaddle);
  }

  objects.forEach((obj) => {
    if (
      ball.x + BALL_RADIUS > obj.x - BALL_RADIUS &&
      ball.x + BALL_RADIUS < obj.x + 30 + BALL_RADIUS &&
      ball.y + BALL_RADIUS > obj.y - BALL_RADIUS &&
      ball.y + BALL_RADIUS < obj.y + 30 + BALL_RADIUS
    ) {
      obj.hit = ball.dx > 0 ? Scorer.P1 : Scorer.P2;
      obj.element.remove();
    }
  });

  if (ball.y <= field.top || ball.y + BALL_HEIGHT >= field.bottom) {
    ball.dy = -ball.dy;
  } else if (ball.x + BALL_HEIGHT >= field.right) {
    return Scorer.P1;
  } else if (ball.x <= field.left) {
    return Scorer.P2;
  }
  return Scorer.NONE;
};
