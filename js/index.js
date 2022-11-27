const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("login-button");

console.log(submitButton.classList);
let password = "";
let username = "";

// Add event listeners to track change of the username and password fields
usernameInput.addEventListener("change", (e) => {
  username = e.target.value;
});

passwordInput.addEventListener("change", (e) => {
  password = e.target.value;
});

loginForm.addEventListener("submit", async (e) => {
  submitButton.classList.add("loading");
  submitButton.setAttribute("disabled", true);

  e.preventDefault();
  //   Send the request with the username and password to the login endpoint
  fetch("https://freddy.codesubmit.io/login", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => {
      console.log(res.status);
      if (res.status === 401) {
        throw new Error("Bad credentials");
      }
      return res.json();
    })
    .then((data) => {
      // Store access and refresh token in the localStorage to use later
      window.localStorage.setItem("access_token", data.access_token);
      window.localStorage.setItem("refresh_token", data.refresh_token);

      //   Routes to the dashboard. Using this approach because it allows users to use the back button unlike the window.location.replace approach
      const a = document.createElement("a");
      a.href = "/pages/dashboard.html";
      a.click();
    })
    .catch((err) => {
      submitButton.classList.remove("loading");
      submitButton.removeAttribute("disabled");
      window.alert(
        "Bad credentials, Please check your username and password and try again!"
      );
      console.log(err);
    });
});

console.log(loginForm);
