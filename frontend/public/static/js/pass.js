import { applyTranslations } from "./translations.js";
import * as DomUtils from "./game/DomUtils.js";

export function renderPassPage() {
    const pageContainer = document.getElementById('pageContainer');
    const body = document.querySelector('body');
    body.className = 'login-page-body';
    pageContainer.className = 'pass-page'; 
    pageContainer.innerHTML = `
        <div id="contentContainer" class="pass-container">
            <h2 class="tiny5 header" data-i18n="pass.header">Two-Factor Authentication</h2>
            <div class="code-inputs">
                <input type="text" maxlength="1" class="code-digit" pattern="[0-9]">
                <input type="text" maxlength="1" class="code-digit" pattern="[0-9]">
                <input type="text" maxlength="1" class="code-digit" pattern="[0-9]">
                <input type="text" maxlength="1" class="code-digit" pattern="[0-9]">
                <input type="text" maxlength="1" class="code-digit" pattern="[0-9]">
                <input type="text" maxlength="1" class="code-digit" pattern="[0-9]">
            </div>
            <button type="submit" class="verify-button" data-i18n="pass.verify">Verify</button>
        </div>
    `;
    applyTranslations();
    initializePassForm();
}

function initializePassForm() {
  const codeDigits = document.querySelectorAll(".code-digit");
  codeDigits.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < codeDigits.length - 1) {
        codeDigits[index + 1].focus();
      }
    });
  });

  const verifyButton = document.querySelector(".verify-button");
  verifyButton.addEventListener("click", async () => {
    const otp = Array.from(codeDigits)
      .map((input) => input.value)
      .join("");
    const username = sessionStorage.getItem("username");

    if (otp.length !== 6) {
      DomUtils.createAlert("alert.enterCode");
      return;
    }

        try {
            const response = await fetch(`api/2fa/verify-login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, otp })
            });

      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem("access_token", data.access);
        sessionStorage.setItem("refresh_token", data.refresh);
        window.location.href = "/profile";
      } else {
        DomUtils.createAlert("alert.otpError");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      DomUtils.createAlert("alert.otpError");
    }
  });
}
