import { showMainMenu } from "./game/game-local.js";
import { applyTranslations } from "./translations.js";

export function renderMainPage() {
  const pageContainer = document.getElementById("pageContainer");
  pageContainer.className = "main-page";
  const body = document.querySelector("body");
  body.className = "main-page-body";
  pageContainer.innerHTML = `
          <nav class="main-navbar tiny5">
      <div class="nav-logo">
        <img src="static/img/logoPingPong.png" alt="Logo" class="logo-img" data-i18n-alt="main.logoAlt">
      </div>
      <div class="nav-right">
        <div class="nav-links">
        <a id="tutorial-link" data-i18n="main.tutorial.link">Tutorial</a>
          <a href="/profile" id="profile-link" onclick="navigateTo('/profile')" data-i18n="main.profile">Profile</a>
          <img src="static/img/profile_pictures/cat.png" alt="User Image" class="user-img" id="user-img">
        </div>
      </div>
    </nav>
    <div class="main-content tiny5">

      <div class="content-three-column">
          <div class="content-column">${generateLeftColumn()}</div>
          <div class="content-middle-column">${generateMiddleColumn()}</div>
          <div class="content-column">${generateRightColumn()}</div>
      </div>
    </div>
    ${generateTutorial()}
    `;
  showMainMenu();
  applyTranslations();
  fetchUserDataMain();
}

function generateMiddleColumn() {
  return `<div class="scoreboard" id="scoreboard">
              <div class="scorecard" >
                  <div id="scorecard-p1"></div>
                  <div id="score-p1">0</div>
              </div>
              <div class="scorecard">
                  <div id="scorecard-p2"></div>
                  <div id="score-p2">0</div>
              </div>
          </div>
          <div class="game-box" tabindex="-1" id="field">
            <div id="ball"></div>
            <div id="left-paddle" class="paddle"></div>
            <div id="right-paddle" class="paddle"></div>
            <div class="modal" id="changeable-modal">
              <div id="changeable-modal-title" class="modal-title" data-i18n="main.startMenu.header">Pick a game mode</div>
              <div id="modal-content-wrapper" class="modal-content" style="display: none;"></div>
              <div id="modal-button-container" class="button-container"></div>
            </div>
            <div class="modal" id="end-of-game-modal">
            <div class="modal-content" id="table-container">
              <div class="modal-title" data-i18n="main.scoreTable.header"></div>
                <table class="score-table" id="score-table">
                  <thead>
                    <tr>
                      <th scope="col" data-i18n="main.scoreTable.name"></th>
                      <th scope="col" data-i18n="main.scoreTable.wins"></th>
                      <th scope="col" data-i18n="main.scoreTable.losses"></th>
                      <th scope="col" data-i18n="main.scoreTable.pointsFor"></th>
                      <th scope="col" data-i18n="main.scoreTable.pointsAgainst"></th>
                    </tr>
                  </thead>
                  <tbody id="table-body">
                    <tr id="sample-row">
                      <th scope="row">Sample name</th>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                    </tr>
                  </tbody>
                </table>
                <div id="countdown-container" class="countdown">
                  <div id="countdown-next-game" class="modal-title">
                    <div id="countdown-next-game-text" data-i18n="main.remote.nextGame"></div>
                    <div id="countdown-next-game-players"></div>
                  </div>
                  <div id="countdown-number" class="modal-title"></div>
                </div>
                <button id="next-game-button" class="modal-border-button" data-i18n="main.victoryModal.okButton"></button>
          </div>
        </div>
          </div>`;
}

function generateRightColumn() {
  return `<div class="chat-container-full" id="global-chat-container">
            <h1 data-i18n="main.chat.globalChatroom"></h1>
            <div id="chat-log" class="chat-log"></div>
            <div id="chat-inputs" class="input-container-chat">
                <input id="chat-message-input" class="message-input" type="text">
                <button id="chat-message-submit" class="message-submit">
                  <img src="static/img/message-send.svg" alt="Send" class="svg-icon">
                </button>
            </div>
            <div>
                <span data-i18n="main.chat.remainingChars"></span><span id="char-remaining-global">300</span>
            </div>
          </div>

          <div class="chat-container-full" id="private-chat">
            <h2><div id="private-chat-title" data-i18n="main.chat.privateChat"></div>
            <div id="private-chat-title-name"></div></h2>
            <div class="modal-border-button" id="global-chat-button" data-i18n="main.chat.back">Back to global chat</div>
            <div id="private-chat-log" class="chat-log"></div>
            <div id="private-chat-inputs" class="input-container-chat">
                <input id="private-chat-message-input" class="message-input" type="text">
                <button id="private-chat-message-submit" class="message-submit">
                  <img src="static/img/message-send.svg" alt="Send" class="svg-icon">
                </button>
            </div>
            <div>
                <span data-i18n="main.chat.remainingChars"></span><span id="char-remaining-private">300</span>
            </div>
          </div>
  `;
}

function generateLeftColumn() {
  return ` <div class="chat-container" id="user-profile-container">
                <div id="profile-info">

                </div>
            </div>
            <div class="chat-container" id="user-list-container">
              <h3 data-i18n="main.chat.activeUsers"></h3>
              <div id="user-list"></div>
            </div>
            
            `;
}

function generateTutorial() {
  return ` 
<div class="tutorial-container tiny5" id="tutorial-container">
  <div class="x button" id="tutorial-close">X</div>
  <div class="modal-title" id="tutorial-container" data-i18n="main.tutorial.title"></div>
  <div class="modal-text" id="tutorial-container" data-i18n="main.tutorial.localControls"></div>
  <div class="modal-text" id="tutorial-container" data-i18n="main.tutorial.remoteControls"></div>
  <div class="spacer"></div>
  <div class="modal-title" id="tutorial-container" data-i18n="main.tutorial.title2"></div>
  <div class="modal-text" id="tutorial-container" data-i18n="main.tutorial.powerup1"></div>
  <div class="modal-text" id="tutorial-container" data-i18n="main.tutorial.powerup2"></div>
  <div class="modal-text" id="tutorial-container" data-i18n="main.tutorial.powerup3"></div>
  <div class="modal-text" id="tutorial-container" data-i18n="main.tutorial.powerup4"></div>
</div>

`;
}

async function fetchUserDataMain() {
  const username = sessionStorage.getItem("username");
  if (!username) {
    console.error("No username found in sessionStorage");
    return;
  }

  const profileImgElement = document.getElementById("user-img");
  if (profileImgElement) {
    const profilePictureUrl = `media/avatars/${username}_avatar.jpg?timestamp=${new Date().getTime()}`;
    profileImgElement.src = profilePictureUrl;
    profileImgElement.onerror = function () {
      profileImgElement.src = "static/img/profile_pictures/cat.png";
    };
  } else {
    console.error("profile-img element not found");
  }
}
