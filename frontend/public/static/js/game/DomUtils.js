import { applyTranslations } from "../translations.js";
import { showMainMenu } from "./game-local.js";
import Ball from "./game-objects/Ball.js";
import Paddle from "./game-objects/Paddle.js";

export const BALL_HEIGHT = 12;
export const BALL_RADIUS = 6;

export function createModal(textToShow, buttons = []) {
  const endOfGameModal = document.getElementById("end-of-game-modal");
  endOfGameModal.style.display = "none";

  const modalElement = document.getElementById("changeable-modal");
  modalElement.style.display = "flex";

  const modalText = document.getElementById("changeable-modal-title");
  modalText.setAttribute("data-i18n", textToShow);

  const contentWrapper = document.getElementById("modal-content-wrapper");
  contentWrapper.style.display = "none";

  const buttonContainer = document.getElementById("modal-button-container");

  contentWrapper.replaceChildren();
  buttonContainer.replaceChildren();

  applyTranslations();

  if (buttons.length === 0) {
    return modalElement;
  }

  let buttonElements = [];
  let currentButtonIndex = 0;

  const gameBox = document.getElementById("field");
  gameBox.focus();

  modalElement.destroy = () => {
    gameBox.focus();
    modalElement.style.display = "none";
    buttonElements.forEach((b) => b.remove());
    document.removeEventListener("keydown", handleKeydown);
  };

  let idx = 0;
  const createButton = ({ text, onClick, closeModal }) => {
    const button = document.createElement("button");
    button.classList.add("modal-button");
    button.setAttribute("data-i18n", text);
    button.idx = idx;
    idx++;

    addEventListeners(button, onClick, closeModal);

    return button;
  };

  const addEventListeners = (button, onClick, closeModal) => {
    button.addEventListener("click", () => {
      document.removeEventListener("keydown", handleKeydown);
      if (closeModal) {
        modalElement.style.display = "none";
        buttonElements.forEach((b) => b.remove());
        contentWrapper.replaceChildren();
      }
      if (typeof onClick === "function") {
        onClick();
      }
    });

    button.addEventListener("mouseenter", () => {
      buttonElements.forEach((b) => b.classList.remove("selected-button"));
      button.classList.add("selected-button");
      currentButtonIndex = button.idx;
    });
  };

  const selectButtonByIndex = (index) => {
    buttonElements.forEach((b) => b.classList.remove("selected-button"));
    buttonElements[index].classList.add("selected-button");
  };

  const handleKeydown = (event) => {
    if (!gameBox.contains(document.activeElement)) {
      return;
    }

    if (event.key === "ArrowDown") {
      currentButtonIndex = (currentButtonIndex + 1) % buttonElements.length;
      selectButtonByIndex(currentButtonIndex);
    } else if (event.key === "ArrowUp") {
      currentButtonIndex =
        (currentButtonIndex - 1 + buttonElements.length) %
        buttonElements.length;
      selectButtonByIndex(currentButtonIndex);
    } else if (
      event.key === " " ||
      (event.key == "Enter" && currentButtonIndex !== -1)
    ) {
      buttonElements[currentButtonIndex].click();
    }
  };

  document.addEventListener("keydown", handleKeydown);

  // Add all initial buttons
  buttons.forEach((buttonData) => {
    const button = createButton(buttonData);
    buttonContainer.appendChild(button);
    buttonElements.push(button);
  });

  // Auto-select first button
  if (buttonElements.length > 0) {
    buttonElements[0].classList.add("selected-button");
  }

  // **Add a method to dynamically add new buttons**
  modalElement.addButton = (buttonElement, onClick, closeModal) => {
    //console.log("Adding event listeners");
    addEventListeners(buttonElement, onClick, closeModal);
    buttonElements.push(buttonElement);
    applyTranslations();
  };

  return modalElement;
}

export function initializeGameElements(fieldId) {
  const field = document.getElementById(fieldId);
  const rect = field.getBoundingClientRect();

  const centerX = rect.left + (rect.right - rect.left) / 2;
  const centerY = rect.top + (rect.bottom - rect.top) / 2;

  const ball = new Ball(centerX, centerY, 0);

  const leftPaddle = new Paddle(
    rect.left + 10,
    centerY - rect.height / 10,
    rect.height / 5
  );

  const rightPaddle = new Paddle(
    rect.right - 20,
    centerY - rect.height / 10,
    rect.height / 5
  );

  return {
    ball,
    rect,
    centerX,
    centerY,
    leftPaddle,
    rightPaddle,
  };
}

export function initializeAndPlaceGameElements(
  leftPaddle,
  rightPaddle,
  ball,
  hide
) {
  // showScoreCards();

  let field = document.getElementById("field");
  let rect = field.getBoundingClientRect();

  const centerX = rect.left + (rect.right - rect.left) / 2;
  const centerY = rect.top + (rect.bottom - rect.top) / 2;

  leftPaddle.x = rect.left + 10;
  rightPaddle.x = rect.right - 20;
  leftPaddle.height = rect.height / 5;
  rightPaddle.height = rect.height / 5;

  ball.x = centerX;
  ball.y = centerY;

  const elements = {
    ballElement: document.getElementById("ball"),
    lpElement: document.getElementById("left-paddle"),
    rpElement: document.getElementById("right-paddle"),
    rect: rect,
  };

  // Initialize styles for paddles
  elements.lpElement.style.transform = `translate(${leftPaddle.x}px, ${leftPaddle.y}px)`;
  elements.lpElement.style.height = leftPaddle.height + "px";
  elements.lpElement.style.display = hide ? "none" : "block";

  elements.rpElement.style.transform = `translate(${rightPaddle.x}px, ${rightPaddle.y}px)`;
  elements.rpElement.style.height = rightPaddle.height + "px";
  elements.rpElement.style.display = hide ? "none" : "block";

  // Initialize styles for ball
  elements.ballElement.style.transform = `translate(${ball.x}px, ${ball.y}px)`;
  elements.ballElement.style.height = `${BALL_HEIGHT}px`;
  elements.ballElement.style.width = `${BALL_HEIGHT}px`;
  elements.ballElement.style.display = hide ? "none" : "block";

  return elements;
}

// function showScoreCards() {
// let scoreboard = document.getElementById("scoreboard");
// scoreboard.style.display = "flex";
// }

export function hideGameElements() {
  let ballElement = document.getElementById("ball");
  let lpElement = document.getElementById("left-paddle");
  let rpElement = document.getElementById("right-paddle");

  // Initialize styles for paddles
  lpElement.style.display = "none";
  rpElement.style.display = "none";
  ballElement.style.display = "none";

  // hideScoreCards();
}

// function hideScoreCards() {
// let scoreboard = document.getElementById("scoreboard");
// scoreboard.style.display = "none";
// }

export function updateTable(tournamentTableInfo) {
  for (let i = 0; i < tournamentTableInfo.length; i++) {
    const playerInfo = tournamentTableInfo[i];

    let elementToUpdate = document.getElementById(
      playerInfo.name + "-table-row"
    );

    if (!elementToUpdate) {
      //console.log("Couldn't update for player: ");
      //console.log(playerInfo);

      //console.log("Tournament info: ");
      //console.log(tournamentTableInfo);
    }

    elementToUpdate.children[1].textContent = playerInfo.wins;
    elementToUpdate.children[2].textContent = playerInfo.losses;
    elementToUpdate.children[3].textContent = playerInfo.pointsFor;
    elementToUpdate.children[4].textContent = playerInfo.pointsAgainst;
  }

  sortScoreTable();
}

export function initializeTable(playerHandles) {
  // Remove all previous player rows
  document
    .querySelectorAll("[id$='-table-row']")
    .forEach((row) => row.remove());

  let tableBody = document.getElementById("table-body");
  let sampleRow = document.getElementById("sample-row");
  // table init
  for (let i = 0; i < playerHandles.length; i++) {
    const handle = playerHandles[i];

    let newPlayerElement = sampleRow.cloneNode(true);
    newPlayerElement.style.display = "table-row";
    newPlayerElement.id = handle + "-table-row";
    newPlayerElement.children[0].textContent = handle;

    tableBody.appendChild(newPlayerElement);
  }
}

export function sortScoreTable() {
  const table = document.getElementById("score-table");
  const tbody = table.querySelector("tbody");

  // Get all rows as an array
  const rows = Array.from(tbody.querySelectorAll("tr"));

  // Sort rows
  rows.sort((a, b) => {
    const cellA = a.children[1].textContent.trim();
    const cellB = b.children[1].textContent.trim();

    const valueA = isNaN(cellA) ? cellA : parseFloat(cellA);
    const valueB = isNaN(cellB) ? cellB : parseFloat(cellB);

    if (valueA < valueB) return 1;
    if (valueA > valueB) return -1;

    // First tiebreak - Points scored - Highest wins
    const tiebreakA = a.children[3].textContent.trim();
    const tiebreakB = a.children[3].textContent.trim();

    const valueTiebreakA = isNaN(tiebreakA) ? tiebreakA : parseFloat(tiebreakA);
    const valueTiebreakB = isNaN(tiebreakB) ? tiebreakB : parseFloat(tiebreakB);

    if (valueTiebreakA < valueTiebreakB) return 1;
    if (valueTiebreakA > valueTiebreakB) return -1;

    // Second tiebreak - Points against - Lowest wins
    const secondTiebreakA = a.children[3].textContent.trim();
    const secondTiebreakB = a.children[3].textContent.trim();

    const valueSecondTiebreakA = isNaN(secondTiebreakA)
      ? secondTiebreakA
      : parseFloat(secondTiebreakA);
    const valueSecondTiebreakB = isNaN(secondTiebreakB)
      ? secondTiebreakB
      : parseFloat(secondTiebreakB);
    if (valueSecondTiebreakA > valueSecondTiebreakB) return 1;
    if (valueSecondTiebreakA < valueSecondTiebreakB) return -1;
    return 0;
  });

  // Reattach sorted rows
  rows.forEach((row) => tbody.appendChild(row));
}

export function showVictoryDialog(
  leftPaddle,
  rightPaddle,
  ball,
  startGameCallback
) {
  let countdownContainer = document.getElementById("countdown-container");
  countdownContainer.style.display = "none";

  let endOfGameModal = document.getElementById("end-of-game-modal");
  endOfGameModal.style.display = "flex";

  let tableContainerElement = document.getElementById("table-container");
  tableContainerElement.style.display = "flex";

  const changeableModal = document.getElementById("changeable-modal");
  changeableModal.style.display = "none";

  const button = document.getElementById("next-game-button");
  button.style.display = "block";
  button.textContent = "Next game";

  button.addEventListener("click", () =>
    goNext(leftPaddle, rightPaddle, ball, endOfGameModal, startGameCallback)
  );
}

export function showTournamentTable(isTournamentOver, nextButtonCallback) {
  let endOfGameModal = document.getElementById("end-of-game-modal");

  let tableContainerElement = document.getElementById("table-container");

  endOfGameModal.style.display = "flex";
  tableContainerElement.style.display = "flex";

  const button = document.getElementById("next-game-button");
  button.style.display = isTournamentOver ? "block" : "none";
  button.textContent = isTournamentOver ? "Main menu" : "Next game";

  if (!nextButtonCallback) {
    return;
  }

  button.onclick = () => {
    nextButtonCallback();
    endOfGameModal.style.display = "none";
  };
}

function goNext(
  leftPaddle,
  rightPaddle,
  ball,
  endOfGameModal,
  startGameCallback
) {
  initializeAndPlaceGameElements(leftPaddle, rightPaddle, ball);
  showPressAnyKeyModal();
  document.addEventListener("keydown", startGameCallback);
  endOfGameModal.style.display = "none";
}

export function removeTableFromDOM() {
  document.querySelectorAll('[id*="-table-row"]').forEach((element) => {
    element.remove();
  });
}

export function updateScoreCards(game) {
  let p1ScoreElement = document.getElementById("scorecard-p1");
  p1ScoreElement.innerText = game.player1;
  let p2ScoreElement = document.getElementById("scorecard-p2");
  p2ScoreElement.innerText = game.player2;
}

export function updateScores(game) {
  let p1ScoreElement = document.getElementById("score-p1");
  p1ScoreElement.textContent = game.player1Score;

  let p2ScoreElement = document.getElementById("score-p2");
  p2ScoreElement.textContent = game.player2Score;
}

export function showTournamentModal(tournamentSetupCallback) {
  let modal = createTournamentModal();

  let playerForm = document.getElementById("player-form");
  let playerInput = document.getElementById("player-input");
  let numPlayers = 0;

  playerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    let playerHandle = playerInput.value;
    playerInput.value = "";

    let playerNamesSectionElement = document.getElementById(
      "player-names-section"
    );

    if (!playerHandle) {
      createAlert("alert.game.noEmptyNames");
      return;
    }

    const playerElements = Array.from(document.querySelectorAll("*")).filter(
      (element) => /^player-\d+$/.test(element.id)
    );

    const isPlayerHandleTaken = playerElements.some(
      (element) => element.textContent === playerHandle
    );

    if (isPlayerHandleTaken) {
      createAlert("alert.game.alreadyTaken");
      return;
    }
    if (numPlayers === 5) {
      createAlert("alert.game.maxPlayers");
      return;
    }

    numPlayers += 1;
    let playerNumber = numPlayers;

    let playerWrapper = document.createElement("div");
    playerWrapper.classList.add("player-wrapper");

    let player = document.createElement("div");
    player.id = "player-" + playerNumber;
    player.class = "player";
    player.innerText = playerHandle;
    player.classList.add("player-text");

    let playerRemoveButton = document.createElement("div");
    playerRemoveButton.classList.add("player-remove");
    playerRemoveButton.innerText = "⛔";
    playerRemoveButton.addEventListener("click", () => {
      playerNamesSectionElement.removeChild(playerWrapper);
      numPlayers--;
    });

    playerWrapper.appendChild(player);
    playerWrapper.appendChild(playerRemoveButton);
    playerNamesSectionElement.appendChild(playerWrapper);
  });

  let tournamentSubmit = document.getElementById("tournament-submit-button");

  tournamentSubmit.addEventListener("click", () => {
    if (numPlayers < 3) {
      createAlert("alert.game.notEnoughPlayers");
      return;
    }

    let playerHandles = getPlayerHandlesFromModal();

    modal.destroy();

    tournamentSetupCallback(playerHandles);
  });

  let inputToFocus = document.getElementById("player-input");

  setTimeout(() => {
    inputToFocus.focus();
  }, 100);
}

function getPlayerHandlesFromModal() {
  let playerNamesSectionElement = document.getElementById(
    "player-names-section"
  );

  let children = playerNamesSectionElement.children;
  let playerHandles = [];

  for (let i = 0; i < children.length; i++) {
    const element = children[i];
    if (!element || !element.children || element.children.length === 0) {
      continue;
    }
    const playerName = element.children[0].innerText;
    playerHandles.push(playerName);
  }

  return playerHandles;
}

function createTournamentModal() {
  let modal = createModal("main.tournamentModal.header");

  let contentWrapper = document.getElementById("modal-content-wrapper");
  contentWrapper.style.display = "flex";

  const wrapper = document.createElement("div");
  wrapper.classList.add("two-column-wrapper");

  const leftColumn = document.createElement("div");
  leftColumn.classList.add("modal-column");

  const rightColumn = document.createElement("div");
  rightColumn.classList.add("modal-column");

  const form = document.createElement("form");
  form.id = "player-form";

  const input = document.createElement("input");
  input.classList.add("modal-text-entry");
  input.id = "player-input";

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.classList.add("modal-border-button");
  submit.setAttribute("data-i18n", "main.tournamentModal.submitButton");

  form.appendChild(input);
  form.appendChild(submit);
  contentWrapper.appendChild(wrapper);
  wrapper.appendChild(leftColumn);
  wrapper.appendChild(rightColumn);

  leftColumn.appendChild(form);

  const title2 = document.createElement("div");
  title2.classList.add("modal-title-small");
  title2.setAttribute("data-i18n", "main.tournamentModal.playerSectionHeader");

  rightColumn.appendChild(title2);

  const playerNamesSectionElement = document.createElement("div");
  playerNamesSectionElement.id = "player-names-section";

  rightColumn.appendChild(playerNamesSectionElement);

  const tournamentSubmit = document.createElement("button");
  tournamentSubmit.classList.add("modal-border-button");
  tournamentSubmit.id = "tournament-submit-button";
  tournamentSubmit.setAttribute(
    "data-i18n",
    "main.tournamentModal.playerSectionSubmit"
  );

  const mainMenuButton = document.createElement("button");
  mainMenuButton.classList.add("modal-border-button");
  mainMenuButton.setAttribute("data-i18n", "main.remote.mainMenu");
  mainMenuButton.addEventListener("click", () => {
    modal.destroy();
    showMainMenu();
  });

  rightColumn.appendChild(tournamentSubmit);
  rightColumn.appendChild(mainMenuButton);

  applyTranslations();

  return modal;
}

export function showPressAnyKeyModal() {
  // Create and style the modal
  const modal = document.createElement("div");
  modal.id = "press-any-key-text";
  modal.classList.add("tiny5");

  // Set modal styles
  Object.assign(modal.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "white",
    fontSize: "1.5rem",
    fontWeight: "bold",
    textAlign: "center",
    padding: "20px 40px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
    zIndex: "1000",
    whiteSpace: "nowrap",
  });

  modal.setAttribute("data-i18n", "main.local.pressAnyKey");

  // Append to the body
  document.body.appendChild(modal);

  applyTranslations();

  function removeModal() {
    modal.remove();
    document.removeEventListener("keydown", removeModal);
  }

  // Add a keydown event to remove the modal when any key is pressed
  document.addEventListener("keydown", removeModal);

  const gameBox = document.getElementById("field");
  gameBox.focus();
}

export function createAlert(translationKey, notificationText, okCallback) {
  const prevOverlay = document.getElementById("custom-alert-overlay");

  // Only show one error at a time :)
  if (prevOverlay) {
    return;
  }

  // Create the overlay
  const overlay = document.createElement("div");
  overlay.classList.add("custom-alert-overlay");
  overlay.id = "custom-alert-overlay";

  // Create the alert container
  const alertBox = document.createElement("div");
  alertBox.classList.add("custom-alert");
  alertBox.classList.add("tiny5");
  alertBox.setAttribute("tabindex", "-1"); // Make it focusable

  const alertText = document.createElement("div");
  alertText.setAttribute("data-i18n", translationKey);

  // Create the OK button
  const okButton = document.createElement("button");
  okButton.textContent = "OK"; // You can set a translation key here too if needed
  okButton.classList.add("custom-alert-ok");
  okButton.classList.add("tiny5");

  // Close function
  function closeAlert() {
    overlay.remove();
    document.removeEventListener("keydown", escKeyHandler);
    if (typeof okCallback === "function") {
      okCallback();
    }
  }

  // Click event for OK button
  okButton.addEventListener("click", closeAlert);

  // Escape key event listener
  function escKeyHandler(event) {
    if (event.key === "Escape" || event.key === "Enter") {
      closeAlert();
    }
  }
  document.addEventListener("keydown", escKeyHandler);

  // Append elements
  alertBox.appendChild(alertText);

  // if (notificationText) {
  //   const notifyText = document.createElement("div");
  //   notifyText.textContent = notificationText;
  //   notifyText.style.color = "red";
  //   alertBox.appendChild(notifyText);
  // }

  alertBox.appendChild(okButton);
  overlay.appendChild(alertBox);
  document.body.appendChild(overlay);

  alertBox.focus();

  applyTranslations();
}
