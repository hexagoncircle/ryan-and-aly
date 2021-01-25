const themeSwitch = document.getElementById("theme-switch");

document.documentElement.dataset.theme = "dark";
window.addEventListener("load", () =>
  document.documentElement.classList.remove("no-js")
);

themeSwitch.addEventListener("click", (e) => {
  if (themeSwitch.checked) {
    document.documentElement.dataset.theme = "dark";
  } else {
    document.documentElement.dataset.theme = "light";
  }
});
