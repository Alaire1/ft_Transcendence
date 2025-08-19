import { removeAllGameInvitesByPlayer } from "../chat/utils_chat.js";
import { applyTranslations } from "../translations.js";
import * as DomUtils from "./DomUtils.js";
import { showMainMenu, userData } from "./game-local.js";
import Game from "./game-objects/Game.js";
import { Powerup, Scorer } from "./game-objects/util.js";
import { checkToken, isTokenExpired, refreshToken } from "../profile.js";
let pongSocket;

let game = new Game();

let ball,
  rect,
  centerX,
  centerY,
  leftPaddle,
  rightPaddle,
  myPaddle,
  opponentPaddle;

let ballElement, lpElement, rpElement;
let pointScored = Scorer.NONE;

let powerupObjects = [];

let remoteInProgress = false;

export function setUpRemoteTwoPlayer() {
  remoteInProgress = true;
  openWebSocket();
  let modal = DomUtils.createModal("main.remote.title", [
    {
      text: "main.remote.createGame",
      onClick: () => createGame(),
      closeModal: true,
    },
    {
      text: "main.remote.joinGame",
      onClick: () => searchGames(),
      closeModal: true,
    },
    {
      text: "main.remote.mainMenu",
      onClick: showMainMenuRemote,
      closeModal: true,
    },
  ]);
}

let resizeListenerAdded = false;

export function openWebSocket() {
  if (pongSocket && pongSocket.readyState !== WebSocket.CLOSED) {
    return Promise.resolve(pongSocket); // ✅ If already open, return it immediately
  }

  if (!resizeListenerAdded) {
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
  }

  return new Promise((resolve, reject) => {
    pongSocket = new WebSocket(
      "wss://" + window.location.host + "/back/wss/pong/"
    );

    const connectionTimeout = setTimeout(() => {
      console.error("WebSocket connection timeout. Server may be down.");
      pongSocket.close();
      DomUtils.createAlert("alert.game.serverConnection", null, () => {
        showMainMenuRemote();
        reject(new Error("WebSocket connection timeout"));
      });
    }, 5000);

    pongSocket.onopen = function () {
      //console.log("Socket opened");
      clearTimeout(connectionTimeout); // ✅ Clear the timeout if connection succeeds
      resolve(pongSocket);
    };

    pongSocket.onerror = function (err) {
      console.error("WebSocket error:", err);
      reject(err); // ✅ Reject the Promise if there's an error
    };

    pongSocket.onclose = function () {
      //console.log("CLOSED");
      if (!remoteInProgress) {
        return;
      }
      DomUtils.hideGameElements();
      destroyPowerups();
      showDisconnectModal();
    };
  });
}

export async function createGameFromInvite(isPongPlus) {
  if (!pongSocket) {
    await openWebSocket();
  }
  remoteInProgress = true;

  createGameContinue(isPongPlus);
}

function createGame() {
  DomUtils.createModal("main.chooseGame.header", [
    {
      text: "main.chooseGame.pongPlus",
      onClick: () => {
        createGameContinue(true);
      },
      closeModal: true,
    },
    {
      text: "main.chooseGame.pongStandard",
      onClick: () => {
        createGameContinue(false);
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

function createGameContinue(isPongPlus) {
  ({ ball, rect, centerX, centerY, leftPaddle, rightPaddle } =
    DomUtils.initializeGameElements("field"));

  const message = JSON.stringify({
    action: "create",
    username: userData.username,
    isPongPlus: isPongPlus,
  });
  pongSocket.send(message);
  myPaddle = leftPaddle;
  opponentPaddle = rightPaddle;
  addPaddleListener();
  removeAllGameInvitesByPlayer(userData.username);
  game.resetScores();
  game.player1 = "";
  game.player2 = "";
  DomUtils.updateScoreCards(game);
  DomUtils.updateScores(game);

  let modal = DomUtils.createModal("main.waitingForOpponent", [
    {
      text: "main.remote.cancel",
      onClick: () => {
        const message = JSON.stringify({
          action: "delete_game",
          username: userData.username,
        });
        pongSocket.send(message);
        showMainMenuRemote();
      },
      closeModal: true,
    },
  ]);

  pongSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    if (data.type === "notify_opponent") {
      let username = data.username;
      let gameButton = document.createElement("button");
      gameButton.classList.add("modal-button");
      gameButton.setAttribute("data-i18n", "main.remote.opponentHasJoined");
      applyTranslations();

      const modalContent = document.getElementById("modal-content-wrapper");
      modalContent.style.display = "flex";
      modalContent.appendChild(gameButton);

      modal.addButton(
        gameButton,
        () => {
          ({ ballElement, lpElement, rpElement } =
            DomUtils.initializeAndPlaceGameElements(
              leftPaddle,
              rightPaddle,
              ball
            ));

          modal.destroy();
          sendStartMessage();

          game.player1 = userData.username;
          game.player2 = username;

          DomUtils.updateScoreCards(game);
          startGame();
        },
        false
      );
    }
  };
}

function searchGames() {
  let modal = DomUtils.createModal("main.availableGames", [
    {
      text: "main.remote.mainMenu",
      onClick: showMainMenuRemote,
      closeModal: true,
    },
  ]);
  let gameButtons = [];

  const message = JSON.stringify({
    action: "get_games",
  });
  pongSocket.send(message);

  pongSocket.onmessage = function (e) {
    const contentWrapper = document.getElementById("modal-content-wrapper");
    contentWrapper.style.display = "flex";
    const data = JSON.parse(e.data);

    if (data.type === "available_games") {
      // Remove existing game buttons from modal
      gameButtons.forEach((button) => button.remove()); // Remove all stored buttons
      gameButtons = []; // Clear the array

      // Add a new button for each game
      data.games.forEach((username) => {
        let gameButton = document.createElement("button");
        gameButton.textContent = `Join ${username}'s game`;
        gameButton.classList.add("modal-button");

        contentWrapper.appendChild(gameButton);
        modal.addButton(gameButton, () => joinGame(username, modal), true);

        // Store the button in the array
        gameButtons.push(gameButton);
      });
    }
  };
}

export async function joinGame(opponentUsername, modal) {
  await openWebSocket();
  remoteInProgress = true;

  ({ ball, rect, centerX, centerY, leftPaddle, rightPaddle } =
    DomUtils.initializeGameElements("field"));

  const message = JSON.stringify({
    action: "join",
    username: userData.username,
    gameToJoin: opponentUsername,
  });
  game.resetScores();
  game.player1 = "";
  game.player2 = "";
  DomUtils.updateScoreCards(game);
  DomUtils.updateScores(game);
  pongSocket.send(message);
  myPaddle = rightPaddle;
  opponentPaddle = leftPaddle;
  addPaddleListener();
  if (modal) {
    modal.destroy();
  }
  let waitingModal = DomUtils.createModal("main.remote.waitingForHost");
  pongSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    if (data.type === "start") {
      ({ ballElement, lpElement, rpElement } =
        DomUtils.initializeAndPlaceGameElements(leftPaddle, rightPaddle, ball));
      game.player1Score = 0;
      game.player2Score = 0;
      game.player1 = data.player1;
      game.player2 = data.player2;
      DomUtils.updateScores(game);
      DomUtils.updateScoreCards(game);
      waitingModal.destroy();
      startGame();
    }
    if (data.type === "host_disconnect") {
      waitingModal.destroy();
      showDisconnectModal();
      removeAllGameInvitesByPlayer(userData.username);
    }
  };
}

function addPaddleListener() {
  document.addEventListener("keydown", handlePaddleKeydown);
  document.addEventListener("keyup", handlePaddleKeyup);
}

function removePaddleListener() {
  document.removeEventListener("keydown", handlePaddleKeydown);
  document.removeEventListener("keyup", handlePaddleKeyup);
}

function handlePaddleKeydown(event) {
  if (event.key === "ArrowUp") {
    myPaddle.movingUp = true;
  }
  if (event.key === "ArrowDown") {
    myPaddle.movingDown = true;
  }
}

function handlePaddleKeyup() {
  myPaddle.movingUp = false;
  myPaddle.movingDown = false;
}

function sendStartMessage() {
  const message = JSON.stringify({
    action: "start",
  });
  pongSocket.send(message);
}

function startGame() {
  pongSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    if (data.type === "bu") {
      leftPaddle.y = data.p1 * rect.height + rect.top;
      rightPaddle.y = data.p2 * rect.height + rect.top;
      ball.x = rect.left + data.bx * rect.width;
      ball.y = rect.top + data.by * rect.height;
      movePaddles();
      updateElementPosition(ballElement, ball.x, ball.y);
      updateElementPosition(lpElement, leftPaddle.x, leftPaddle.y);
      updateElementPosition(rpElement, rightPaddle.x, rightPaddle.y);
      render();
      return;
    }

    if (data.type === "point_scored") {
      game.player1Score = data.player1Score;
      game.player2Score = data.player2Score;
      DomUtils.updateScores(game);
    }

    if (data.type === "host_disconnect") {
      DomUtils.hideGameElements();
      destroyPowerups();
      showDisconnectModal();
    }

    if (data.type === "paddle_speed") {
      if (data.speed === "SLOW") {
        addPowerupRemote(
          data.paddle === "LEFT" ? lpElement : rpElement,
          "glow-green"
        );
      } else if (data.speed === "FAST") {
        addPowerupRemote(
          data.paddle === "LEFT" ? lpElement : rpElement,
          "glow-orange"
        );
      } else {
        addPowerupRemote(lpElement);
        addPowerupRemote(rpElement);
      }
    }

    if (data.type === "spawn_powerup") {
      spawnPowerupRemote(data);
    }

    if (data.type === "remove_powerup") {
      powerupObjects.filter((obj) => {
        if (obj.idx === data.idx) {
          if (obj.element) {
            obj.element.remove();
          }
          return false;
        }
        return true;
      });
    }

    if (data.type === "game_over") {
      const message =
        userData.username === data.winner
          ? "main.remote.winner"
          : "main.remote.loser";
      removeAllGameInvitesByPlayer(userData.username);
      DomUtils.createModal(message, [
        {
          text: "main.remote.mainMenu",
          onClick: () => {
            game.resetScores();
            game.player1 = "";
            game.player2 = "";
            DomUtils.updateScoreCards(game);
            DomUtils.updateScores(game);

            showMainMenu();
          },
          closeModal: true,
        },
      ]);
      removePaddleListener();
      DomUtils.hideGameElements();
      addPowerupRemote(lpElement);
      addPowerupRemote(rpElement);
      destroyPowerups();

      // Make sure game only gets recorded once!
      if (userData.username === data.player1) {
        writeMatchData(data);
      }
    }
  };
}

function movePaddles() {
  if (!myPaddle) {
    return;
  }
  if (myPaddle.movingUp && myPaddle.y > rect.top) {
    const message = JSON.stringify({
      action: "u",
      player: myPaddle === leftPaddle ? "1" : "2",
    });
    pongSocket.send(message);
  }
  if (myPaddle.movingDown && myPaddle.y < rect.bottom - myPaddle.height) {
    const message = JSON.stringify({
      action: "d",
      player: myPaddle === leftPaddle ? "1" : "2",
    });
    pongSocket.send(message);
  }
}

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

export function setUpRemoteTournament() {
  remoteInProgress = true;
  openWebSocket();
  DomUtils.createModal("main.remote.remoteTournament", [
    {
      text: "main.remote.createTournament",
      onClick: createRemoteTournament,
      closeModal: true,
    },
    {
      text: "main.remote.joinTournament",
      onClick: getTournamentList,
      closeModal: true,
    },
    {
      text: "main.remote.mainMenu",
      onClick: showMainMenuRemote,
      closeModal: true,
    },
  ]);
}

function createRemoteTournament() {
  DomUtils.createModal("main.chooseGame.header", [
    {
      text: "main.chooseGame.pongPlus",
      onClick: () => {
        createRemoteTournamentContinue(true);
      },
      closeModal: true,
    },
    {
      text: "main.chooseGame.pongStandard",
      onClick: () => {
        createRemoteTournamentContinue(false);
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

function createRemoteTournamentContinue(isPongPlus) {
  const message = JSON.stringify({
    action: "create_tournament",
    username: userData.username,
    isPongPlus: isPongPlus,
  });
  pongSocket.send(message);

  let modal = DomUtils.createModal("main.waitingForPlayers");

  let contentWrapper = document.getElementById("modal-content-wrapper");
  contentWrapper.style.display = "flex";

  const twoColumnWrapper = document.createElement("div");
  twoColumnWrapper.classList.add("two-column-wrapper");

  const leftColumn = document.createElement("div");
  leftColumn.classList.add("modal-column");

  const rightColumn = document.createElement("div");
  rightColumn.classList.add("modal-column");

  twoColumnWrapper.appendChild(leftColumn);
  twoColumnWrapper.appendChild(rightColumn);

  contentWrapper.appendChild(twoColumnWrapper);

  const title = document.createElement("div");
  title.classList.add("modal-title-small");
  title.textContent = "Players";

  leftColumn.appendChild(title);

  let playerButtons = [];
  let playerButton = document.createElement("div");
  playerButton.classList.add("modal-text");
  playerButton.textContent = `${userData.username}`;
  playerButtons.push(playerButton);

  leftColumn.appendChild(playerButton);

  const startButton = document.createElement("button");
  startButton.classList.add("modal-button");
  startButton.setAttribute("data-i18n", "main.remote.startTournament");

  rightColumn.appendChild(startButton);
  modal.addButton(
    startButton,
    () => startRemoteTournament(modal, playerButtons),
    false
  );

  const cancelButton = document.createElement("button");
  cancelButton.classList.add("modal-button");
  cancelButton.setAttribute("data-i18n", "main.remote.cancel");

  rightColumn.appendChild(cancelButton);
  modal.addButton(
    cancelButton,
    () => {
      const message = JSON.stringify({
        action: "delete_tournament",
        username: userData.username,
      });
      pongSocket.send(message);
      showMainMenuRemote();
    },
    true
  );

  pongSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    if (data.type === "notify_tournament") {
      playerButtons.forEach((button) => button.remove());
      playerButtons = [];
      // Add a new button for each game
      data.players.forEach((username) => {
        let playerButton = document.createElement("div");
        playerButton.classList.add("modal-text");
        playerButton.textContent = `${username}`;

        leftColumn.appendChild(playerButton);
        // Store the button in the array
        playerButtons.push(playerButton);
      });
    }
  };
}

function startRemoteTournament(modal, playerButtons) {
  if (playerButtons.length < 3) {
    DomUtils.createAlert("alert.game.notEnoughPlayers");
    return;
  }

  modal.destroy();

  pongSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    if (data.type === "start_tournament") {
      let players = JSON.parse(data.players);
      DomUtils.initializeTable(players);
      setUpGameObjectListeners();
      game.player1 = data.player1;
      game.player2 = data.player2;
    }
  };

  setTimeout(() => {
    pongSocket.send(
      JSON.stringify({
        action: "start_tournament",
      })
    );
  }, 100);
}

function getTournamentList() {
  let modal = DomUtils.createModal("main.availableTournaments", [
    {
      text: "main.remote.mainMenu",
      onClick: showMainMenuRemote,
      closeModal: true,
    },
  ]);

  let contentWrapper = document.getElementById("modal-content-wrapper");
  contentWrapper.style.display = "flex";

  const message = JSON.stringify({
    action: "get_tournaments",
  });
  pongSocket.send(message);

  let tournamentButtons = [];

  pongSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    if (data.type === "available_tournaments") {
      tournamentButtons.forEach((button) => button.remove());
      tournamentButtons = [];

      data.tournaments.forEach((username) => {
        let tournamentButton = document.createElement("button");
        tournamentButton.classList.add("modal-button");
        tournamentButton.textContent = `Join ${username}'s tournament`;

        contentWrapper.appendChild(tournamentButton);
        modal.addButton(
          tournamentButton,
          () => joinTournament(username, modal),
          false
        );

        // Store the button in the array
        tournamentButtons.push(tournamentButton);
      });
    }
  };
}

function joinTournament(ownerUsername, modal) {
  const message = JSON.stringify({
    action: "join_tournament",
    username: userData.username,
    tournamentToJoin: ownerUsername,
  });
  pongSocket.send(message);

  modal.destroy();

  modal = DomUtils.createModal("main.waitingForStart", [
    {
      text: "main.remote.leaveTournament",
      onClick: () => leaveTournament(ownerUsername),
      closeModal: true,
    },
  ]);

  let contentWrapper = document.getElementById("modal-content-wrapper");
  contentWrapper.style.display = "flex";

  let wrapperTitle = document.createElement("div");
  wrapperTitle.classList.add("modal-title-small");
  wrapperTitle.setAttribute("data-i18n", "main.remote.players");

  contentWrapper.appendChild(wrapperTitle);

  let playerButtons = [];

  pongSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    if (data.type === "notify_tournament") {
      playerButtons.forEach((button) => button.remove());
      playerButtons = [];
      // Add a new button for each game
      data.players.forEach((username) => {
        let playerButton = document.createElement("div");
        playerButton.classList.add("modal-text");
        playerButton.textContent = `${username}`;

        contentWrapper.appendChild(playerButton);
        // Store the button in the array
        playerButtons.push(playerButton);
      });
    }

    if (data.type === "start_tournament") {
      let players = JSON.parse(data.players);
      DomUtils.initializeTable(players);
      modal.destroy();
      setUpGameObjectListeners();
      game.player1 = data.player1;
      game.player2 = data.player2;
    }

    if (data.type === "host_disconnect") {
      modal.destroy();
      DomUtils.hideGameElements();
      destroyPowerups();
      showDisconnectModal();
    }
  };
}

function leaveTournament(ownerUsername) {
  const message = JSON.stringify({
    action: "leave_tournament",
    username: userData.username,
    ownerUsername: ownerUsername,
  });
  pongSocket.send(message);

  showMainMenuRemote();
}

function setUpGameObjectListeners() {
  ({ ball, rect, centerX, centerY, leftPaddle, rightPaddle } =
    DomUtils.initializeGameElements("field"));

  ({ ballElement, lpElement, rpElement } =
    DomUtils.initializeAndPlaceGameElements(leftPaddle, rightPaddle, ball));

  DomUtils.hideGameElements();

  DomUtils.showTournamentTable(false, null);

  pongSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    if (data.type === "bu") {
      ball.x = rect.left + data.bx * rect.width;
      ball.y = rect.top + data.by * rect.height;
      leftPaddle.y = data.p1 * rect.height + rect.top;
      rightPaddle.y = data.p2 * rect.height + rect.top;
      movePaddles();
      updateElementPosition(ballElement, ball.x, ball.y);
      updateElementPosition(lpElement, leftPaddle.x, leftPaddle.y);
      updateElementPosition(rpElement, rightPaddle.x, rightPaddle.y);
      render();
      return;
    }

    if (data.type === "point_scored") {
      game.player1Score = data.player1Score;
      game.player2Score = data.player2Score;
      DomUtils.updateScores(game);
    }

    if (data.type === "next_match") {
      DomUtils.initializeAndPlaceGameElements(leftPaddle, rightPaddle, ball);
      let endOfGameModal = document.getElementById("end-of-game-modal");
      endOfGameModal.style.display = "none";

      game.player1 = data.player1;
      game.player2 = data.player2;
      game.resetScores();

      DomUtils.updateScoreCards(game);
      DomUtils.updateScores(game);

      removePaddleListener();

      if (data.player1 === userData.username) {
        myPaddle = leftPaddle;
        addPaddleListener();
      } else if (data.player2 === userData.username) {
        myPaddle = rightPaddle;
        addPaddleListener();
      } else {
        myPaddle = null;
      }
    }

    if (data.type === "table_info") {
      let tableInfo = JSON.parse(data.info);

      DomUtils.updateTable(tableInfo);
    }

    if (data.type === "match_over") {
      game.player1 = data.nextPlayer1;
      game.player2 = data.nextPlayer2;
      DomUtils.hideGameElements();
      game.resetScores();
      destroyPowerups();
      addPowerupRemote(lpElement);
      addPowerupRemote(rpElement);
      DomUtils.showTournamentTable(false, null);

      //console.log(data);

      // Record the game if the user is player1 - Otherwise it gets recorded twice!
      if (userData.username === data.player1) {
        writeMatchData(data);
      }
    }

    if (data.type === "tournament_over") {
      DomUtils.hideGameElements();
      destroyPowerups();
      let countdownContainer = document.getElementById("countdown-container");
      countdownContainer.style.display = "none";
      DomUtils.showTournamentTable(true, showMainMenuRemote);

      game.resetScores();
      game.player1 = "";
      game.player2 = "";
      DomUtils.updateScoreCards(game);
      DomUtils.updateScores(game);

      // Record the game if the user is player1 - Otherwise it gets recorded twice!
      if (userData.username === data.player1) {
        writeMatchData(data);
      }
    }

    if (data.type === "host_disconnect") {
      showDisconnectModal();
    }

    if (data.type === "countdown") {
      createCountdownModal(data.number);
    }

    if (data.type === "paddle_speed") {
      if (data.speed === "SLOW") {
        addPowerupRemote(
          data.paddle === "LEFT" ? lpElement : rpElement,
          "glow-green"
        );
      } else if (data.speed === "FAST") {
        addPowerupRemote(
          data.paddle === "LEFT" ? lpElement : rpElement,
          "glow-orange"
        );
      } else {
        addPowerupRemote(lpElement);
        addPowerupRemote(rpElement);
      }
    }

    if (data.type === "spawn_powerup") {
      spawnPowerupRemote(data);
    }

    if (data.type === "remove_powerup") {
      powerupObjects.filter((obj) => {
        if (obj.idx === data.idx) {
          if (obj.element) {
            obj.element.remove();
          }
          return false;
        }
        return true;
      });
    }
  };
}

async function writeMatchData(data) {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  //console.log(data);

  fetch(`api/auth/matches/history/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      player1: data.player1,
      player2: data.player2,
      p1Score: data.p1Score,
      p2Score: data.p2Score,
    }),
  })
    .then((response) => response.json())
    .catch((error) => console.error("Error:", error));
}

function createCountdownModal(number) {
  let countdownContainer = document.getElementById("countdown-container");
  countdownContainer.style.display = "flex";

  let nextGamePlayers = document.getElementById("countdown-next-game-players");
  nextGamePlayers.textContent = `${game.player1} - ${game.player2}`;

  let countdownElement = document.getElementById("countdown-number");
  countdownElement.textContent = number;
}

function showDisconnectModal() {
  game.player1 = "";
  game.player2 = "";
  game.player1Score = 0;
  game.player2Score = 0;

  DomUtils.hideGameElements();
  destroyPowerups();
  DomUtils.updateScoreCards(game);
  DomUtils.updateScores(game);

  DomUtils.createModal("main.remote.connectionLost", [
    {
      text: "main.remote.mainMenu",
      onClick: showMainMenuRemote,
      closeModal: true,
    },
  ]);
}

function getPowerupText(type) {
  switch (type) {
    case Powerup.COIN:
      return "🤑";
    case Powerup.SLOW:
      return "🐢";
    case Powerup.FAST:
      return "🐇";
    case Powerup.SKULL:
      return "💥";
    default:
      return "🤑";
  }
}

function spawnPowerupRemote(data) {
  const gameField = document.getElementById("field");

  let powerupX = rect.left + data.x * rect.width;
  let powerupY = rect.top + data.y * rect.height;

  const emoji = getPowerupText(data.powerup_type);

  const coin = document.createElement("div");
  coin.textContent = emoji;
  coin.style.position = "absolute";
  coin.style.fontSize = `${data.height * rect.height}px`;
  coin.style.left = `${powerupX}px`;
  coin.style.top = `${powerupY}px`;
  gameField.appendChild(coin);

  powerupObjects.push({
    type: data.powerup_type,
    idx: data.idx,
    element: coin,
    x: data.x,
    y: data.y,
    height: data.height,
  });
}

function respawnPowerups() {
  powerupObjects.forEach((p) => {
    let element = p.element;

    let powerupX = rect.left + p.x * rect.width;
    let powerupY = rect.top + p.y * rect.height;

    element.style.fontSize = `${p.height * rect.height}px`;
    element.style.left = `${powerupX}px`;
    element.style.top = `${powerupY}px`;
  });
}

function addPowerupRemote(element, powerupClass) {
  element.classList.remove("glow-green");
  element.classList.remove("glow-orange");

  if (powerupClass) {
    element.classList.add(powerupClass);
  }
}

function destroyPowerups() {
  if (!powerupObjects) {
    return;
  }

  powerupObjects.forEach((powerup) => {
    if (powerup.element) {
      powerup.element.remove();
    }
  });
}

function showMainMenuRemote() {
  remoteInProgress = false;
  showMainMenu();
  pongSocket.close();
}
