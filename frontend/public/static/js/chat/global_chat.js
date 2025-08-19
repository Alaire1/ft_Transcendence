import {
  getBerlinTimeWithMilliseconds,
  showFunctionName,
  show_initGlobalWebSocket,
  show_sendMessage,
  show_updateUserList,
  prettyPrint,
  show_openUserProfile,
  show_displayUserProfile,
  show_all,
} from "./debug_chat.js";

import { checkToken, isTokenExpired, refreshToken } from "../profile.js";
import * as DomUtils from "../game/DomUtils.js";

// TODO - handleChatMessage könnte in Utils sein.
import { /*handleChatMessage,*/ openPrivateChat } from "./private_chat.js";

import * as Utils from "./utils_chat.js";
import * as Message from "./message_chat.js";
import * as Profile from "./profile_chat.js";
import * as Userlist from "./userlist_chat.js";
import { fetchFriendsList } from "../profile.js";
import { fetchBlockedUserList } from "../profile.js";
import { applyTranslations } from "../translations.js";

// File: global_chat.js
//console.log(getBerlinTimeWithMilliseconds() + "global_chat.js loaded ");

export let globalChatSocket;
export let blocked = [];
export let userProfiles = {}; // Save profiles of all users
export let game_invites = []; // Save all Game invites
let game_invites_old = []; // Save all Game invites

export let opened_profile_name; // saves the profile name of the opened profile and reload it if updates come in
export let opened_profile; // saves the profile      of the opened profile and reload it if updates come in
export let opened_profile_last; // old state

window.name; // name of this logged in USER
window.nameDom; // for getting the name

export function setOpenedProfile(value) {
  opened_profile = value;
}

export function setOpenedProfileName(value) {
  if (!value) {
    console.error(
      "setOpenedProfileName() received an undefined or null value!"
    );
  }
  opened_profile_name = value;
}

export function setOpenedProfileLast(value) {
  opened_profile_last = value;
}

export function initGlobalWebSocket() {
  showFunctionName || show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "()initGlobalWebSocket\nAttempting to initialize global WebSocket connection...");
  const roomName = "global";
  window.nameDom = document.querySelector("#chat-name");

  window.name = sessionStorage.getItem("username") || "";
  //console.log("window.name:", window.name);
  if (!window.name) {
    show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "No name provided, cannot initialize WebSocket.");
    return;
  }

  window.friendList = JSON.parse(sessionStorage.getItem("friendList")) || [];
  //console.log("window.friendList:", window.friendList);
  if (!window.friendList) {
    show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "No friend list provided, cannot initialize WebSocket.");
    return;
  }

  window.blockedList = JSON.parse(sessionStorage.getItem("blockedList")) || [];
  //console.log("window.blockedList:", window.blockedList);
  if (!window.blockedList) {
    show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "No blocked list provided, cannot initialize WebSocket.");
    return;
  }
  blocked = JSON.parse(sessionStorage.getItem("blockedList"));

  if (globalChatSocket && globalChatSocket.readyState !== WebSocket.CLOSED) {
    show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "WebSocket already exists and is not closed, skipping initialization.");
    return;
  }

  //console.log("Starting Web_Socket");

  globalChatSocket = new WebSocket(
    "wss://" +
      window.location.host +
      "/back/wss/chat/" +
      roomName +
      "/" +
      "?name=" +
      encodeURIComponent(window.name) +
      "&friend_list=" +
      encodeURIComponent(JSON.stringify(window.friendList)) +
      "&blocked_list=" +
      encodeURIComponent(JSON.stringify(window.blockedList))
  );

  // console.log(
  //   //"THIS URL: " +
  //   //  "wss://" +
  //   //  window.location.host +
  //   //  "/back/wss/chat/" +
  //   //  roomName +
  //   //  "/" +
  //   "?name=" +
  //     encodeURIComponent(window.name) +
  //     "&friend_list=" +
  //     encodeURIComponent(JSON.stringify(window.friendList)) +
  //     "&blocked_list=" +
  //     encodeURIComponent(JSON.stringify(window.blockedList))
  // );

  globalChatSocket.onopen = function () {
    updateAPIOnlineStatus(true);
    show_initGlobalWebSocket &&
      console.log(getBerlinTimeWithMilliseconds() + "Connected to global chat");
  };

  globalChatSocket.onerror = function (error) {
    show_initGlobalWebSocket &&
      console.error("WebSocket error observed:", error);
  };

  globalChatSocket.onmessage = function (e) {
    show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "Message received from server:", e.data);
    const data = JSON.parse(e.data);

    if (data.type === "chat_message") {
      Message.handleChatMessage(data, false, userProfiles, blocked);
    } else if (data.type === "user_list") {
      show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "refreshed user list received:", data.users);
      show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "User with new messages:", data.newmsg);

      // save Profile
      if (data.updated_profiles) {
        userProfiles = data.updated_profiles; // update globale profiles
        show_initGlobalWebSocket; //&& prettyPrint("userProfiles 89", userProfiles);
      }

      // Save Invites
      if (data.game_invites) {
        //show_initGlobalWebSocket && console.log(getBerlinTimeWithMilliseconds() +"data.game_invites:  " + data.game_invites);

        game_invites = data.game_invites;
        show_initGlobalWebSocket; //&& prettyPrint("user_list game_invites", game_invites);
        game_invites_old = JSON.parse(JSON.stringify(game_invites));
      }
      //console.log("data.newmsg");
      //console.log(data.newmsg);
      Userlist.updateUserList(data.users, data.newmsg, window.name, true);
    } else if (data.type === "user_profile") {
      if (data.updated_profiles) {
        userProfiles = data.updated_profiles; // update  globale Profiles
      }
      //show_initGlobalWebSocket && console.log("USER_PROFILE: DATA");
      //show_initGlobalWebSocket && prettyPrint("data", data);
      //show_initGlobalWebSocket && console.log("------");
    } else if (data.type === "user_profile_update") {
      const currentProfile = document.querySelector("#user-profile-container");
      if (currentProfile) {
        // XXX obsolete?
        const currentUserName = currentProfile
          .querySelector("h3")
          .textContent.split(" ")[2];
      }
    } else if (data.type === "user_block_status_update") {
      // update Blocked USER Status
      const profileContainer = document.querySelector(
        "#user-profile-container"
      );
      if (profileContainer) {
        //console.log("HALLELUJA" + data.blocked_by + " " + blocked);
        const isBlockedByUser = data.blocked_by.includes(
          document.querySelector("#chat-name").value.trim()
        );
        const blockButton = document.querySelector("#block-user-button");
        if (blockButton) {
          blockButton.textContent = isBlockedByUser
            ? "Unblock User"
            : "Block User";
        }
      }
    } else if (data.type === "block") {
      show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "QQ block  >> " + data.block);

      if (!blocked.includes(data.block)) blocked.push(data.block);
      blockUser(data.block);
      show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "  << blocked list: " + blocked);
    } else if (data.type === "unblock") {
      show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "QQ unblock  >> " + data.unblock);

      // delete the unblock name in in blocked list
      let index = blocked.indexOf(data.unblock);
      if (index !== -1) blocked.splice(index, 1);
      UnblockUser(data.unblock);
    } else if (data.type === "new_game_invite") {
      const toUser = data.to_user;
      const fromUser = data.from_user;
      show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + ".onmessage new_game_invite  updateUserListInvitation  >>  toUser: " +toUser +"  fromUser: " +fromUser);

      if (data.game_invites) {
        show_initGlobalWebSocket &&
          console.log(
            getBerlinTimeWithMilliseconds() +
              "new_game_invite data.game_invites:  " +
              data.game_invites
          );
        game_invites = data.game_invites; // update global profiles
      }
      updateUserListInvitation(fromUser);
    } else if (data.type === "invite_accepted") {
      const toUser = data.to_user;
      const fromUser = data.from_user;
      show_initGlobalWebSocket &&
        console.log(
          getBerlinTimeWithMilliseconds() +
            " invite_accepted  >>  toUser: " +
            toUser +
            "  fromUser: " +
            fromUser
        );
      DomUtils.createAlert("alert.chat.gameInviteAccepted");
    }

    if (opened_profile_name) {
      show_initGlobalWebSocket; //&& console.log("12 if (opened_profile_name)");
      //console.log("global_chat.js  opened_profile_name:", opened_profile_name);
      Profile.openUserProfile(opened_profile_name, window.name, userProfiles);
    } else {
      let userLinkElement = document.getElementById("user-link-" + window.name);

      if (userLinkElement) {
        userLinkElement.click();
      }
    }
  };

  globalChatSocket.onclose = function (e) {
    show_initGlobalWebSocket && console.log("Global chat socket closed", e);

    // Create the overlay
    let overlay = document.createElement("div");
    overlay.id = "websocket-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.color = "white";
    overlay.style.flexDirection = "column";
    overlay.style.zIndex = "1000";

    // Create message text
    let message = document.createElement("p");
    message.setAttribute("data-i18n", "main.chat.disconnect");
    message.style.fontSize = "20px";
    message.style.marginBottom = "20px";
    message.classList.add("tiny5");

    // Create the reconnect button
    let reconnectButton = document.createElement("button");
    reconnectButton.setAttribute("data-i18n", "main.chat.reconnect");
    reconnectButton.style.padding = "10px 20px";
    reconnectButton.style.fontSize = "16px";
    reconnectButton.style.cursor = "pointer";
    reconnectButton.style.border = "none";
    reconnectButton.style.backgroundColor = "#4CAF50";
    reconnectButton.style.color = "white";
    reconnectButton.style.borderRadius = "5px";
    reconnectButton.classList.add("tiny5");

    // On button click, remove overlay and reconnect
    updateAPIOnlineStatus(false);
    reconnectButton.onclick = function () {
      document.body.removeChild(overlay);
      redirectFromProfile();
    };

    // Append elements to the overlay
    overlay.appendChild(message);
    overlay.appendChild(reconnectButton);

    // Append overlay to the body
    document.body.appendChild(overlay);
    applyTranslations();
  };

  // Handle sending messages for the global chat
  document
    .querySelector("#chat-message-submit")
    .addEventListener("click", function () {
      show_initGlobalWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + "Submit button clicked for global chat");
      sendMessage(globalChatSocket, false);
      show_initGlobalWebSocket; //&& show_all();

      // TODO - add audio to DOM in JS file
      const audio = document.getElementById("audioPlayer");
      audio.play();
    });

  document
    .querySelector("#chat-message-input")
    .addEventListener("keyup", function (e) {
      if (e.keyCode === 13) {
        document.querySelector("#chat-message-submit").click();
      }
    });

  const backToGlobalButton = document.getElementById("global-chat-button");
  backToGlobalButton.addEventListener("click", () => {
    const privateContainer = document.getElementById("private-chat");
    privateContainer.style.display = "none";

    const globalContainer = document.getElementById("global-chat-container");
    globalContainer.style.display = "flex";
  });
}

function sendMessage(socket, isPrivate = false) {
  show_sendMessage || showFunctionName; //&& console.log(getBerlinTimeWithMilliseconds() + "()sendMessage\nAttempting to send message...");
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket is not open. Cannot send message.");
    return;
  }

  const messageInputDom = isPrivate
    ? document.querySelector("#private-chat-message-input")
    : document.querySelector("#chat-message-input");
  const message = messageInputDom.value.trim();

  if (message === "") {
    show_sendMessage; //&& console.log(getBerlinTimeWithMilliseconds() + "Message is empty, nothing to send");
    return;
  }

  const timestamp = new Date().toLocaleTimeString();

  show_sendMessage; //&& console.log(getBerlinTimeWithMilliseconds() + "Sending message:",message,"from user:",window.name);

  socket.send(
    JSON.stringify({
      message: message,
      name: window.name,
      timestamp: timestamp,
    })
  );
  messageInputDom.value = "";
}

async function blockUser(userToBlock) {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  fetch(`api/auth/blocked/add/`, {
    // Adjust URL if needed
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username: userToBlock }), // Send username in request body
  })
    .then((response) => response.json())
    .then((responseData) => {
      if (responseData.success) {
        //console.log("User blocked successfully:", userToBlock);
      } else {
        console.error("Failed to block user:", responseData.message);
      }
    })
    .catch((error) => {
      console.error("Error blocking user:", error);
    });
}

async function UnblockUser(userToUnblock) {
  //console.log("Unblocking user:", userToUnblock);

  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }


  fetch(`api/auth/blocked/remove/`, {
    // Adjust URL if needed
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username: userToUnblock }), // Send username in request body
  })
    .then((response) => response.json())
    .then((responseData) => {
      if (responseData.success) {
        //console.log("User unblocked successfully:", userToUnblock);
      } else {
        console.error("Failed to unblock user:", responseData.message);
      }
    })
    .catch((error) => {
      console.error("Error unblocking user:", error);
    });
}

async function updateAPIOnlineStatus(isOnline) {
   let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }


  fetch(`api/auth/online_status/`, {
    // Adjust URL if needed
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: isOnline }), // Send online status in request body
  })
    .then((response) => response.json())
    .then((responseData) => {
      if (responseData.success) {
        //console.log("API online status updated successfully:", isOnline);
      } else {
        console.error(
          "Failed to update API online status:",
          responseData.message
        );
      }
    })
    .catch((error) => {
      console.error("Error updating API online status:", error);
    });
}

window.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname === "/main") {
    //fetchAllUsersList();
    //document.addEventListener("AllusersListfetched", () => {
    fetchBlockedUserList();
    document.addEventListener("blockedListfetched", () => {
     //console.log("Blocked List fetched");
      fetchFriendsList();
      document.addEventListener("friendListfetched", () => {
        //console.log("Friend List fetched");
        //console.log("AllUsersList BEFORE WebSocket Init:", sessionStorage.getItem('userlist'));
        //console.log("BlockedList BEFORE WebSocket Init:", sessionStorage.getItem('blockedList'));
        //console.log("FriendList BEFORE WebSocket Init:", JSON.parse(sessionStorage.getItem('friendlist')));
        initGlobalWebSocket();
      });
    });
  }
});

export function redirectFromProfile() {
  //fetchAllUsersList();
  //document.addEventListener("AllusersListfetched", () => {
  fetchBlockedUserList();
  document.addEventListener("blockedListfetched", () => {
    //console.log("Blocked List fetched");
    fetchFriendsList();
    document.addEventListener("friendListfetched", () => {
      //console.log("Friend List fetched");
      //console.log("AllUsersList BEFORE WebSocket Init:", sessionStorage.getItem('userlist'));
      //console.log("BlockedList BEFORE WebSocket Init:", sessionStorage.getItem('blockedList'));
      //console.log("FriendList BEFORE WebSocket Init:", JSON.parse(sessionStorage.getItem('friendlist')));
      initGlobalWebSocket();
    });
  });
  //});
}
