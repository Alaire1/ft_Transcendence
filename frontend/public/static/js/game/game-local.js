import Game from "./game-objects/Game.js";
import Tournament from "./game-objects/Tournament.js";
import { checkCollisions, Powerup, Scorer } from "./game-objects/util.js";
import * as DomUtils from "./DomUtils.js";
import { setUpRemoteTournament, setUpRemoteTwoPlayer } from "./game-remote.js";
import { checkToken, isTokenExpired, refreshToken } from "../profile.js";
let game = new Game();
let tournament;

let ball, rect, centerX, centerY, leftPaddle, rightPaddle;

let ballElement, lpElement, rpElement;

let pointScored = Scorer.NONE;

let isTournamentMode = true;

let powerupObjects = [];

export let isPongPlus = false;

const POWERUP_LENGTH = 10000;
const MAX_SPEED = 15;
const NUM_POWERUPS = 3;

export const userData = {
  username: null,
  setUsername(name) {
    this.username = name;
  },
};

function endGameTournament() {
  ball.x = centerX;
  ball.y = centerY;
  ball.stop();
  leftPaddle.y = centerY - rect.height / 10;
  rightPaddle.y = centerY - rect.height / 10;

  removePaddleMovers();
  DomUtils.hideGameElements();

  tournament.updateAfterGame(game);

  DomUtils.updateTable(tournament.tableInfo);

  tournament.nextMatch();

  if (tournament.isOver()) {
    showTournamentEndModal();
    return;
  }

  DomUtils.showVictoryDialog(leftPaddle, rightPaddle, ball, startGame);

  initGame();
  DomUtils.updateScores(game);

  updateElementPosition(ballElement, ball.x, ball.y);
  updateElementPosition(lpElement, leftPaddle.x, leftPaddle.y);
  updateElementPosition(rpElement, rightPaddle.x, rightPaddle.y);
  render();
}

function showTournamentEndModal() {
  DomUtils.createModal("main.endTournamentModal.header", [
    {
      text: "main.endTournamentModal.button1",
      onClick: restartTournament,
      closeModal: true,
    },
    {
      text: "main.endTournamentModal.button2",
      onClick: restartTournamentNewPlayers,
      closeModal: true,
    },
    {
      text: "main.endTournamentModal.button3",
      onClick: goToMainMenu,
      closeModal: true,
    },
  ]);
}

function restartTournament() {
  tournament.restart();
  DomUtils.updateTable(tournament.tableInfo);

  ({ ball, rect, centerX, centerY, leftPaddle, rightPaddle } =
    DomUtils.initializeGameElements("field"));

  ({ ballElement, lpElement, rpElement } =
    DomUtils.initializeAndPlaceGameElements(leftPaddle, rightPaddle, ball));

  initGame();
  DomUtils.updateScores(game);

  DomUtils.showPressAnyKeyModal();
  document.addEventListener("keydown", startGame);
}

function restartTournamentNewPlayers() {
  DomUtils.removeTableFromDOM();
  DomUtils.showTournamentModal(setUpTournament);
}

function goToMainMenu() {
  game.player1 = "";
  game.player2 = "";
  game.resetScores();
  DomUtils.updateScoreCards(game);
  DomUtils.updateScores(game);
  DomUtils.removeTableFromDOM();
  showMainMenu();
}

function resetPoint() {
  game.updateScore(pointScored);
  DomUtils.updateScores(game);

  let serveDirection = pointScored === Scorer.P1 ? Math.PI : 0;

  ball.x = centerX;
  ball.y = centerY;
  ball.stop();
  pointScored = Scorer.NONE;

  setTimeout(() => {
    ball.restart(serveDirection);
  }, 1000);
}

let lastTime = performance.now();
let elapsedTime = 0;

const updates = [];

// Collect updates
function updateElementPosition(element, x, y) {
  updates.push({ element, x, y });
}

// Apply all updates in one batch
function render() {
  updates.forEach(({ element, x, y }) => {
    element.style.transform = `translate(${x}px, ${y}px)`;
  });
  updates.length = 0; // Clear updates after applying them
}

let i = 0;

let timePrevious = 0;

function update(timestamp) {
  if (!timePrevious) timePrevious = timestamp;

  const deltaTime = (timestamp - timePrevious) / 1000; // Convert ms to seconds
  timePrevious = timestamp;

  pointScored = checkCollisions(
    ball,
    leftPaddle,
    rightPaddle,
    rect,
    isPongPlus ? powerupObjects : []
  );

  movePaddles();
  ball.move(deltaTime);

  handlePowerups();

  updateElementPosition(ballElement, ball.x, ball.y);
  updateElementPosition(lpElement, leftPaddle.x, leftPaddle.y);
  updateElementPosition(rpElement, rightPaddle.x, rightPaddle.y);
  render();

  if (pointScored !== Scorer.NONE) {
    resetPoint();
  }

  if (game.isOver()) {
    timePrevious = 0;
    if (isPongPlus) {
      leftPaddle.resetSpeed();
      rightPaddle.resetSpeed();

      // resets the powerups if there still are some
      addPowerup(leftPaddle, lpElement);
      addPowerup(rightPaddle, rpElement);
      powerupObjects.forEach((obj) => {
        if (obj.element) {
          obj.element.remove();
        }
      });
    }
    powerupObjects.length = 0;
    isTournamentMode ? endGameTournament() : endGameLocal();
    return;
  }

  updateSpeedAndTime();
  requestAnimationFrame(update);
}

function handlePowerups() {
  if (!isPongPlus) {
    return;
  }

  powerupObjects = powerupObjects.filter((obj) => {
    if (obj.hit === Scorer.P1) {
      if (obj.type === Powerup.COIN) {
        game.incrementPlayer1Score();
        DomUtils.updateScores(game);
      } else if (obj.type === Powerup.SKULL) {
        game.decrementPlayer2Score();
        DomUtils.updateScores(game);
      } else if (obj.type === Powerup.FAST) {
        leftPaddle.increaseSpeed();
        addPowerup(leftPaddle, lpElement, "glow-orange");
      } else if (obj.type === Powerup.SLOW) {
        rightPaddle.decreaseSpeed();
        addPowerup(rightPaddle, rpElement, "glow-green");
      }
      return false; // Remove this object
    }
    if (obj.hit === Scorer.P2) {
      if (obj.type === Powerup.COIN) {
        game.incrementPlayer2Score();
        DomUtils.updateScores(game);
      } else if (obj.type === Powerup.SKULL) {
        game.decrementPlayer1Score();
        DomUtils.updateScores(game);
      } else if (obj.type === Powerup.FAST) {
        rightPaddle.increaseSpeed();
        addPowerup(rightPaddle, rpElement, "glow-orange");
      } else if (obj.type === Powerup.SLOW) {
        leftPaddle.decreaseSpeed();
        addPowerup(leftPaddle, lpElement, "glow-green");
      }
      return false; // Remove this object
    }
    return true; // Keep this object
  });

  if (powerupObjects.length < NUM_POWERUPS) {
    spawnPowerup();
  }
}

const activePowerups = new Map(); // Store active powerups per paddle

function addPowerup(paddle, element, powerupClass) {
  element.classList.remove("glow-green");
  element.classList.remove("glow-orange");
  if (powerupClass) {
    element.classList.add(powerupClass);
  }

  // If there's an existing timeout for this power-up, clear it
  if (activePowerups.has(paddle)) {
    clearTimeout(activePowerups.get(paddle));
  }

  // Set a new timeout and store it
  const timeout = setTimeout(() => {
    element.classList.remove(powerupClass);
    paddle.resetSpeed();
    activePowerups.delete(paddle); // Remove from active powerups
  }, POWERUP_LENGTH);

  activePowerups.set(paddle, timeout); // Store the timeout reference
}

const initGame = () => {
  game = new Game();

  let matchup = tournament.getCurrentMatchInfo();
  game.player1 = matchup.player1;
  game.player2 = matchup.player2;

  DomUtils.updateScoreCards(game);
};

function startGame() {
  requestAnimationFrame(update);
  document.removeEventListener("keydown", startGame);
}

function movePaddles() {
  if (leftPaddle.movingUp && leftPaddle.y > rect.top) {
    leftPaddle.moveUp();
  }
  if (leftPaddle.movingDown && leftPaddle.y < rect.bottom - leftPaddle.height) {
    leftPaddle.moveDown();
  }
  if (rightPaddle.movingUp && rightPaddle.y > rect.top) {
    rightPaddle.moveUp();
  }
  if (
    rightPaddle.movingDown &&
    rightPaddle.y < rect.bottom - rightPaddle.height
  ) {
    rightPaddle.moveDown();
  }
}

function updateSpeedAndTime() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  elapsedTime += deltaTime;
  if (elapsedTime >= 5000 && ball.dx < MAX_SPEED) {
    elapsedTime = 0;

    ball.dx *= 1.1;
    ball.dy *= 1.1;
  }
}

function setUpTournament(playerHandles) {
  isTournamentMode = true;
  tournament = new Tournament(playerHandles);

  DomUtils.initializeTable(tournament.getPlayerHandles());

  ({ ball, rect, centerX, centerY, leftPaddle, rightPaddle } =
    DomUtils.initializeGameElements("field"));

  createPaddleMovers(leftPaddle, rightPaddle);

  ({ ballElement, lpElement, rpElement } =
    DomUtils.initializeAndPlaceGameElements(leftPaddle, rightPaddle, ball));

  initGame();
  DomUtils.updateScores(game);

  DomUtils.showPressAnyKeyModal();
  document.addEventListener("keydown", startGame);
}

let resizeListenerAdded = false;
let tutorialListenerAdded = false;

async function fetchUserData() {
  if (userData.username) {
    //console.log("User already present. No need to fetch.");
    return;
  }
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  fetch(`api/auth/users/me/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }
      return response.json();
    })
    .then((responseData) => {
      userData.setUsername(responseData.data.username);
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      DomUtils.createAlert("alert.errorFetchingData");
    });
}

export function showMainMenu() {
  DomUtils.createModal("main.startMenu.header", [
    {
      text: "main.startMenu.remoteTournament",
      onClick: setUpRemoteTournament,
      closeModal: true,
    },
    {
      text: "main.startMenu.remoteTwoPlayer",
      onClick: () => setUpRemoteTwoPlayer(),
      closeModal: true,
    },
    {
      text: "main.startMenu.localTwoPlayer",
      onClick: () => setUpLocalTwoPlayer(),
      closeModal: true,
    },
    {
      text: "main.startMenu.localTournament",
      onClick: setUpLocalTournament,
      closeModal: true,
    },
  ]);

  window.addEventListener("resize", () => {
    let hide = false;

    if (ball) {
      if (!ballElement || ballElement.style.display === "none") {
        hide = true;
      }
      ({ ballElement, lpElement, rpElement, rect } =
        DomUtils.initializeAndPlaceGameElements(
          leftPaddle,
          rightPaddle,
          ball,
          hide
        ));
      updateElementPosition(ballElement, ball.x, ball.y);
      updateElementPosition(lpElement, leftPaddle.x, leftPaddle.y);
      updateElementPosition(rpElement, rightPaddle.x, rightPaddle.y);
      render();
    }
    if (powerupObjects.length > 0) {
      respawnPowerups();
    }
  });
  resizeListenerAdded = true;

  fetchUserData();

  let tutorialElement = document.getElementById("tutorial-link");
  let tutorialModal = document.getElementById("tutorial-container");
  tutorialElement.addEventListener("click", () => {
    tutorialModal.style.display = "flex";
  });

  document.addEventListener("click", (event) => {
    if (
      !tutorialModal.contains(event.target) &&
      event.target !== tutorialElement
    ) {
      tutorialModal.style.display = "none";
    }
  });

  let tutorialClose = document.getElementById("tutorial-close");
  tutorialClose.addEventListener("click", () => {
    tutorialModal.style.display = "none";
  });

  tutorialListenerAdded = true;
}

function endGameLocal() {
  ball.x = centerX;
  ball.y = centerY;
  ball.stop();
  removePaddleMovers();
  DomUtils.hideGameElements();

  game.resetScores();
  game.player1 = "";
  game.player2 = "";

  DomUtils.createModal("main.local.gameOver", [
    {
      text: "main.remote.mainMenu",
      onClick: () => {
        showMainMenu();
        DomUtils.updateScoreCards(game);
        DomUtils.updateScores(game);
      },
      closeModal: true,
    },
    {
      text: "main.local.rematch",
      onClick: () => {
        setUpLocalTwoPlayer();
        DomUtils.updateScoreCards(game);
        DomUtils.updateScores(game);
      },
      closeModal: true,
    },
  ]);

  updateElementPosition(ballElement, ball.x, ball.y);
  updateElementPosition(lpElement, leftPaddle.x, leftPaddle.y);
  updateElementPosition(rpElement, rightPaddle.x, rightPaddle.y);
  render();
}

function setUpLocalTwoPlayer() {
  DomUtils.createModal("main.chooseGame.header", [
    {
      text: "main.chooseGame.pongPlus",
      onClick: () => {
        isPongPlus = true;
        setUpLocalTwoPlayerContinue();
      },
      closeModal: true,
    },
    {
      text: "main.chooseGame.pongStandard",
      onClick: () => {
        isPongPlus = false;
        setUpLocalTwoPlayerContinue();
      },
      closeModal: true,
    },
    {
      text: "main.localTwoPlayer.mainMenu",
      onClick: showMainMenu,
      closeModal: true,
    },
  ]);
}

function setUpLocalTwoPlayerContinue() {
  isTournamentMode = false;
  let modal = DomUtils.createModal("main.localTwoPlayer.header", [
    {
      text: "main.localTwoPlayer.startGame",
      onClick: () => setUpTwoPlayerGame(modal),
      closeModal: false,
    },
    {
      text: "main.localTwoPlayer.mainMenu",
      onClick: showMainMenu,
      closeModal: true,
    },
  ]);

  let p1text = document.createElement("div");
  p1text.classList.add("modal-text");
  p1text.setAttribute("data-i18n", "main.localTwoPlayer.player1");

  let p1Input = document.createElement("input");
  p1Input.classList.add("modal-text-entry");
  p1Input.id = "player-1-input";

  let p2text = document.createElement("div");
  p2text.classList.add("modal-text");
  p2text.setAttribute("data-i18n", "main.localTwoPlayer.player2");

  let p2Input = document.createElement("input");
  p2Input.classList.add("modal-text-entry");
  p2Input.id = "player-2-input";

  const contentWrapper = document.getElementById("modal-content-wrapper");
  contentWrapper.appendChild(p1text);
  contentWrapper.appendChild(p1Input);
  contentWrapper.appendChild(p2text);
  contentWrapper.appendChild(p2Input);

  contentWrapper.style.display = "flex";

  p1Input.focus();
}

function setUpTwoPlayerGame(modal) {
  const player1Name = document.getElementById("player-1-input").value;
  const player2Name = document.getElementById("player-2-input").value;

  if (player1Name.length < 1 || player2Name.length < 1) {
    DomUtils.createAlert("alert.game.noEmptyNames");
    return;
  }

  modal.style.display = "none";

  game = new Game();

  game.player1 = player1Name;
  game.player2 = player2Name;

  DomUtils.updateScoreCards(game);

  ({ ball, rect, centerX, centerY, leftPaddle, rightPaddle } =
    DomUtils.initializeGameElements("field"));

  createPaddleMovers(leftPaddle, rightPaddle);

  ({ ballElement, lpElement, rpElement } =
    DomUtils.initializeAndPlaceGameElements(leftPaddle, rightPaddle, ball));

  DomUtils.showPressAnyKeyModal();
  document.addEventListener("keydown", startGame);
}

function setUpLocalTournament() {
  DomUtils.createModal("main.chooseGame.header", [
    {
      text: "main.chooseGame.pongPlus",
      onClick: () => {
        isPongPlus = true;
        DomUtils.showTournamentModal(setUpTournament);
      },
      closeModal: true,
    },
    {
      text: "main.chooseGame.pongStandard",
      onClick: () => {
        isPongPlus = false;
        DomUtils.showTournamentModal(setUpTournament);
      },
      closeModal: true,
    },
    {
      text: "main.localTwoPlayer.mainMenu",
      onClick: showMainMenu,
      closeModal: true,
    },
  ]);
}

function spawnPowerup() {
  const gameField = document.getElementById("field");
  const rect = gameField.getBoundingClientRect();

  const minX = 0.3;
  const maxX = 0.7;
  const minY = 0.1;
  const maxY = 0.9;

  function createCoin() {
    let relativeX = Math.random() * (maxX - minX) + minX;
    let relativeY = Math.random() * (maxY - minY) + minY;
    let trueX = rect.left + rect.width * relativeX;
    let trueY = rect.top + rect.height * relativeY;

    const weightedEmojis = [
      ...Array(35).fill("🐢"), // 35% Turtle
      ...Array(35).fill("🐇"), // 35% Hare
      ...Array(20).fill("🤑"), // 20% Coin
      ...Array(10).fill("💥"), // 10% Danger
    ];

    const randomEmoji =
      weightedEmojis[Math.floor(Math.random() * weightedEmojis.length)];

    const coin = document.createElement("div");
    coin.textContent = randomEmoji;
    coin.style.position = "absolute";
    coin.style.fontSize = "30px";
    coin.style.left = `${trueX}px`;
    coin.style.top = `${trueY}px`;
    gameField.appendChild(coin);

    powerupObjects.push({
      type:
        randomEmoji === "🤑"
          ? Powerup.COIN
          : randomEmoji === "🐢"
          ? Powerup.SLOW
          : randomEmoji === "🐇"
          ? Powerup.FAST
          : Powerup.SKULL,
      x: trueX,
      y: trueY,
      relativeX: relativeX,
      relativeY: relativeY,
      size: rect.height * 0.05,
      element: coin,
      hit: Scorer.NONE,
    });

    return coin;
  }

  createCoin();
}

function respawnPowerups() {
  powerupObjects.forEach((p) => {
    //console.log("respawning powerup...");
    let element = p.element;

    //console.log(p.x);
    //console.log(p.y);

    let powerupX = rect.left + p.relativeX * rect.width;
    let powerupY = rect.top + p.relativeY * rect.height;
    let newSize = rect.height * 0.05;

    //console.log("New x: " + powerupX);
    //console.log("New Y: " + powerupY);
    element.style.fontSize = `${newSize}px`;
    element.style.left = `${powerupX}px`;
    element.style.top = `${powerupY}px`;

    p.x = powerupX;
    p.y = powerupY;
    p.size = newSize;
  });
}

let gameBox;

function handlePaddlesKeydown(event) {
  if (!gameBox.contains(document.activeElement)) {
    return;
  }

  if (event.key === "ArrowUp") {
    rightPaddle.movingUp = true;
  }
  if (event.key === "ArrowDown") {
    rightPaddle.movingDown = true;
  }
  if (event.key === "w") {
    leftPaddle.movingUp = true;
  }
  if (event.key === "s") {
    leftPaddle.movingDown = true;
  }
}

function handlePaddlesKeyup(event) {
  if (event.key === "ArrowUp") {
    rightPaddle.movingUp = false;
  }
  if (event.key === "ArrowDown") {
    rightPaddle.movingDown = false;
  }
  if (event.key === "w") {
    leftPaddle.movingUp = false;
  }
  if (event.key === "s") {
    leftPaddle.movingDown = false;
  }
}

function createPaddleMovers(leftPaddle, rightPaddle) {
  gameBox = document.getElementById("field");
  document.addEventListener("keyup", handlePaddlesKeyup);
  document.addEventListener("keydown", handlePaddlesKeydown);
}

function removePaddleMovers() {
  document.addEventListener("keyup", handlePaddlesKeyup);
  document.addEventListener("keydown", handlePaddlesKeydown);
}
