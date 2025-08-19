import { renderStartPage } from "./start.js";
import { renderLoginPage } from "./login.js";
import { renderRegisterPage } from "./register.js";
import { render404Page } from "./404.js";
import { renderProfilePage } from "./profile.js";
import { renderMainPage } from "./main.js";
import { renderPassPage } from "./pass.js";
import { redirectFromProfile } from "./chat/global_chat.js";
import { checkToken, isTokenExpired, refreshToken } from "./profile.js";

const routes = {
  "/": renderStartPage,
  "/login": renderLoginPage,
  "/register": renderRegisterPage,
  "/profile": renderProfilePage,
  "/main": renderMainPage,
  "/pass": renderPassPage,
};

const publicRoutes = ["/", "/login", "/register", "/pass"];

async function isLoggedIn() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }
};

const handleLocation = () => {
  const path = window.location.pathname;
  const renderFunction = routes[path] || render404Page;

  if (publicRoutes.includes(path) || isLoggedIn()) {
    renderFunction();
  } else {
    navigateTo("/login");
  }
  if (path === "/main" && isLoggedIn()) {
    setTimeout(redirectFromProfile, 100);
  }
};

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.handleLocation();
}

window.handleLocation = handleLocation;
window.navigateTo = navigateTo;


window.addEventListener("popstate", () => {
  const path = window.location.pathname;
  if (path === "/profile" || path === "/main") {
    location.reload(); // Force reload for these pages
  } else {
    handleLocation(); // Otherwise, re-render the SPA page
  }
});

handleLocation();