import {
  getBerlinTimeWithMilliseconds,
  showFunctionName,
} from "./debug_chat.js";

import {
  game_invites,
  globalChatSocket
} from "./global_chat.js";
//console.log(getBerlinTimeWithMilliseconds() + "utils_chat.js loaded ");

export function hasAcceptedChanged(playerName, oldList, newList) {
  showFunctionName //&& console.log(getBerlinTimeWithMilliseconds() + "() hasAcceptedChanged");

  // Check if the parameters are valid
  if (!Array.isArray(oldList) || !Array.isArray(newList)) {
    throw new Error("Both oldList and newList must be arrays.");
  }

  // Iterate over the new list to compare with the old list
  for (let i = 0; i < newList.length; i++) {
    const newEntry = newList[i];

    // Find the corresponding entry in the old list
    const oldEntry = oldList.find(
      (entry) =>
        entry.player1 === newEntry.player1 && entry.player2 === newEntry.player2
    );

    // Check if the entry matches the playerName and if the accepted value changed
    if (
      newEntry.player1 === playerName &&
      oldEntry && // Ensure the old entry exists
      oldEntry.accepted === false &&
      newEntry.accepted === true
    ) {
      return true; // Condition met, return true
    }
  }

  return false; // No matching entry found where the condition is met
}

export function hasUnacceptedEntry(list, p1, p2) {
  // for accept invitation button
  showFunctionName //&& console.log(getBerlinTimeWithMilliseconds() + "() hasUnacceptedEntry");

  // Check if the parameter is a valid array
  if (!Array.isArray(list)) {
    throw new Error("The list must be an array.");
  }

  // Iterate over the list to find the matching entry
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    if (
      entry.player1 === p1 &&
      entry.player2 === p2 &&
      entry.accepted === false
    ) {
      return true; // Condition met, return true
    }
  }

  return false; // No matching entry found where the condition is met
}

export function hasAcceptedEntry(list, p1, p2) {
  // for accept invitation button
  showFunctionName //&& console.log(getBerlinTimeWithMilliseconds() + "() hasAcceptedEntry");

  // Check if the parameter is a valid array
  if (!Array.isArray(list)) {
    throw new Error("The list must be an array.");
  }

  // Iterate over the list to find the matching entry
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    if (
      entry.player1 === p1 &&
      entry.player2 === p2 &&
      entry.accepted === true
    ) {
      return true; // Condition met, return true
    }
  }

  return false; // No matching entry found where the condition is met
}

export function getPlayer2IfAccepted(list, playerName) {
  showFunctionName //&& console.log(getBerlinTimeWithMilliseconds() + "() getPlayer2IfAccepted");

  // Check if the parameter is a valid array
  if (!Array.isArray(list)) {
    throw new Error("The list must be an array.");
  }

  // Iterate over the list to find the matching player1 with accepted = true
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    if (entry.player1 === playerName && entry.accepted === true) {
      return entry.player2; // Return player2 if the condition is met
    }
  }

  return null; // Return null if no matching entry is found
}

export function deepEqual(obj1, obj2) {
  showFunctionName //&& console.log(getBerlinTimeWithMilliseconds() + "() deepEqual");

  // If both objects have the same reference, they are equal
  if (obj1 === obj2) return true;

  // If either is not an object or is null, they are unequal
  if (
    obj1 == null ||
    typeof obj1 !== "object" ||
    obj2 == null ||
    typeof obj2 !== "object"
  ) {
    return false;
  }

  // Compare all keys of both objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // If the number of keys is different, the objects are unequal
  if (keys1.length !== keys2.length) return false;

  // Check that all keys and values ​​are the same
  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

export function isPlayer1InData(dataList, name) {
  showFunctionName //&& console.log(getBerlinTimeWithMilliseconds() + "() isPlayer1InData");

  // dataList is a List  Objects (JSON)
  for (let data of dataList) {
    if (data.player1 === name) {
      //console.log("   >> found player1 >" + name + "< in List");
      return true; // found name in List in player2
    }
  }
  return false; // nothing found
}

export function isPlayer2InData(dataList, name) {
  showFunctionName //&& console.log(getBerlinTimeWithMilliseconds() + "() isPlayer2InData");

  // dataList is a List  Objects (JSON)
  for (let data of dataList) {
    if (data.player2 === name) {
      return true; // found name in List in player2
    }
  }
  return false; // nothing found
}

export function hasPlayer2Accepted(dataList, name) {
  showFunctionName //&& console.log(getBerlinTimeWithMilliseconds() + "() hasPlayer2Accepted");

  // dataList is a List  Objects (JSON)
  for (let data of dataList) {
    if (data.player2 === name) {
      if (data.accepted) {
        return true; // found name in List in player2
      } else {
        return false;
      }
    }
  }
  return false; // nothing found
}

export function removeAllGameInvitesByPlayer(player) {
  // Modify the existing array in place
  game_invites.splice(
    0,
    game_invites.length,
    ...game_invites.filter(
      (entry) => entry.player1 !== player && entry.player2 !== player
    )
  );
  if (
      globalChatSocket &&
      globalChatSocket.readyState === WebSocket.OPEN
    ) {
      globalChatSocket.send(
        JSON.stringify({
          type: "game_finished",
        })
      );
    }
  document.dispatchEvent(new CustomEvent("gameInvitesUpdated"));
  //console.log(`Removed all game invites related to ${player}`);
}