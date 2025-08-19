import { applyTranslations } from "./translations.js";
import * as DomUtils from "./game/DomUtils.js";

export function renderRegisterPage() {
    const pageContainer = document.getElementById('pageContainer');
    const body = document.querySelector('body');
    body.className = 'register-page-body';
    pageContainer.className = 'register-page';
    pageContainer.innerHTML = `
    <div id="contentContainer">
        <div id="registerSection">
            <h2 class="tiny5 header" data-i18n="register.header">Register</h2>
            <form id="registerForm">
                <input type="text" id="username" placeholder="Username" data-i18n-placeholder="register.username" required>
                <input type="email" id="email" placeholder="Email" data-i18n-placeholder="register.email" required>
                <input type="password" id="password" placeholder="Password" data-i18n-placeholder="register.password" required>
                <input type="password" id="password2" placeholder="Confirm Password" data-i18n-placeholder="register.confirmPassword" required>
                <input type="text" id="fullname" placeholder="Full Name" data-i18n-placeholder="register.fullName"> 
                <button type="submit" class="tiny5" data-i18n="register.submit">Register</button>
                <button type="button" class="tiny5"  onclick="navigateTo('/login')" data-i18n="register.loginHere">Login here</button>
            </form>
        </div>
    </div>
`;
    applyTranslations();
    initializeRegisterForm();
}

// Define the getCookie function if you need to include a CSRF token
// function getCookie(name) {
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             // Does this cookie string begin with the name we want?
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }

export function initializeRegisterForm() {
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const fullname = document.getElementById("fullname").value;
      const password2 = document.getElementById("password2").value;
      const validChars = /^[a-zA-Z0-9]+$/;
      const validFullName = /^[a-zA-Z\s]+$/;

      if (username.length > 15) {
        DomUtils.createAlert("alert.usernameTooLong");
        return;
      }

      if (!username || !email || !password || !password2 || !fullname) {
        DomUtils.createAlert("alert.allFieldsRequired");
        return;
      }

      if (password !== password2) {
        DomUtils.createAlert("alert.passwordsDoNotMatch");
        return;
      }

      if (password.length < 8) {
        DomUtils.createAlert("alert.passwordTooShort");
        return;
      }

      if (!validChars.test(username) || !validChars.test(password)) {
        DomUtils.createAlert("alert.invalidPassword1");
        return;
      }
      if (!validFullName.test(fullname)) {
        DomUtils.createAlert("alert.invalidPassword2");
        return;
      }

      const jsonData = {
        username: username,
        email: email,
        password: password,
        fullname: fullname,
        display_name: username,
      };

            try {
                const response = await fetch(`api/auth/register/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(jsonData),
                });

        const responseData = await response.json();

        if (response.ok) {
          DomUtils.createAlert("alert.registrationSuccessful");
          navigateTo("/login");
        } else {
          DomUtils.createAlert("alert.registrationFailed");
          // @Anita - Here's a log of the responsedata from the backend to check out for the data structure :)
          console.log(responseData);
        }
      } catch (error) {
        console.error("Error:", error);
        DomUtils.createAlert("alert.unknownError");
      }
    });
  }
}

// // @Anita ---> initialize register form is called twice??? Why?
// //Best wishes, Tony :)

// document.addEventListener('DOMContentLoaded', initializeRegisterForm);
