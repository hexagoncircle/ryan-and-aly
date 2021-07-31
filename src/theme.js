const displayModeSwitch = document.getElementById("mode-switch");

const setSiteDisplayMode = () => {
  document.body.dataset.mode = displayModeSwitch.checked ? "dark" : "light";
};

/**
 * Initialize theme
 */
const initTheme = () => {
  if (document.body.dataset.mode === "light") {
    displayModeSwitch.checked = true;
  }

  setSiteDisplayMode();
};

window.addEventListener("keypress", (e) => {
  if (e.code === "KeyM") {
    displayModeSwitch.checked = !displayModeSwitch.checked;
    return setSiteDisplayMode();
  }
});

displayModeSwitch.addEventListener("click", setSiteDisplayMode);

initTheme();
