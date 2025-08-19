import { Scorer } from "./util.js";
const POINTS_TO_WIN = 3;

export default class Game {
  constructor() {
    this.player1Score = 0;
    this.player2Score = 0;
    this.player1 = "";
    this.player2 = "";
    this.winner = null;
  }

  incrementPlayer1Score() {
    this.player1Score++;
    if (this.player1Score >= POINTS_TO_WIN) {
      this.winner = Scorer.P1;
    }
  }

  incrementPlayer2Score() {
    this.player2Score++;
    if (this.player2Score >= POINTS_TO_WIN) {
      this.winner = Scorer.P2;
    }
  }

  decrementPlayer1Score() {
    if (this.player1Score > 0) {
      this.player1Score--;
    }
  }

  decrementPlayer2Score() {
    if (this.player2Score > 0) {
      this.player2Score--;
    }
  }

  resetScores() {
    this.player1Score = 0;
    this.player2Score = 0;
  }

  updateScore(scorer) {
    if (scorer === Scorer.P1) {
      this.incrementPlayer1Score();
    } else {
      this.incrementPlayer2Score();
    }
  }

  getWinner() {
    return this.winner;
  }

  isOver() {
    if (this.winner) {
      return true;
    }
    return false;
  }
}
