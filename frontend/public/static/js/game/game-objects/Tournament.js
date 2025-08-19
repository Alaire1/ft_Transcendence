import { Scorer } from "./util.js";

export default class Tournament {
  constructor(playerHandles) {
    this.playerHandles = playerHandles;
    this.tableInfo = [];
    this.matches = [];
    this.currentMatchup = 0;

    this.initializeMatchupData(playerHandles);
    this.initializeTableInfo(playerHandles);
  }

  initializeMatchupData(playerHandles) {
    const numPlayers = playerHandles.length;
    const matches = [];

    // Add a dummy player if the number of players is odd
    const isOdd = numPlayers % 2 !== 0;
    if (isOdd) {
      playerHandles.push("BYE");
    }

    // Generate round-robin matches
    const numRounds = playerHandles.length - 1;
    for (let round = 0; round < numRounds; round++) {
      for (let i = 0; i < playerHandles.length / 2; i++) {
        const p1Name = playerHandles[i];
        const p2Name = playerHandles[playerHandles.length - 1 - i];

        if (p1Name !== "BYE" && p2Name !== "BYE") {
          matches.push({
            player1: p1Name,
            player2: p2Name,
            p1Score: null,
            p2Score: null,
          });
        }
      }

      // Rotate players (except the first one) for the next round
      playerHandles.splice(1, 0, playerHandles.pop());
    }

    // Remove "BYE" player from the playerHandles if it exists
    const byeIndex = playerHandles.indexOf("BYE");
    if (byeIndex !== -1) {
      playerHandles.splice(byeIndex, 1);
    }

    this.matches = matches;
  }

  initializeTableInfo(playerHandles) {
    for (let i = 0; i < playerHandles.length; i++) {
      let playerInfo = {};
      playerInfo.name = playerHandles[i];
      playerInfo.wins = 0;
      playerInfo.losses = 0;
      playerInfo.pointsFor = 0;
      playerInfo.pointsAgainst = 0;

      this.tableInfo.push(playerInfo);
    }
  }

  updateAfterGame(game) {
    for (let i = 0; i < this.tableInfo.length; i++) {
      const playerInfo = this.tableInfo[i];

      if (playerInfo.name === game.player1) {
        playerInfo.pointsFor += game.player1Score;
        playerInfo.pointsAgainst += game.player2Score;
        if (game.getWinner() === Scorer.P1) {
          playerInfo.wins += 1;
        } else {
          playerInfo.losses += 1;
        }
      } else if (playerInfo.name === game.player2) {
        playerInfo.pointsFor += game.player2Score;
        playerInfo.pointsAgainst += game.player1Score;
        if (game.getWinner() === Scorer.P1) {
          playerInfo.losses += 1;
        } else {
          playerInfo.wins += 1;
        }
      }
    }

    let matchup = this.matches[this.currentMatchup];

    matchup.p1Score = game.player1Score;
    matchup.p2Score = game.player2Score;
  }

  restart() {
    for (let i = 0; i < this.tableInfo.length; i++) {
      const tableInfo = this.tableInfo[i];

      tableInfo.pointsFor = 0;
      tableInfo.pointsAgainst = 0;
      tableInfo.wins = 0;
      tableInfo.losses = 0;
    }

    for (let i = 0; i < this.matches.length; i++) {
      const match = this.matches[i];

      match.p1Score = null;
      match.p2Score = null;
    }

    this.currentMatchup = 0;
  }

  getTableInfo() {
    return this.tableInfo;
  }

  getMatches() {
    return this.matches;
  }

  getCurrentMatchInfo() {
    return this.matches[this.currentMatchup];
  }

  getPlayerHandles() {
    return this.playerHandles;
  }

  nextMatch() {
    this.currentMatchup += 1;
  }

  isOver() {
    return this.currentMatchup >= this.matches.length;
  }
}
