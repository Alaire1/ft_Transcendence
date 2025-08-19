import { createGameFromInvite, joinGame } from "../game/game-remote.js";
import { isPongPlus } from "../game/game-local.js";
import { applyTranslations } from "../translations.js";
import {
  getBerlinTimeWithMilliseconds,
  showFunctionName,
  show_displayUserProfile,
  show_openUserProfile,
} from "./debug_chat.js";

import {
  opened_profile,
  opened_profile_name,
  opened_profile_last,
  game_invites,
  blocked,
  globalChatSocket,
  setOpenedProfile,
  setOpenedProfileName,
  setOpenedProfileLast,
} from "./global_chat.js";

import { fetchMatchHistorySimple } from "./userlist_chat.js";

import * as Utils from "./utils_chat.js";

//console.log(getBerlinTimeWithMilliseconds() + "profile_chat.js loaded ");

async function displayUserProfile(profile, window_name) {
  (showFunctionName || show_displayUserProfile) &&
    console.log(getBerlinTimeWithMilliseconds() + "()displayUserProfile");

  const profileContainer = document.querySelector("#user-profile-container");

  if (!profile) {
    show_displayUserProfile && console.log("NO Profile!!!");
    profileContainer.innerHTML = `
        <h3>Profile of <span id="profile-username" class="clickable"></span></h3>
        `;
  } else {
    
    let matchData = await fetchMatchHistorySimple(profile.user_name);

    profile.games_won = matchData.wins;
    profile.games_lost = matchData.losses;

    // check if blocked_by is definded and an array
    const isBlockedByUser =
      profile.blocked_by && Array.isArray(profile.blocked_by)
        ? profile.blocked_by.includes(window_name)
        : false;
    const isBlocked =
      profile.blocked_users && Array.isArray(profile.blocked_users)
        ? profile.blocked_users.includes(profile.user_name)
        : false;

    //show_displayUserProfile &&
    //  console.log(
    //    getBerlinTimeWithMilliseconds() +
    //      "   profile.self_name: " +
    //      profile.self_name
    //  );
    //show_displayUserProfile &&
    //  console.log(
    //    getBerlinTimeWithMilliseconds() +
    //      "   profile.user_name: " +
    //      profile.user_name
    //  );
    //show_displayUserProfile &&
    //  console.log(
    //    getBerlinTimeWithMilliseconds() + "   window_name      : " + window_name
    //  );

    profileContainer.innerHTML = `
            <div class="modal-title-small"> 
              <span data-i18n="main.chat.profileOf"></span>
              <span id="profile-username">${profile.user_name}</span>
            </div>
            `;

    profileContainer.innerHTML += `
           <div id="profile-info">
           <div class="modal-text-left"></div>
           <div class="modal-text-left">
           <span data-i18n="main.chat.gamesWon"></span><span>${profile.games_won}</span>
           </div>
           <div class="modal-text-left">
             <span data-i18n="main.chat.gamesLost"></span><span>${profile.games_lost}</span>
           </div>
               `;
    if (profile.user_name != window_name) {
      let isBlocked = blocked.includes(profile.user_name);

      let translation = isBlocked ? "main.chat.unblock" : "main.chat.block";

      profileContainer.innerHTML += `
                <button id="block-user-button" class="modal-border-button" data-i18n="${translation}" 
                data-username="${profile.user_name}">
                </button>
                </div>`;
    } else {
      // hide Block Button cause it´s my profile
      profileContainer.innerHTML += `
                <button hidden class="modal-border-button" id="block-user-button"  data-username="${profile.user_name}">
                </div>`;
    }

    if (profile.user_name !== window_name) {
      // Show the invite button or accept invitation button

      //show_displayUserProfile &&
      //  console.log(
      //    "460  user_name: " +
      //      profile.user_name +
      //      "   currentUser: " +
      //      window_name
      //  );
      if (
        Utils.hasUnacceptedEntry(game_invites, profile.user_name, window_name)
      ) {
        profileContainer.innerHTML += `<button class="modal-border-button" id="accept-invite-button" data-i18n="main.chat.accept"></button>`;
      } else {
        if (profile.blocked_by.includes(window_name)) {
          profileContainer.innerHTML += `<button hidden class="modal-border-button" id="invite-user-button" data-i18n="main.chat.invite"></button>`;
        } else {
          if (profile.blocked_users.includes(window_name)) {
            profileContainer.innerHTML += `<button hidden class="modal-border-button" id="invite-user-button" data-i18n="main.chat.invite"></button>`;
          } else {
            if (Utils.isPlayer1InData(game_invites, window_name)) {
              profileContainer.innerHTML += `<button disabled class="modal-border-button" id="invite-user-button" data-i18n="main.chat.invite"></button>`;
            } else if (
              Utils.hasAcceptedEntry(
                game_invites,
                profile.user_name,
                window_name
              )
            ) {
              profileContainer.innerHTML += `<button disabled class="modal-border-button" id="invite-user-button" data-i18n="main.chat.invite">Invite to Game</button>`;
            } else {
              profileContainer.innerHTML += `<button class="modal-border-button" id="invite-user-button" data-i18n="main.chat.invite">Invite to Game</button>`;
            }
          }
        }
      }

      //profileContainer.innerHTML += `<button class="modal-border-button" id="add-friend-button">Add friend</button>`;
    }

    // Event Listener for Invite button
    document
      .querySelector("#invite-user-button")
      ?.addEventListener("click", function () {
        const invitedUser = profile.user_name;
        show_displayUserProfile &&
          console.log(
            getBerlinTimeWithMilliseconds() + " clicked invite-user-button"
          );

        // Open WebSocket only if not already open
        // Create the modal element
        const modal = document.createElement("div");
        modal.classList.add("yes-no-modal", "tiny5");

        // Create Yes and No buttons
        const yesButton = document.createElement("button");
        yesButton.classList.add("modal-border-button");
        yesButton.setAttribute("data-i18n", "main.chooseGame.pongPlus");

        const noButton = document.createElement("button");
        noButton.classList.add("modal-border-button");
        noButton.setAttribute("data-i18n", "main.chooseGame.pongStandard");

        function sendGameInvite() {
          if (
            globalChatSocket &&
            globalChatSocket.readyState === WebSocket.OPEN
          ) {
            globalChatSocket.send(
              JSON.stringify({
                type: "game_invite",
                from_user: window_name,
                to_user: invitedUser,
              })
            );
            // console.log(
            //   getBerlinTimeWithMilliseconds() +
            //     ` Sent game invite to ${invitedUser} for ${
            //       isPongPlus ? "Pong Plus" : "Pong Standard"
            //     }`
            // );
          } else {
            console.error("WebSocket is not open. Unable to send game invite.");
          }
        }

        noButton.addEventListener("click", () => {
          closeModal();
          createGameFromInvite(false);
          sendGameInvite();
        });

        yesButton.addEventListener("click", () => {
          closeModal();
          createGameFromInvite(true);
          sendGameInvite();
        });

        // Append buttons to the modal
        modal.appendChild(yesButton);
        modal.appendChild(noButton);

        // Position it relative to the invite button
        const inviteButton = document.querySelector("#invite-user-button");
        if (inviteButton) {
          const rect = inviteButton.getBoundingClientRect();
          modal.style.position = "absolute";
          modal.style.left = `${rect.right + 5}px`; // 5px to the right
          modal.style.top = `${rect.top}px`;
        }

        // Append to the body
        document.body.appendChild(modal);

        // Function to close modal
        function closeModal() {
          modal.remove();
          document.removeEventListener("click", outsideClickListener);
        }

        // Click outside detection
        function outsideClickListener(event) {
          if (!modal.contains(event.target) && event.target !== inviteButton) {
            closeModal();
          }
        }

        // Add event listener to detect outside clicks
        document.addEventListener("click", outsideClickListener);

        applyTranslations();
      });

    // Event Listener for Accept Invitation button
    document
      .querySelector("#accept-invite-button")
      ?.addEventListener("click", function () {
        //show_displayUserProfile &&
        //  console.log(
        //    `clicking Accepting invitation from ${profile.user_name}`
        //  );
        const invitedUser = profile.user_name;

        if (
          globalChatSocket &&
          globalChatSocket.readyState === WebSocket.OPEN
        ) {
          globalChatSocket.send(
            JSON.stringify({
              type: "accept_invite",
              from_user: invitedUser,
              to_user: window_name,
            })
          );
          joinGame(profile.user_name);
        }
      });
  }
  // Animation for Profile
  // profileContainer.classList.remove("animated"); // remove animation
  // void profileContainer.offsetWidth; // Trigger Reflow (Hack, to start new Animation)
  // profileContainer.classList.add("animated"); // add Animation

  // if there is no profile ... leave the function
  if (!profile) return;

  //if (window_name === profile.user_name) {
  //  document
  //    .querySelector("#display-name-input")
  //    .addEventListener("keyup", function (e) {
  //      if (e.keyCode === 13) {
  //        //show_displayUserProfile &&
  //        //  console.log(
  //        //    getBerlinTimeWithMilliseconds() +
  //        //      "Enter key pressed in dp name input field"
  //        //  );
  //        document.querySelector("#save-display-name-button").click();
  //      }
  //    });
  //
  //  document
  //    .querySelector("#save-display-name-button")
  //    .addEventListener("click", function () {
  //      //show_displayUserProfile &&
  //      //  console.log(getBerlinTimeWithMilliseconds() + "clicked SAVE Button");
  //
  //      const newDisplayName = document
  //        .querySelector("#display-name-input")
  //        .value.trim();
  //      if (
  //        globalChatSocket &&
  //        globalChatSocket.readyState === WebSocket.OPEN
  //      ) {
  //        globalChatSocket.send(
  //          JSON.stringify({
  //            type: "update_display_name",
  //            user_name: profile.user_name,
  //            new_display_name: newDisplayName,
  //          })
  //        );
  //      }
  //    });
  //}

  document.addEventListener("gameInvitesUpdated", () => {
    //console.log("Heyho");
    displayUserProfile(opened_profile, window_name); // Call your function here
  });

  document
    .querySelector("#block-user-button")
    .addEventListener("click", function () {
      const userToBlock = this.getAttribute("data-username");
      let isBlocked = blocked.includes(profile.user_name);

      //show_displayUserProfile &&
      //  console.log(
      //    getBerlinTimeWithMilliseconds() + "click #block-user-button  << "
      //  );

      if (isBlocked == false) {
        if (
          globalChatSocket &&
          globalChatSocket.readyState === WebSocket.OPEN
        ) {
          globalChatSocket.send(
            JSON.stringify({
              type: "block_user",
              user_to_block: userToBlock,
            })
          );
        }
      } else {
        if (
          globalChatSocket &&
          globalChatSocket.readyState === WebSocket.OPEN
        ) {
          globalChatSocket.send(
            JSON.stringify({
              type: "un-block_user",
              user_to_block: userToBlock,
            })
          );
        }
      }
    });

  applyTranslations();
}
export function openUserProfile(user, window_name, userprofiles) {
  // console.log("USER AND WINDOW NAME");
  // console.log(user);
  // console.log(window_name);
  //(show_openUserProfile || showFunctionName) &&
  //  console.log(
  //    getBerlinTimeWithMilliseconds() + `()openUserProfil for user: ${user}`
  //  );
  //if (user === "Chat-Server 2000") {
  //  show_displayUserProfile &&
  //    console.log(getBerlinTimeWithMilliseconds() + "--- NOT OPENING PROFILE ");
  //  return;
  //}

  if (userprofiles[user]) {
    setOpenedProfile(JSON.parse(JSON.stringify(userprofiles[user])));
  } else {
    setOpenedProfile(null);
    setOpenedProfileName("");
  }

  if (
    !Utils.deepEqual(opened_profile, opened_profile_last) ||
    Utils.isPlayer1InData(game_invites, window_name) ||
    Utils.isPlayer2InData(game_invites, window_name)
  ) {
    //show_openUserProfile &&
    //  console.log(
    //    getBerlinTimeWithMilliseconds() +
    //      "new or changed user profile ... " +
    //      user
    //  );
    setOpenedProfileName(user);
    /*show_openUserProfile && */ displayUserProfile(
      opened_profile,
      window_name
    );

    if (opened_profile && opened_profile_name) {
      setOpenedProfileName(userprofiles[user].user_name);
      show_openUserProfile &&
        console.log("opened_profile_name " + opened_profile_name);
      setOpenedProfileLast(JSON.parse(JSON.stringify(userprofiles[user])));
    }
  } else {
    //show_openUserProfile &&
    //  console.log(
    //    getBerlinTimeWithMilliseconds() + "same user profile ... " + user
    //  );
  }
}
