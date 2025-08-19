import { fetchAllUsersList } from "./profile.js";
import { applyTranslations } from "./translations.js";
import * as DomUtils from "./game/DomUtils.js";

export function renderLoginPage() {
    if (handleOAuth2Callback()) return;

    const pageContainer = document.getElementById('pageContainer');
    pageContainer.className = 'login-page'; 
    const body = document.querySelector('body');
    body.className = 'login-page-body';
    pageContainer.innerHTML = `
        <div id="contentContainer">
            <div id="loginSection">
                <h2 class="tiny5 header" data-i18n="login.header">Login</h2>
                <form id="loginForm">
                   <input type="text" id="username" placeholder="Username" required data-i18n-placeholder="login.usernamePlaceholder">
                    <input type="password" id="password" placeholder="Password" required data-i18n-placeholder="login.passwordPlaceholder">
                    <button type="submit" class="tiny5" data-i18n="login.login">Login</button>
                    <button type="button" id="42login" class="tiny5" data-i18n="login.loginWith42">Login with 42</button>
                    <button type="button" class="tiny5" onclick="navigateTo('/register')" data-i18n="login.registerHere">Register here</button>
                </form>
            </div>
        </div>
    `;
    applyTranslations();
    initializeLoginForm();
}

export function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const login42Button = document.getElementById('42login');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (!username || !password) {
        DomUtils.createAlert("alert.bothFieldsRequired");
        return;
      }

      const jsonData = {
        username: username,
        password: password,
      };

            try {
                const response = await fetch(`api/api/token/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(jsonData),
                });

        const data = await response.json();
        if (response.ok) {
          if (data["2fa_required"]) {
            sessionStorage.setItem("username", username);
            window.location.href = "/pass";
          } else {
            sessionStorage.setItem("access_token", data.access);
            sessionStorage.setItem("refresh_token", data.refresh);
            window.location.href = "/profile";
            fetchAllUsersList();
          }
        } else {
          DomUtils.createAlert("alert.loginFailed", data.message);
        }
      } catch (error) {
        console.error("Error:", error);
        DomUtils.createAlert("loginError");
      }
    });
  }

    if (login42Button) {
        login42Button.addEventListener('click', function() {
            window.location.href = `api/auth/42-login/`;
        });
    }
}

function handleOAuth2Callback() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
        sessionStorage.setItem('access_token', accessToken);
        sessionStorage.setItem('refresh_token', refreshToken);
        sessionStorage.setItem('42login', 'true');
        window.history.replaceState({}, document.title, '/profile');
        window.location.href = '/profile';
        return true;
    }

    return false;
}
