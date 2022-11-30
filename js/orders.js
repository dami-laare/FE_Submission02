let access_token = window.localStorage.getItem("access_token");
const refresh_token = window.localStorage.getItem("refresh_token");

const maxTries = 3;
let loadAttempts = 0;

if (!access_token && !refresh_token) {
  alert("Your session has expired, Please login again.");
  window.location.replace("/index.html");
}

if (!access_token && refresh_token) {
  getAccessTokenWithRefreshToken(refresh_token)
    .then((data) => {
      window.localStorage.setItem("access_token", data.access_token);
      access_token = data.access_token;
    })
    .catch(() => {
      alert("Your session has expired, Please login again.");
      window.location.replace("/index.html");
    });
}

const getAccessTokenWithRefreshToken = () => {
  return new Promise((resolve, reject) => {
    fetch("https://freddy.codesubmit.io/refresh", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${refresh_token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          reject();
          return;
        }
        return res.json();
      })
      .then((data) => {
        resolve(data);
      });
  });
};

const getOrders = (page = 1, searchQuery = "") => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://freddy.codesubmit.io/orders?page=${page}${
        searchQuery ? `&q=${searchQuery}` : ""
      }`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    )
      .then((res) => {
        if (!res.ok) {
          // Retries the request 3 times before throwing an error
          if (loadAttempts < 3) {
            getAccessTokenWithRefreshToken()
              .then((data) => {
                loadAttempts += 1;
                access_token = data.access_token;
                window.localStorage.setItem("access_token", data.access_token);
                getOrders();
              })
              .catch(() => {
                alert("Your session has expired, Please login again.");
                window.location.replace("/index.html");
              });
          } else {
            alert("An error occurred, Please try again later");
            window.location.replace("/index.html");
          }
          return;
        }
        return res.json();
      })
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        console.log({ err });
      });
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case "processing":
      return "red";
    case "shipped":
      return "black";
    case "delivered":
      return "green";
  }
};

/**
 *
 * @param {{product: {id: String, image: String, name: String, quantity: Number}, total: Number, currency: String, created_at: String, customer: {address: {city: String, street: String, zipcode: String}, id: String, name: String, surname: String}, status: String}[]} orders An array of orders
 */

// Populates the order table with the orders gotten from the orders endpoint with styling
const populateOrderTable = (orders) => {
  orders.map((order) => {
    document.querySelector("#orders tbody").innerHTML += `<tr><td>${
      order.product.name
    }</td><td>${new Date(order.created_at).toLocaleString()}</td><td>${
      order.currency
    }${order.total.toLocaleString(
      "en-US"
    )}</td><td style="color: ${getStatusColor(
      order.status
    )};">${order.status[0].toLocaleUpperCase()}${order.status.substring(
      1,
      order.status.length
    )}</td></tr>`;
  });
};

getOrders().then((data) => {
  populateOrderTable(data.orders);
  console.log(data);
});

let page = 1;
let searchQuery = "";

// Handles pagination and page change button
document.getElementById("next-button").addEventListener("click", () => {
  if (page !== 20 && searchQuery.length === 0) {
    page++;
    document.getElementById("page").innerText = `Page ${page} of 20`;

    document.querySelector("#orders tbody").innerHTML = "";

    getOrders(page, searchQuery).then((data) =>
      populateOrderTable(data.orders)
    );
  }
});

// Handles pagination and page change button
document.getElementById("prev-button").addEventListener("click", () => {
  if (page !== 1 && searchQuery.length === 0) {
    page--;
    document.getElementById("page").innerText = `Page ${page} of 20`;

    document.querySelector("#orders tbody").innerHTML = "";

    getOrders(page, searchQuery).then((data) =>
      populateOrderTable(data.orders)
    );
  }
});

// Handles search input change
document.getElementById("search-input").addEventListener("change", (e) => {
  if (e.target.value.length === 0) {
    document.querySelector("#orders tbody").innerHTML = "";
    getOrders(1).then((data) => populateOrderTable(data.orders));
  } else {
    searchQuery = e.target.value;
  }
});

// Handles search submit i.e on enter press
document.getElementById("search").addEventListener("submit", (e) => {
  e.preventDefault();
  document.querySelector("#orders tbody").innerHTML = "";
  document.getElementById("page").innerText = `Page ${page} of 20`;
  getOrders(1, searchQuery).then((data) => populateOrderTable(data.orders));
});
