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

/**
 *
 * @param {number} amount The amount to be formatted to the 'k format e.g 1000 will become 1k
 */
const getFormattedIncome = (amount) => {
  const amountLength = String(amount).length;
  if (amountLength < 5) {
    return amount.toLocaleString("en-US");
  } else if (amountLength < 7) {
    return amount.toLocaleString("en-US").split(",")[0] + "k";
  } else {
    return `${amount.toLocaleString("en-US").split(",")[0]},${
      amount.toLocaleString("en-US").split(",")[1]
    }k`;
  }
};

const getDashboardData = () => {
  return new Promise((resolve, reject) => {
    loadAttempts++;
    fetch("https://freddy.codesubmit.io/dashboard", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (loadAttempts < 3) {
            getAccessTokenWithRefreshToken()
              .then((data) => {
                access_token = data.access_token;
                window.localStorage.setItem("access_token", data.access_token);
                getDashboardData();
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
        resolve(data.dashboard);
      });
  });
};

const populateSummary = (salesToday, salesLastMonth, salesLastWeek) => {
  document.getElementById("summary-today").innerText = `$${getFormattedIncome(
    salesToday.total
  )} / ${salesToday.orders} orders`;

  document.getElementById(
    "summary-last-week"
  ).innerText = `$${getFormattedIncome(salesLastWeek.total)} / ${
    salesLastWeek.orders
  } orders`;

  document.getElementById(
    "summary-last-month"
  ).innerText = `$${getFormattedIncome(salesLastMonth.total)} / ${
    salesLastMonth.orders
  } orders`;
};

/**
 *
 * @param {{product: {id: String, image: String, name: String}, revenue: Number, units: Number}[]} bestsellers An array bestsellers objects
 */

const populateBestsellers = (bestsellers) => {
  bestsellers.map((bestseller) => {
    document.querySelector("#bestsellers tbody").innerHTML += `<tr><td>${
      bestseller.product.name
    }</td><td>$${(bestseller.revenue / bestseller.units).toLocaleString(
      "en-US"
    )}</td><td>${bestseller.units.toLocaleString(
      "en-US"
    )}</td><td>$${bestseller.revenue.toLocaleString("en-US")}</td></tr>`;
  });
};

/**
 *
 * @param {*} data sales over time week or sales over time year
 */

const populateChart = (data) => {
  // Extract object keys from the data
  const keys = Object.keys(data);

  //   Get max revenue in dataset
  const max = keys.reduce((prev, curr) => {
    if (prev > data[curr].total) {
      return prev;
    } else {
      return data[curr].total;
    }
  }, 0);

  let curr;
  let labels;

  // Check if keys are for week or month
  if (keys.length === 7) {
    curr = new Date().getDay() + 1;
    labels = ["today", "yesterday"];
    for (let i = 1; i < 6; i++) {
      labels.push(`day ${i}`);
    }
  } else {
    curr = new Date().getMonth() + 1;
    labels = ["this month", "last month"];
    for (let i = 1; i < 11; i++) {
      labels.push(`month ${i}`);
    }
  }

  const keysFormatted = [];

  let index = keys.indexOf(String(curr));

  let count = 0;

  //   Rearrange the keys in order from the current day or month
  for (count; count < keys.length; count++) {
    if (index < 0) {
      index = keys.length - 1;
    }
    keysFormatted.push(keys[index]);

    index--;
  }

  keysFormatted.forEach((key, index) => {
    // append a new bar for each key in the array in order of days going backwards with heights having the percentage of the current values total to the max revenue
    document.querySelector(
      ".chart-container"
    ).innerHTML += `<div class="bar-container"><div class="bar"
    data-month=${key} style="height: ${
      (data[key].total / max) * 100
    }%"></div><span class="label">${labels[index]}</span></div>`;

    curr - 1;

    if (curr === 0) {
      curr = keys.length;
    } else {
      curr -= 1;
    }
  });

  //   labels.forEach((label) => {
  //     document.querySelector(
  //       ".label-container"
  //     ).innerHTML += `<span>${label}</span>`;
  //   });
};

getDashboardData().then(
  ({ bestsellers, sales_over_time_week, sales_over_time_year }) => {
    const salesToday = sales_over_time_week[new Date().getDay() + 1];
    const salesLastWeek = Object.keys(sales_over_time_week).reduce(
      (prev, curr) => {
        prev.orders += sales_over_time_week[curr].orders;
        prev.total += sales_over_time_week[curr].total;

        return prev;
      },
      { orders: 0, total: 0 }
    );
    const salesLastMonth = sales_over_time_year[new Date().getMonth()];
    populateChart(sales_over_time_week);

    populateSummary(salesToday, salesLastMonth, salesLastWeek);

    populateBestsellers(bestsellers);

    const switchElem = document.getElementById("switch");

    switchElem.addEventListener("change", (e) => {
      document.querySelector(".chart-container").innerHTML = "";
      const { checked } = e.target;
      if (checked) {
        document.querySelector(".heading-revenue").innerText =
          "Revenue (last 12 months)";
        populateChart(sales_over_time_year);
      } else {
        document.querySelector(".heading-revenue").innerText =
          "Revenue (last 7 days)";

        populateChart(sales_over_time_week);
      }
    });

    console.log({ sales_over_time_year, sales_over_time_week });
  }
);
