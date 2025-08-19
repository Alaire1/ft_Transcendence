import {
  getBerlinTimeWithMilliseconds,
  showFunctionName,
  show_updateUserList,
} from "./debug_chat.js";

import {
  game_invites,
  userProfiles,
  // usersWithNewMsg,
  // usersWithoutNewMsg,
  // setusersWithNewMsg,
  // setusersWithoutNewMsg,
} from "./global_chat.js";

import * as Utils from "./utils_chat.js";
import * as Profile from "./profile_chat.js";
import * as Privatechat from "./private_chat.js";
import * as DomUtils from "../game/DomUtils.js";
import { checkToken, isTokenExpired, refreshToken } from "../profile.js";

//console.log(getBerlinTimeWithMilliseconds() + "userlist_chat.js loaded ");

export function updateUserList(users, newmsg, window_name, init) {
  showFunctionName || show_updateUserList; //&& console.log(getBerlinTimeWithMilliseconds() + "()UpdateUserList:", users);
  const userList = document.querySelector("#user-list");
  userList.innerHTML = "";

  //console.log("updateUserList game_invites... : ");
  //console.log(game_invites);
  //console.log("updateUserList newmsg... : ");
  //console.log(newmsg);

  // split users in 2 groups ... with "new msg" and without "new msg"
  const friendList = JSON.parse(sessionStorage.getItem("friendlist")) || [];
  let usersWithNewMsg = [];
  let usersWithoutNewMsg = [];

  users.forEach(function (user) {
    //if (newmsg[user] && (user != name) && (name == newmsg[user])) {
    if (
      (newmsg[user] &&
        newmsg[user].includes(window_name) &&
        user !== window_name) ||
      Utils.hasUnacceptedEntry(game_invites, user, window_name)
    ) {
      usersWithNewMsg.push(user);
    } else {
      usersWithoutNewMsg.push(user);
    }
  });

  // sorting alphabetically
  usersWithNewMsg.sort();
  usersWithoutNewMsg.sort();

  // combining both lists
  const sortedUsers = [...usersWithNewMsg, ...usersWithoutNewMsg];

  // renering sorted list
  sortedUsers.forEach(function (user) {
    const userProfile = userProfiles[user]; // load profile of user
    // create user element and let it as Block-Element (div) to have em a new line
    const userItem = document.createElement("div");
    const userLink = document.createElement("a");
    userLink.textContent = user;

    if (
      userProfile &&
      userProfile.display_name &&
      userProfile.display_name !== user
    ) {
      userLink.textContent += ` aka ${userProfile.display_name}`; // Show display Name
    }

    userLink.href = "#";
    userLink.classList.add("user-link");
    userLink.id = "user-link-" + userProfile.user_name;
    //console.log(userProfile);

    if (friendList.includes(user)) {
      userLink.style.color = "green";
    }

    // add user link to user element
    userItem.appendChild(userLink);

    // if user is in "newmsg" list ... add "new msg" on this right side
    if (
      newmsg[user] &&
      newmsg[user].includes(window_name) &&
      user !== window_name
    ) {
      let blocked = JSON.parse(sessionStorage.getItem("blockedList")) || [];
      if (!blocked.includes(user)) {
        const newMsgLabel = document.createElement("span");
        newMsgLabel.textContent = " new msg";
        newMsgLabel.classList.add("new-msg-label"); // optional: zum Stylen

        userItem.appendChild(newMsgLabel);
      }
      //console.log("Blocked:" + blocked + " User:" + user);
    }

    if (Utils.hasUnacceptedEntry(game_invites, user, window_name)) {
      show_updateUserList; //&& console.log(">> name: " + window_name + " user: " + user);
      show_updateUserList; //&& console.log("hasAcceptedChanged true   name: " + window_name);
      let blocked = JSON.parse(sessionStorage.getItem("blockedList")) || [];
      if (!blocked.includes(user)) {
        const inviteLabel = document.createElement("span");
        inviteLabel.textContent = " Invite";
        inviteLabel.classList.add("invite-label");
        inviteLabel.setAttribute("data-i18n", "main.chat.newInvite");
        userItem.appendChild(inviteLabel);
      }
    }

    // Event-Listener for click on user name in user list
    userLink.addEventListener("click", async function (e) {
      e.preventDefault();
      show_updateUserList; //&& console.log("glob CLICK on USER in userlist: " + user);

      let currentUserLink = e.target;

      let matchData = await fetchMatchHistorySimple(user);

      if (!document.body.contains(currentUserLink)) {
        //console.log("Link was removed!");
        userItem.appendChild(userLink);
      }

      userProfile.games_won = matchData.wins;
      userProfile.games_lost = matchData.losses;

      document.querySelector("#private-chat-message-input").focus();
      //console.log("userlist_chat.js: user" + user);
      Profile.openUserProfile(user, window_name, userProfiles);
      if (user !== window_name) {
        Privatechat.openPrivateChat(user);
        const privateContainer = document.getElementById("private-chat");
        privateContainer.style.display = "flex";

        const globalContainer = document.getElementById(
          "global-chat-container"
        );
        globalContainer.style.display = "none";
      }
    });

    userList.appendChild(userItem);
  });
}

export async function fetchMatchHistorySimple(username) {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }


  let responseData = await fetch(
    `api/auth/matches/history/simple?user=` + username,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  )
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }
      return response.json();
    })
    .then((responseData) => {
      return responseData;
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      DomUtils.createAlert("alert.errorFetchingData");
    });

  return {
    wins: responseData.wins,
    losses: responseData.losses,
  };
}
