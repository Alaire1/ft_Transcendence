import { applyTranslations, setLanguage } from "./translations.js";
import { getCookie } from "./profile.js"; // Import the getCookie function

// Function to get the preferred language from the cookie
function getPreferredLanguage() {
  console.log("Start: ");
  const preferredLanguage = getCookie("preferred_language");
  if (!preferredLanguage)
    return "en";
  sessionStorage.setItem("lang", preferredLanguage);
  console.log("Preferred language from cookie: ", preferredLanguage);
  return preferredLanguage;
}

export function renderStartPage() {
  const pageContainer = document.getElementById("pageContainer");
  pageContainer.className = "start-page";
  const body = document.querySelector("body");
  body.className = "start-page-body";
  pageContainer.innerHTML = `
        <div id="startPage">
            <button onclick="navigateTo('/login')" id="start_button" class="tiny5" data-i18n="start.start">Start</button>  
        </div>
    `;

  // Ensure the language is set correctly when the page is first loaded
  document.addEventListener("DOMContentLoaded", async () => {
    getPreferredLanguage();
    applyTranslations();  
  });
}