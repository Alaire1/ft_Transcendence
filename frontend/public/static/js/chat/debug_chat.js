import {
  blocked,
  game_invites,
  userProfiles,

} from "./global_chat.js";

//console.log(getBerlinTimeWithMilliseconds() + "debug_chat.js loaded ");

export let showFunctionName = false;
export let showFunctionNameUtils = false; // only for funtions in Utils

// for global chat functions debug out
export let show_initGlobalWebSocket = false;
export let show_sendMessage = false;
export let show_updateUserList = false;
export let show_displayUserProfile = false;
export let show_openUserProfile = false;
export let show_updateOpenUserProfile = false;

// for private chat functions debug out
export let show_triggerRevisitPrivateChat = false;
export let show_openPrivateChat = false;
export let show_connectPrivateWebSocket = false;
export let show_initPrivateWebSocket = false;

export let show_handleChatMessage = false;

export function getBerlinTimeWithMilliseconds() {
  const options = {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const date = new Date();
  const timeString = date.toLocaleTimeString("de-DE", options);
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return `${timeString}.${milliseconds} - `;
}

export function prettyPrint(name, obj) {
  console.log(getBerlinTimeWithMilliseconds() + "()Pretty Print > " + name + " <");
  console.log(JSON.stringify(obj, null, 4));
}

export function show_all() {
  console.log("***********************************");
  console.log(getBerlinTimeWithMilliseconds() + " *** Show All Data Structs ***");
  prettyPrint("blocked", blocked);
  prettyPrint("userProfiles", userProfiles);
  prettyPrint("game_invites", game_invites);
  //prettyPrint("usersWithNewMsg", usersWithNewMsg);
  //prettyPrint("usersWithoutNewMsg", usersWithoutNewMsg);

  console.log("***********************************");
}
