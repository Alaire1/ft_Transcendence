import {
  getBerlinTimeWithMilliseconds,
  showFunctionName,
  show_handleChatMessage,
} from "./debug_chat.js";

import { opened_profile_name } from "./global_chat.js";

import * as Profile from "./profile_chat.js";
import * as Privatechat from "./private_chat.js";

//console.log(getBerlinTimeWithMilliseconds() + "message_chat.js loaded ");

export function handleChatMessage(
  data,
  isPrivate,
  userProfiles,
  blocked,
  window_name
) {
  showFunctionName || show_handleChatMessage; //&& console.log(getBerlinTimeWithMilliseconds() + "()handleChatMessage() privat");

  const currentName = sessionStorage.getItem("username");
  const chatLog = isPrivate
    ? document.querySelector("#private-chat-log")
    : document.querySelector("#chat-log");
  const userProfile = userProfiles[data.name]; // Lade das Profil des Benutzers

  let result = blocked.includes(data.name);
  if (result) {
    return; // Dont show message cause of blocking
  }

  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("message");

  if (data.name === currentName) {
    messageWrapper.classList.add("right");
  } else {
    messageWrapper.classList.add("left");
  }

  const timestampDiv = document.createElement("div");
  timestampDiv.textContent = data.timestamp;

  timestampDiv.classList.add("timestamp");

  // name as clickable link
  const nameLink = document.createElement("a");
  nameLink.classList.add("user-link-unclickable");
  nameLink.textContent =
    userProfile && userProfile.display_name
      ? `${data.name} aka ${userProfile.display_name}`
      : data.name;

  const nameDiv = document.createElement("div");
  nameDiv.classList.add("name");
  nameDiv.appendChild(nameLink);

  const messageText = document.createElement("div");
  messageText.textContent = data.message;

  messageWrapper.appendChild(timestampDiv);
  messageWrapper.appendChild(nameDiv);
  messageWrapper.appendChild(messageText);

  chatLog.appendChild(messageWrapper);
  chatLog.scrollTop = chatLog.scrollHeight;
}
