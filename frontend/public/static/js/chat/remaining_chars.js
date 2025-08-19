import { getBerlinTimeWithMilliseconds } from "./debug_chat.js";
import * as Utils from "./utils_chat.js";

//console.log(getBerlinTimeWithMilliseconds() + "remaining_chars.js loaded ");

const maxChars = 300;

// reference to elements
const inputFieldPrivate = document.getElementById("private-chat-message-input");
const charCountFieldPrivate = document.getElementById("char-remaining-private");
const submitButtonPrivate = document.getElementById(
  "private-chat-message-submit"
);

const inputFieldGlobal = document.getElementById("chat-message-input");
const charCountFieldGlobal = document.getElementById("char-remaining-global");
const submitButtonGlobal = document.getElementById("chat-message-submit");

// Eventlistener inputs in text input field private
if (inputFieldPrivate) {
  inputFieldPrivate.addEventListener("input", function () {
    let currentLength = inputFieldPrivate.value.length;

    // limit chards
    if (currentLength > maxChars) {
      inputFieldPrivate.value = inputFieldPrivate.value.substring(0, maxChars);
      currentLength = maxChars;
    }

    // calc remaining chars
    const remaining = maxChars - currentLength;
    charCountFieldPrivate.textContent = remaining;
  });
}

// Eventlistener inputs in text input field global
if (inputFieldGlobal) {
  inputFieldGlobal.addEventListener("input", function () {
    let currentLength = inputFieldGlobal.value.length;

    // limit chards
    if (currentLength > maxChars) {
      inputFieldGlobal.value = inputFieldGlobal.value.substring(0, maxChars);
      currentLength = maxChars;
    }

    // calc remaining chars
    const remaining = maxChars - currentLength;
    charCountFieldGlobal.textContent = remaining;
  });
}

// Eventlistener for "Send"-Button (x seconds deactivate)
if (submitButtonPrivate) {
  submitButtonPrivate.addEventListener("click", function () {
    // Button deactivate
    submitButtonPrivate.disabled = true;

    // after x seconds activate
    setTimeout(function () {
      submitButtonPrivate.disabled = false;
    }, 3000);
    charCountFieldPrivate.textContent = maxChars;
  });
}

// Eventlistener for "Send"-Button (x seconds deactivate)
if (submitButtonGlobal) {
  submitButtonGlobal.addEventListener("click", function () {
    // Button deactivate
    submitButtonGlobal.disabled = true;
  
    // after x seconds activate
    setTimeout(function () {
      submitButtonGlobal.disabled = false;
    }, 3000);
    charCountFieldGlobal.textContent = maxChars;
  });
}
