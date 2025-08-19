import {
  getBerlinTimeWithMilliseconds,
  showFunctionName,
  show_connectPrivateWebSocket,
  show_initGlobalWebSocket,
  show_initPrivateWebSocket,
  show_triggerRevisitPrivateChat,
  show_handleChatMessage,
  show_openPrivateChat,
} from "./debug_chat.js";

import { blocked, globalChatSocket, userProfiles } from "./global_chat.js";

import * as Utils from "./utils_chat.js";
import * as Message from "./message_chat.js";
import * as Userlist from "./userlist_chat.js";

// File: private_chat.js
//console.log(getBerlinTimeWithMilliseconds() + "private_chat.js loaded ");

let privateChatSockets = {}; // Store private chat sockets for each private room
let lastChatRoom = ""; // store the last ChatRoom before switching

export function openPrivateChat(otherUser) {
  showFunctionName || show_openPrivateChat; //&& console.log(getBerlinTimeWithMilliseconds() + "()openPrivateChat  otherUser >" + otherUser + "<");
  otherUser = otherUser.trim();

  if (otherUser == "Chat-Server 2000") {
    show_openPrivateChat; //&& console.log(getBerlinTimeWithMilliseconds() + "openPrivateChat user: " + otherUser);
    return;
  }
  if (!window.name || !otherUser || window.name === otherUser) {
    return;
  }

  // Create a private room name with the smaller name first
  const roomName = [window.name, otherUser].sort().join("_").toLowerCase();

  // if Connection exists return
  if (privateChatSockets[roomName]) {
    return;
  }

  // Initialize a new WebSocket connection for the new private chat
  initPrivateWebSocket(roomName, otherUser);

  // Update the UI for the private chat
  const privateChatTitle = document.getElementById("private-chat-title-name");
  if (privateChatTitle) {
    privateChatTitle.textContent = `${otherUser}`;
  }

  // Clear the private chat log
  const privateChatLog = document.querySelector("#private-chat-log");
  if (privateChatLog) {
    privateChatLog.innerHTML = "";
  }
}

function showPrivateWebSockets() {
  showFunctionName && //console.log(getBerlinTimeWithMilliseconds() + "()showPrivateWebSockets ");
    Object.keys(privateChatSockets).forEach((roomName) => {
      console.log(getBerlinTimeWithMilliseconds() + "\t   " + roomName);
    });
}

function initPrivateWebSocket(roomName, otherUser) {
  showFunctionName || show_initPrivateWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() +"()initPrivateWebSocket" +"roomName: " + roomName +"   name: " + window.name +"   other User: " +otherUser +"   lastChatRoom: " +lastChatRoom);

  show_initPrivateWebSocket && showPrivateWebSockets();

  if (privateChatSockets[lastChatRoom]) {
    show_initPrivateWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + `Closing existing WebSocket for room: ${lastChatRoom}`);
  }

  const privateSocket = new WebSocket(
    "wss://" +
      window.location.host +
      "/back/wss/chat/" +
      roomName +
      "/" +
      "?name=" +
      encodeURIComponent(window.name) +
      "&other_user=" +
      encodeURIComponent(otherUser) // zusätzlicher Parameter
  );

  privateSocket.onopen = function () {};

  privateSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    if (data.type === "chat_message") {
      Message.handleChatMessage(data, true, userProfiles, blocked, window.name); // Handling private chat message
    } else if (data.type === "user_list") {
      Userlist.updateUserList(data.users, data.newmsg, window.name);
    }
  };

  privateSocket.onclose = function () {
    show_initPrivateWebSocket &&
      console.error(
        `Private chat socket with ${otherUser} closed unexpectedly`
      );
    delete privateChatSockets[roomName];
  };

  // Store the WebSocket connection in the privateChatSockets object
  privateChatSockets[roomName] = privateSocket;

  // Handle sending messages in the private chat
  document.querySelector("#private-chat-message-submit").onclick = function () {
    show_initPrivateWebSocket; //&& console.log(getBerlinTimeWithMilliseconds() + `priv click send message private chat`);

    sendMessage(privateSocket, true);
  };

  document
    .querySelector("#private-chat-message-input")
    .addEventListener("keyup", function (e) {
      if (e.keyCode === 13) {
        document.querySelector("#private-chat-message-submit").click();
      }
    });

  lastChatRoom = roomName;
}

function sendMessage(socket, isPrivate = false) {
  showFunctionName; //&& console.log(getBerlinTimeWithMilliseconds() + "()sendMessage privat");

  const messageInputDom = isPrivate
    ? document.querySelector("#private-chat-message-input")
    : document.querySelector("#chat-message-input");
  const message = messageInputDom.value.trim();

  if (message === "") {
    return;
  }

  const timestamp = new Date().toLocaleTimeString();

  // Message to the Websocket
  socket.send(
    JSON.stringify({
      message: message,
      name: window.name,
      timestamp: timestamp,
    })
  );
  messageInputDom.value = "";

  globalChatSocket.send(
    JSON.stringify({
      type: "update_user_list",
      name: window.name,
    })
  );
}
