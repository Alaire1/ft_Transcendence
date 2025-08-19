import { applyTranslations, setLanguage } from "./translations.js";
import * as DomUtils from "./game/DomUtils.js";

export function renderProfilePage() {
  const pageContainer = document.getElementById("pageContainer");
  pageContainer.className = "profile-page";
  pageContainer.innerHTML = `
          <div class="container">

          <!-- First Column: User Settings -->
                <div class="col settings-column">
                <div class="settings-box">
                    <h2 class="header_profile tiny5" data-i18n="profile.userSettings">User Settings</h2>
                  <div class="input-group" id="username-group">
                    <div class="input-wrapper">
                      <label class="tiny5" for="username" data-i18n="profile.username">Username:</label>
                      <input type="text" id="username" name="username" required>
                    </div>
                    <button id="update-username-button" class="update-button tiny5" data-i18n="profile.update">Update</button>
                  </div>
                  <div class="input-group" id="email-group">
                    <div class="input-wrapper">
                      <label class="tiny5" for="email" data-i18n="profile.email">Email:</label>
                      <input type="email" id="email" name="email" required>
                    </div>
                    <button id="update-email-button" class="update-button tiny5" data-i18n="profile.update">Update</button>
                  </div>
                  <div class="input-group" id="password-group">
                    <div class="input-wrapper">
                    <label class="tiny5" for="new-password" data-i18n="profile.newPassword">New Password:</label>
                    <input type="password" id="new-password" name="new-password">
                    <input type="password" id="new-password-second" name="new-password-second">
                    </div>
                    <button id="update-password-button" class="update-button tiny5" data-i18n="profile.update">Update</button>
                    </div>
                    <div id="profilePictureBox" class="input-group">
                      <div class="input-wrapper">
                        <input type="file" id="profile-pic-input" class="tiny5" accept="image/*" hidden>
                        <label for="profile-pic-input" class="custom-file-label tiny5" data-i18n="profile.changePicture">
                        </label>
                        <span id="file-name" class="tiny5" data-i18n="profile.noFileChosen">No file chosen</span>
                      </div>
                      <button id="uploadButton" class="update-button tiny5" data-i18n="profile.save">Upload</button>
                    </div>
                    <div class="input-group">
                        <label class="tiny5 label-2fa" for="2fa" data-i18n="profile.authentication">Two Factor Authentication:</label>
                        <button id="enable-2fa"  class="update-button tiny5" data-i18n="profile.enable2FA">Enable 2FA</button>
                        <button id="disable-2fa"  class="update-button tiny5" data-i18n="profile.disable2FA">Disable 2FA</button>
                        <div id="qrcode-container" style="display: none;">
                            <img id="qrcode" src="" alt="QR Code" style="width: 150px; height: 150px;"/>
                            <button id="done-button" class="update-button tiny5" style="display: none;" data-i18n="profile.done">Done</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <label class="tiny5" for="language" data-i18n="profile.language">Preferred Language:</label>
                        <div class="language-options">
                            <label><input type="radio" name="language" value="en" id="lang-en"> en</label>
                            <label><input type="radio" name="language" value="pl" id="lang-pl"> pl</label>
                            <label><input type="radio" name="language" value="de" id="lang-de"> de</label>
                        </div>
                    </div>
                    <div class="input-group">
                        <button id="delete-account-button" class="update-button tiny5" data-i18n="profile.deleteAccount">Delete Account</button>
                        <button id="logoutButton" class="update-button tiny5" data-i18n="profile.logout">Logout</button>
                    </div>
                </div>
            </div>



            <!-- Middle Column: Welcome and Start Game -->
            <div class="col middle-column">
                <div class="welcome-box">
                    <div class="profile-header">
                        <div class="profile-greeting">
                            <div class="hello-box">
                                <div class="hello-size tiny5" data-i18n="profile.hello">Hello, </div>
                                <div id="profile-username" class="hello-size tiny5">User</div>
                                <div class="hello-size tiny5">!</div>
                            </div>
                            <div class="welcome-size tiny5" data-i18n="profile.welcome">Welcome to your dashboard!</div>
                        </div>
                        
                        <div class="profile-picture" id="profile-picture">
                            <img src="static/img/profile_pictures/cat.png" alt="Profile Picture" id="profile-img">
                        </div>
                    </div>
                </div>
                <div class="start-game-box">
                  <img src="static/img/paddles.png" alt="Start Game Image" class="start-game-image">
                  <button class="button-pixel tiny5" onclick="navigateTo('/main')" data-i18n="profile.startGame">Start Game</button>
                </div>
            </div>

            <!-- Third Column: Friends List and Scoreboard -->
            <div class="col friends-column">
              <div id="friends-group" class="friends-group">
                <div class="friends-box">
                  <h2 class="header_profile tiny5" data-i18n="profile.friendsList">Friends List</h2>
                  <ul id="friends-list" class="friends-list">
                    <!-- Friends will be listed here -->
                  </ul>
                </div>
                <div class="all-users-box">
                  <h2 class="header_profile tiny5" data-i18n="profile.allUsers">All Users</h2>
                  <ul id="all-users" class="all-users">
                    <!-- All users will be listed here -->
                  </ul>
                </div>
              </div>


              <div class="scoreboard-box">
                <h2 class="header_profile tiny5" data-i18n="profile.matchHistory">Match History</h2>
            
                <!-- Scoreboard here -->
              </div>
            </div>
        </div>
    `;
    const profilePicInput = document.getElementById("profile-pic-input");
    if (profilePicInput) {
      profilePicInput.addEventListener("change", handleProfilePicChange);
    }
  
    const uploadButton = document.getElementById("uploadButton");
    if (uploadButton) {
      uploadButton.addEventListener("click", handleProfilePicUpload);
    }
  
    const enable2FAButton = document.getElementById("enable-2fa");
    if (enable2FAButton) {
      enable2FAButton.addEventListener("click", handleEnable2FA);
    }
  
    const disable2FAButton = document.getElementById("disable-2fa");
    if (disable2FAButton) {
      disable2FAButton.addEventListener("click", handleDisable2FA);
    }
  
    const doneButton = document.getElementById("done-button");
    if (doneButton) {
      doneButton.addEventListener("click", handleDone2FA);
    }
  
    const updateUsernameButton = document.getElementById("update-username-button");
    if (updateUsernameButton) {
      updateUsernameButton.addEventListener("click", updateUsername);
    }
  
    const updateEmailButton = document.getElementById("update-email-button");
    if (updateEmailButton) {
      updateEmailButton.addEventListener("click", updateEmail);
    }
  
    const updatePasswordButton = document.getElementById("update-password-button");
    if (updatePasswordButton) {
      updatePasswordButton.addEventListener("click", updatePassword);
    }
  
    const deleteAccountButton = document.getElementById("delete-account-button");
    if (deleteAccountButton) {
      deleteAccountButton.addEventListener("click", deleteUser);
    }
  
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogout);
    }
  
    document.querySelectorAll('input[name="language"]').forEach((radio) => {
      radio.addEventListener("change", updatePreferredLanguage);
    });
  
    // Call other initialization functions
    fetchUserData();
    fetchFriendsListProfile();
    fetchFriendRequests();
    fetchAllUsersList();
    fetchMatchHistory();
    hideFieldsFor42Login();
    applyTranslations();
  }

export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;

    const currentTime = Math.floor(Date.now() / 1000);

    return currentTime >= exp;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};
export const checkToken = async () => {
  const token = sessionStorage.getItem("access_token");
  const refreshToken = sessionStorage.getItem("refresh_token");
  if (!token && !refreshToken) {
    console.error("No token found, redirecting to login...");
    clearUserData();
    window.location.href = `api`;
    return;
  }
  else if (!token && refreshToken) {
    console.error("Access token expired, refreshing...");
    token = await refreshToken(refreshToken);
    if (!token) {
      console.error("Failed to refresh access token, redirecting to login...");
      clearUserData();
      window.location.href = `api/`;
      return;
    }
    sessionStorage.setItem("access_token", token);
  }
  return token;
};
export const refreshToken = async () => {
  const refreshToken = sessionStorage.getItem('refresh_token');
  if (!refreshToken) {
      throw new Error('No refresh token available');
  }

  try {
      const response = await fetch(`api/api/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
          throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      sessionStorage.setItem('access_token', data.access);
      return data.access;
  } catch (error) {
      console.error('Error refreshing token:', error);
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      window.location.href = '/login';
  }
};

function hideFieldsFor42Login() {
  const is42Login = sessionStorage.getItem('42login') === 'true';
  if (is42Login) {
    document.getElementById('email-group').style.display = 'none';
    document.getElementById('password-group').style.display = 'none';
    document.getElementById('delete-account-button').style.display = 'none';
  }
}

async function updateUsername() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  const new_username = document.getElementById("username").value;
  if (new_username.length === 0) {
        DomUtils.createAlert("alert.displayNameEmpty");
  }
  const url = `api/auth/users/update/`;
  const data = {
    username: new_username,
  };
  console.log("data", data);

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log("responseData", responseData);
    if (response.ok) {
      DomUtils.createAlert("alert.displayNameUpdate");
    } else {
      console.error("Error updating display name:", responseData);
      // TODO - catch the username taken error here.
      DomUtils.createAlert(
        "alert.displayNameError",
        responseData.message.username || responseData.message
      );
    }
  } catch (error) {
    console.error("Error updating display name: ", error);
    DomUtils.createAlert("alert.unknownDisplayNameError");
  }
  document.getElementById("username").value = "";
}
// to be uncommented later
function isValidPassword(password) {
  // will uncomment later for the last testing phase
  // Example password validation rules
  const minLength = 8;
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumber = /[0-9]/.test(password);
  //const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength;
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function updateEmail() {
  let token = await checkToken();
  if (!token)
    {DomUtils.createAlert("alert.loginRequired");
      return;}

  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  const newEmail = document.getElementById("email").value;
  if (!newEmail) {
    DomUtils.createAlert("alert.noEmail");
    return;
  }

  if (!isValidEmail(newEmail)) {
    DomUtils.createAlert("alert.invalidEmail");
    document.getElementById("email").value = "";
    return;
  }

  const data = { email: newEmail };

  try {
    const response = await fetch(`api/auth/users/update/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (response.ok) {
      DomUtils.createAlert("alert.emailSuccess");
    } else {
      DomUtils.createAlert(
        "alert.emailUpdateError",
        responseData.detail || "Unknown error"
      );
    }
  } catch (error) {
    console.error("Error updating email:", error);
    DomUtils.createAlert("alert.unknownError");
  }
  document.getElementById("email").value = "";
}

async function updatePassword() {
  let token = await checkToken();
  if (!token) {
    DomUtils.createAlert("alert.loginRequired");
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  const newPassword = document.getElementById("new-password").value;
  const newPasswordSecond = document.getElementById(
    "new-password-second"
  ).value;

  if (!newPassword || !newPasswordSecond) {
    DomUtils.createAlert("alert.emptyPassword");
    document.getElementById("new-password").value = "";
    document.getElementById("new-password-second").value = "";
    return;
  }

  if (newPassword !== newPasswordSecond) {
    DomUtils.createAlert("alert.notMatchingPasswords");
    document.getElementById("new-password").value = "";
    document.getElementById("new-password-second").value = "";
    return;
  }

  if (!isValidPassword(newPassword)) {
    DomUtils.createAlert("alert.invalidPassword");
    document.getElementById("new-password").value = "";
    document.getElementById("new-password-second").value = "";
    return;
  }

  const data = { password: newPassword };

  try {
    const response = await fetch(`api/auth/users/update/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (response.ok) {
      DomUtils.createAlert("alert.passwordUpdated");
    } else {
      DomUtils.createAlert(
        "alert.passwordUpdateError",
        responseData.detail || "Unknown error"
      );
    }
  } catch (error) {
    console.error("Error updating password:", error);
    DomUtils.createAlert("alert.unknownError");
  }
  document.getElementById("new-password").value = "";
  document.getElementById("new-password-second").value = "";
}


function handleProfilePicChange(event) {
  const file = event.target.files[0];

  if (!file) {
    DomUtils.createAlert("alert.noFile");
    return;
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    DomUtils.createAlert("alert.invalidFormat");
    return;
  }

  const fileName = file.name;
  const elementToUpdate = document.getElementById("file-name");
  if (elementToUpdate) {
    elementToUpdate.textContent = fileName;
  }

  // Validate file size (max 2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_FILE_SIZE) {
    DomUtils.createAlert("alert.fileTooLarge");
    return;
  }
  // Show a preview of the selected image
  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("profile-img").src = e.target.result;
  };
  reader.readAsDataURL(file);
}

//document.addEventListener("DOMContentLoaded", function () {
//  document
//    .getElementById("profile-pic-input")
//    .addEventListener("change", handleProfilePicChange);
//});

async function handleProfilePicUpload() {
  const fileInput = document.getElementById("profile-pic-input");
  const file = fileInput.files[0];

  if (!file) {
    DomUtils.createAlert("alert.selectImage");
    return;
  }
  let token = await checkToken();
  if (!token) {
    return; 
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; 
  }
  const formData = new FormData();
  formData.append("profile_picture", file);
  console.log("Uploading file:", file);

  try {
    const response = await fetch(`api/auth/users/update/`, {
      method: "PUT",
      body: formData,
      headers: {
        Authorization: "Bearer " + sessionStorage.getItem("access_token"),
      },
    });

    const data = await response.json();
    if (data.success) {
      document.getElementById("profile-img").src = data.profile_picture;
      DomUtils.createAlert("alert.profilePictureSuccess");
      fetchUserData();
    } else {
      DomUtils.createAlert("alert.uploadFailed");
    }
  } catch (error) {
    DomUtils.createAlert("alert.uploadFailed");
    console.error("Upload error:", error);
  }

  console.log("Uploading file...");
  fileInput.value = "";
}

//document.addEventListener("DOMContentLoaded", function () {
//  document
//    .getElementById("uploadButton")
//    .addEventListener("click", handleProfilePicUpload);
//});


async function fetchUserData() {
  let token = await checkToken();
  console.log("Fetching user data...");
  console.log("Token:", token);
  if (!token) {
    return; // Exit if token is not available
  }

  if (isTokenExpired(token)) {
    token = await refreshToken();
    if (!token) {
      return; // Exit if token is not available
    }
  }
  console.log("Token:", token); // Debugging

  console.log("Fetching user data...");

  fetch(`api/auth/users/me/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }
      return response.json();
    })
    .then((responseData) => {
      const username = responseData.data.username;
      const favouriteLanguage = responseData.data.favourite_language;
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("favourite_language", favouriteLanguage);
      console.log("Username:", username);
      console.log("Favourite Language:", favouriteLanguage);

      const languageSet = sessionStorage.getItem("languageSet");
      if (!languageSet && favouriteLanguage) {
        let languageButton = document.getElementById(
          `lang-${favouriteLanguage}`
        );

        if (languageButton) {
          languageButton.checked = true;
        }

        setLanguage(favouriteLanguage);
        sessionStorage.setItem("languageSet", "true");
      }


      const profileUsernameElement =
        document.getElementById("profile-username");
      if (profileUsernameElement) {
        profileUsernameElement.textContent = username;
      } else {
        console.error("profile-username element not found");
      }

      console.log("RESPONSE DATA: ");
      console.log(responseData);
      const profileImgElement = document.getElementById("profile-img");
      if (profileImgElement) {
        const profilePictureUrl = `media/avatars/${username}_avatar.jpg?timestamp=${new Date().getTime()}`;
        profileImgElement.src = profilePictureUrl;
        profileImgElement.onerror = function () {
          profileImgElement.src = "static/img/profile_pictures/cat.png";
        };
      } else {
        console.error("profile-img element not found");
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      DomUtils.createAlert("alert.errorFetching");
    });
}

async function handleLogout() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  try {
    const response = await fetch(`api/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();
    if (response.ok) {
      clearUserData();
      window.location.href = `/login`;
    } else {
      DomUtils.createAlert("alert.logoutFailed", data.message);
    }
  } catch (error) {
    console.error("Error logging out:", error);
    DomUtils.createAlert("alert.unknownError");
  }
}


async function deleteUser() {
  const deleteButton = document.getElementById("delete-account-button");
  const confirmationContainer = document.createElement("div");
  confirmationContainer.id = "confirmation-container";
  confirmationContainer.innerHTML = `
    <p data-i18n="profile.deleteConfirmation"></p>
    <button id="confirm-delete-button" data-i18n="profile.confirmDelete">/button>
    <button id="cancel-delete-button" data-i18n="profile.cancelDelete"></button>
  `;
  deleteButton.parentNode.insertBefore(confirmationContainer, deleteButton.nextSibling);
  
  applyTranslations();

  document.getElementById("confirm-delete-button").addEventListener("click", async () => {
    let token = await checkToken();
    if (!token) {
      return; // Exit if token is not available
    }
    if (isTokenExpired(token))
      token = await refreshToken();
    if (!token) {
      return; // Exit if token is not available
    }

    try {
      const response = await fetch(`api/auth/delete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      const responseData = await response.json();
      console.log(responseData);
      clearUserData();
      DomUtils.createAlert("alert.deletedAccount", null, () => {
        window.location.href = `/login`;
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      DomUtils.createAlert("alert.deleteError");
    }
  });

  document.getElementById("cancel-delete-button").addEventListener("click", () => {
    confirmationContainer.remove();
  });
}
// async function deleteUser() {
//   let token = await checkToken();
//   if (!token) {
//     return; // Exit if token is not available
//   }
//   if (isTokenExpired(token))
//     token = await refreshToken();
//   if (!token) {
//     return; // Exit if token is not available
//   }

//   fetch(`api/auth/delete/`, {
//     method: "post",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//   })
//     .then(async (response) => {
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to delete user");
//       }
//       return response.json();
//     })
//     .then((responseData) => {
//       console.log(responseData);
//       clearUserData();
//       DomUtils.createAlert("alert.deletedAccount", null, () => {
//           window.location.href = `api/`;
//       });
//     })
//     .catch((error) => {
//       console.error("Error deleting user:", error);
//       DomUtils.createAlert("alert.deleteError");
//     });
// }

function clearUserData() {
  sessionStorage.clear();
  console.log("Access token :", sessionStorage.getItem("access_token"));
  console.log("Refresh token :", sessionStorage.getItem("refresh_token"));
}

async function handleEnable2FA() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }
  try {
    const response = await fetch(`api/2fa/generate-qrcode/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      DomUtils.createAlert("alert.qrFail", errorData.message);
      return;
    }

    const qrCodeContainer = document.getElementById("qrcode-container");
    const qrCodeImage = document.getElementById("qrcode");
    const doneButton = document.getElementById("done-button");

    qrCodeImage.src = URL.createObjectURL(await response.blob());
    qrCodeContainer.style.display = "block";
    doneButton.style.display = "block";
    DomUtils.createAlert("alert.scanQR");
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    DomUtils.createAlert("alert.2faError");
  }
}

async function handleDone2FA() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  try {
    const response = await fetch(`api/2fa/confirm-enabled/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to confirm 2FA");
    }

    const qrCodeContainer = document.getElementById("qrcode-container");
    const doneButton = document.getElementById("done-button");

    qrCodeContainer.style.display = "none";
    doneButton.style.display = "none";
    DomUtils.createAlert("alert.2faEnabled");
  } catch (error) {
    console.error("Error confirming 2FA:", error);
    DomUtils.createAlert("alert.2faError");
  }
}
/////////////////////////////////// to be deleted?
async function handleVerify2FA() {
  const otp = document.getElementById("otp").value;
  if (!otp) {
    DomUtils.createAlert("alert.enterOTP");
    return;
  }

  const token = sessionStorage.getItem("access_token");
  if (!token) {
    console.error("No access token found in sessionStorage");
    return;
  }

  try {
    const response = await fetch(`api/2fa/verify/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ otp: otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      DomUtils.createAlert("alert.failedToVerify", errorData.message);
      return;
    }

    DomUtils.createAlert("alert.2faSuccess", null, () => {
      window.location.href = "/profile";
    });
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    DomUtils.createAlert("alert.unknownError");
  }
}

async function handleDisable2FA() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  try {
    const response = await fetch(`api/2fa/disable/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      DomUtils.createAlert("alert.failedToDisable", errorData.message);
      return;
    }

    DomUtils.createAlert("alert.2faDisableSuccess", null, () => {
      window.location.href = "/profile";
    });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    DomUtils.createAlert("alert.2faDisableError");
  }
}

//document.addEventListener("DOMContentLoaded", function () {
//  document
//    .getElementById("enable-2fa")
//    .addEventListener("click", handleEnable2FA);
//  document
//    .getElementById("disable-2fa")
//    .addEventListener("click", handleDisable2FA);
//  document
//    .getElementById("done-button")
//    .addEventListener("click", handleDone2FA);
//});

function displayFriendsList(friend_list) {
  const userListContainer = document.getElementById("friends-list");
  userListContainer.innerHTML = "";

  if (friend_list.length === 0) {
    userListContainer.className = "tiny5";
    userListContainer.innerHTML = `<li data-i18n="profile.noFriends">No friends found 😔</li>`;
    applyTranslations();
    return;
  }

  friend_list.forEach((user) => {
    const listItem = document.createElement("li");
    listItem.className = "friend-item";

    const usernameSpan = document.createElement("span");
    usernameSpan.textContent = user.username;
    usernameSpan.className = "friend-username";

    //const statusSpan = document.createElement("span");
    //statusSpan.className = "friend-status";
    //statusSpan.textContent = user.online_status ? "🟢" : "🔴";
    //statusSpan.style.marginLeft = "10px";

    listItem.appendChild(usernameSpan);
    //listItem.appendChild(statusSpan);
    userListContainer.appendChild(listItem);
  });
}

function displayAllUsersList(user_list) {
  const userListContainer = document.getElementById("all-users");
  userListContainer.innerHTML = "";

  user_list.forEach((user) => {
    if (user.username === sessionStorage.getItem("username")) {
      return;
    }
    const listItem = document.createElement("li");
    listItem.classList.add("item");
    listItem.classList.add("tiny5");

    const usernameSpan = document.createElement("span");
    usernameSpan.textContent = user.username;
    usernameSpan.className = "username";

    //const statusSpan = document.createElement("span");
    //statusSpan.className = "status";
    //statusSpan.textContent = user.online_status ? "🟢" : "🔴";
    //statusSpan.style.marginLeft = "10px";

    const actionButton = document.createElement("button");
    actionButton.className = "friend-action-btn";
    actionButton.setAttribute("data-username", user.username);

    // Update button appearance based on friendship status
    updateFriendButton(user, actionButton);

    listItem.appendChild(usernameSpan);
    //listItem.appendChild(statusSpan);
    listItem.appendChild(actionButton); // Append the button here
    userListContainer.appendChild(listItem);
  });
}

function updateFriendButton(user, button) {
  if (!user) {
    console.error("No user data provided");
    return;
  }

  const friendlist = JSON.parse(sessionStorage.getItem("friendlist")) || [];
  const friendRequestsSent =
    JSON.parse(sessionStorage.getItem("friendRequestsSent")) || [];
  const friendRequestsReceived =
    JSON.parse(sessionStorage.getItem("friendRequestsReceived")) || [];

  const is_friend = friendlist.includes(user.username);
  const fr_is_sent = friendRequestsSent.includes(user.username);
  const fr_is_received = friendRequestsReceived.includes(user.username);
  function disableButtonForDuration() {
    button.disabled = true;
    fetchAllUsersList();
    fetchFriendsListProfile();
    setTimeout(() => {
      button.disabled = false;
    }, 3000); // Re-enable the button after 3 seconds
    window.location.reload(); // JJJ refresh site
  }
  if (is_friend) {
    button.textContent = "➖"; // Green minus
    button.style.backgroundColor = "#4CAF50"; // Green
    button.onclick = function () {
      console.log("HIHIHI clicked keine Freunde mehr fuer dich");
      unfriendUser(user.username, button);
      disableButtonForDuration();
    };
  } else if (fr_is_sent) {
    button.textContent = "⏳"; // Clock icon
    button.style.backgroundColor = "#808080"; // Grey
    button.onclick = null; // No action needed
  } else if (fr_is_received) {
    button.textContent = "⚠️"; // Yellow warning
    button.style.backgroundColor = "#FFD700"; // Yellow
    button.onclick = function () {
      console.log("HEHEHE clicked mehr Freunde fuer dich");
      acceptFriendRequest(user.username, button);
      disableButtonForDuration();
    };
  } else {
    button.textContent = "➕"; // Default add button
    button.style.backgroundColor = "#4CAF50"; // Green
    button.onclick = function () {
      console.log("HAHAHA clicked vielleicht mehr Freunde fuer dich");
      sendFriendRequest(user.username, button);
      disableButtonForDuration();
    };
  }
}

async function sendFriendRequest(username) {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  // Get current sent requests from sessionStorage
  let friendRequestsSent =
    JSON.parse(sessionStorage.getItem("friendRequestsSent")) || [];

  let friendRequestsReceived =
    JSON.parse(sessionStorage.getItem("friendRequestsReceived")) || [];

  // Prevent duplicate friend requests
  if (friendRequestsSent.includes(username)) {
    console.warn("Friend request already sent to:", username);
    DomUtils.createAlert("alert.friendRequestAlreadySent");
    return;
  } else if (friendRequestsReceived.includes(username)) {
    DomUtils.createAlert("alert.friendRequestAlreadyReceived");
    console.warn("Friend request already received from: ", username);
    return;
  }

  fetch(`api/auth/friends/request/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ friend_username: username }),
  })
    .then(async (response) => {
      const responseData = await response.json();
      if (!response.ok)
        throw new Error(
          responseData.message || "Failed to send friend request"
        );

      if (responseData.success) {
        console.log("Friend request sent successfully to:", username);

        // Update sessionStorage with new friend request
        friendRequestsSent.push(username);
        sessionStorage.setItem(
          "friendRequestsSent",
          JSON.stringify(friendRequestsSent)
        );

        // Dispatch event to notify UI components
        //document.dispatchEvent(new Event("friendRequestSent"));
      } else {
        console.error("Failed to send friend request:", responseData.message);
      }
    })
    .catch((error) => {
      console.error("Error sending friend request:", error);
      DomUtils.createAlert("alert.friendRequestAlreadyExists");
    });
}

async function acceptFriendRequest(username) {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

    let friends = JSON.parse(sessionStorage.getItem("friendlist")) || [];
    let friendRequestsReceived =
        JSON.parse(sessionStorage.getItem("friendRequestsReceived")) || [];

    if (
        friends.includes(username) ||
        !friendRequestsReceived.includes(username)
    ) {
        console.warn("Friend request already accepted from:", username);
        DomUtils.createAlert("alert.friendRequestAlreadyAccepted");
        return;
    }

  fetch(`api/auth/friends/add/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ friend_username: username }),
  })
    .then(async (response) => {
      const responseData = await response.json();
      if (!response.ok)
        throw new Error(
          responseData.message || "Failed to accept friend request"
        );

      if (responseData.success) {
        console.log("Friend accepted successfully:", username);

        friendRequestsReceived = friendRequestsReceived.filter(
          (user) => user !== username
        );
        sessionStorage.setItem(
          "friendRequestsReceived",
          JSON.stringify(friendRequestsReceived)
        );
        friends.push(username);
        sessionStorage.setItem("friendlist", JSON.stringify(friends));

        // Dispatch event to notify UI components
        //document.dispatchEvent(new Event("friendRequestSent"));
      } else {
        console.error("Failed to accept friend request:", responseData.message);
      }
    })
    .catch((error) => {
      console.error("Error accepting friend request:", error);
      DomUtils.createAlert("alert.friendRequestAcceptError");
    });
  fetchFriendsList();
}

async function unfriendUser(username, button) {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

    let friends = JSON.parse(sessionStorage.getItem("friendlist")) || [];

    if (!friends.includes(username)) {
        console.warn("Friend not found in friend list:", username);
        DomUtils.createAlert("alert.friendAlreadyRemoved");
        return;
    }

  fetch(`api/auth/friends/remove/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ friend_username: username }),
  })
    .then(async (response) => {
      const responseData = await response.json();
      if (!response.ok)
        throw new Error(responseData.message || "Failed to remove friend");

      if (responseData.success) {
        console.log("Friend removed successfully:", username);

        // Remove friend from UI
        const listItem = button.closest("li");
        if (listItem) listItem.remove();

        friends = friends.filter((user) => user !== username);
        sessionStorage.setItem("friendlist", JSON.stringify(friends));

        // Dispatch event to update UI
        document.dispatchEvent(new Event("friendRemoved"));
      } else {
        console.error("Failed to remove friend:", responseData.message);
      }
    })
    .catch((error) => {
      console.error("Error removing friend:", error);
      DomUtils.createAlert("alert.friendAlreadyRemoved");
    });
}

export async function fetchFriendsListProfile() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  fetch(`api/auth/friends/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }
      return response.json();
    })
    .then((responseData) => {
      const usernames = responseData.data.map((friend) => friend.username);
      sessionStorage.setItem("friendlist", JSON.stringify(usernames));
      const friendDetails = responseData.data.map((friend) => ({
        profile_picture: friend.profile_picture,
        online_status: friend.online_status,
        username: friend.username,
      }));
      console.log("Friend Details:", friendDetails);
      displayFriendsList(friendDetails);
      document.dispatchEvent(new Event("friendListfetched"));
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      DomUtils.createAlert("alert.errorFetchingData");
    });
}

export async function fetchFriendsList() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  fetch(`api/auth/friends/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }
      return response.json();
    })
    .then((responseData) => {
      const usernames = responseData.data.map((friend) => friend.username);
      sessionStorage.setItem("friendlist", JSON.stringify(usernames));
      const friendDetails = responseData.data.map((friend) => ({
        profile_picture: friend.profile_picture,
        online_status: friend.online_status,
        username: friend.username,
      }));
      console.log("Friend Details:", usernames);
      document.dispatchEvent(new Event("friendListfetched"));
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      DomUtils.createAlert("alert.errorFetchingData");
    });
}

export async function fetchFriendRequests() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  fetch(`api/auth/friends/request`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch friend requests");
      }
      return response.json();
    })
    .then((responseData) => {
      const { friend_requests_sent, friend_requests_received } =
        responseData.data;

      // Store in sessionStorage
      sessionStorage.setItem(
        "friendRequestsSent",
        JSON.stringify(friend_requests_sent)
      );
      sessionStorage.setItem(
        "friendRequestsReceived",
        JSON.stringify(friend_requests_received)
      );

      // Dispatch event to notify other parts of the app
      //document.dispatchEvent(new Event("friendRequestsFetched"));

      console.log("Friend Requests Sent:", friend_requests_sent);
      console.log("Friend Requests Received:", friend_requests_received);
    })
    .catch((error) => {
      console.error("Error fetching friend requests:", error);
      DomUtils.createAlert("alert.errorFetchingData");
    });
}

export async function fetchBlockedUserList() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  fetch(`api/auth/blocked/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }
      return response.json();
    })
    .then((responseData) => {
      const usernames = JSON.stringify(responseData.data);
      sessionStorage.setItem("blockedList", usernames);
      document.dispatchEvent(new Event("blockedListfetched"));
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      DomUtils.createAlert("alert.errorFetchingData");
    });
}

export async function fetchAllUsersList() {
  let token = await checkToken();
  if (!token)
    return;
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token)
    return;
  fetchFriendRequests();

  fetch(`api/auth/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }
      return response.json();
    })
    .then((responseData) => {
      const usernames = responseData.users.map((user) => user.username);
      sessionStorage.setItem("userlist", JSON.stringify(usernames));
      const userDetails = responseData.users.map((user) => ({
        online_status: user.online_status,
        username: user.username,
      }));
      console.log(
        "All Usernames:",
        JSON.parse(sessionStorage.getItem("userlist"))
      );
      displayAllUsersList(userDetails);
      document.dispatchEvent(new Event("AllusersListfetched"));
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      DomUtils.createAlert("alert.errorFetchingData");
    });
}

async function fetchMatchHistory() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  let matchHistoryResponse = await fetch(
    `api/auth/matches/history/`,
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
      console.log(responseData);
      return responseData;
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      DomUtils.createAlert("alert.errorFetchingData");
    });

  // console.log("- - - - - - LOG OUTPUT FROM MATCH HISTORY - - - - - -");
  // console.log(matchHistoryResponse);
  // console.log(matchHistoryResponse.wins);
  // console.log(matchHistoryResponse.losses);
  // console.log(matchHistoryResponse.matches);
  renderMatchHistoryCompact(matchHistoryResponse.matches);
}

// function renderMatchHistory(matches) {
//   const scoreboardBox = document.querySelector(".scoreboard-box");
//   if (!scoreboardBox) {
//     console.error("Scoreboard box element not found");
//     return;
//   }

//   // Sort matches from newest to oldest
//   matches.sort((a, b) => new Date(b.date) - new Date(a.date));

//   const matchList = document.createElement("ol");
//   matchList.className = "match-list";

//   if (matches.length === 0) {
//     const noMatchesMessage = document.createElement("div");
//     noMatchesMessage.className = "no-matches-message";
//     noMatchesMessage.innerHTML = `<p class="tiny5" data-i18n="profile.noMatches">No matches found. Maybe you should start playing! 😜</p>`;
//     scoreboardBox.appendChild(noMatchesMessage);
//     return;
//   }

//   matches.forEach((match, index) => {
//     const matchItem = document.createElement("li");
//     matchItem.className = "match-item tiny5";
//     matchItem.style.textAlign = "left";
//     matchItem.innerHTML = `
//       <div><strong data-i18n="profile.opponent">Opponent:</strong> ${match.opponent}</div>
//       <div><strong data-i18n="profile.result">Result:</strong> ${match.result}</div>
//       <div><strong data-i18n="profile.yourScore">Your Score:</strong> ${match.user_score}</div>
//       <div><strong data-i18n="profile.opponentScore">Opponent's Score:</strong> ${match.opponent_score}</div>
//       <div><strong data-i18n="profile.date">Date:</strong> ${new Date(match.date).toLocaleString()}</div>
//     `;
//     matchList.appendChild(matchItem);

//     if (index < matches.length - 1) {
//       const separator = document.createElement("hr");
//       separator.style.border = "1px solid #fff";
//       matchList.appendChild(separator);
//     }
//   });

//   scoreboardBox.appendChild(matchList);
// }

function renderMatchHistoryCompact(matches) {
  const scoreboardBox = document.querySelector(".scoreboard-box");
  if (!scoreboardBox) {
    console.error("Scoreboard box element not found");
    return;
  }

  // Sort matches from newest to oldest
  matches.sort((a, b) => new Date(b.date) - new Date(a.date));

  const matchList = document.createElement("ol");
  matchList.className = "match-list-compact";
  const user = sessionStorage.getItem("username");

  if (matches.length === 0) {
    const noMatchesMessage = document.createElement("div");
    noMatchesMessage.className = "no-matches-message";
    noMatchesMessage.innerHTML = `<p class="tiny5" data-i18n="profile.noMatches">No matches found. Maybe you should start playing! 😜</p>`;
    scoreboardBox.appendChild(noMatchesMessage);
    return;
  }

  matches.forEach((match, index) => {
    const matchItem = document.createElement("li");
    matchItem.className = "match-item-compact tiny5";
    matchItem.style.textAlign = "left";
    matchItem.innerHTML = `
      <div>${user} - ${match.user_score} - ${match.opponent_score} - ${
      match.opponent
    }</div>
      <div>${new Date(match.date).toLocaleString()}</div>
    `;
    matchList.appendChild(matchItem);

    if (index < matches.length - 1) {
      const separator = document.createElement("hr");
      separator.style.border = "1px solid #fff";
      matchList.appendChild(separator);
    }
  });

  scoreboardBox.appendChild(matchList);
}


async function updatePreferredLanguage() {
  const selectedLanguage = document.querySelector(
    'input[name="language"]:checked'
  ).value;

  let token = await checkToken();
  if (!token) {
    DomUtils.createAlert("alert.loginRequired");
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  const data = { favourite_language: selectedLanguage };

  try {
    const response = await fetch(`api/auth/users/update/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (response.ok) {
      DomUtils.createAlert("alert.languageSuccess");
      // Change the current language selected
      setLanguage(selectedLanguage);
      sessionStorage.setItem("lang", selectedLanguage);
      setCookie("preferred_language", selectedLanguage, 365);
    } else {
      DomUtils.createAlert(
        "alert.languageError",
        responseData.detail || "Unknown error"
      );
    }
  } catch (error) {
    console.error("Error updating preferred language:", error);
    DomUtils.createAlert("alert.unknownError");
  }
}

async function fetchFavouriteLanguage() {
  let token = await checkToken();
  if (!token) {
    return; // Exit if token is not available
  }
  if (isTokenExpired(token))
    token = await refreshToken();
  if (!token) {
    return; // Exit if token is not available
  }

  try {
    const response = await fetch(`api/auth/users/me/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch favourite language");
    }

    const data = await response.json();
    const favouriteLanguage = data.favourite_language;
    sessionStorage.setItem("fav_lang", favouriteLanguage);
    console.log(
      "Favourite language saved in sessionStorage:",
      favouriteLanguage
    );
  } catch (error) {
    console.error("Error fetching favourite language:", error);
  }
}



//////// Cookie functions
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

export function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}