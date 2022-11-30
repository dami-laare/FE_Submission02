document.getElementById("logout").addEventListener("click", () => {
  window.localStorage.clear();
  const a = document.createElement("a");
  a.href = "../index.html";
  a.click();
});
