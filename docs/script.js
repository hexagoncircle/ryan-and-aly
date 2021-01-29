const displayModeSwitch = document.getElementById("mode-switch");
const thermostatButton = document.getElementById("submit-temperature");
const thermostatControl = document.querySelector(".thermostat-control");
const thermostatFill = document.querySelector(".thermostat-fill");
const thermostatKnob = document.querySelector(".thermostat-knob");
const thermostatNumber = document.querySelector(".thermostat-number");
const thermostatRingRadius = thermostatFill.r.baseVal.value;
const thermostatRingCirc = thermostatRingRadius * 2 * Math.PI;
const temperatureGuessText = document.getElementById("temperature-guess-text");
const temperatureGuessValue = document.getElementById(
  "temperature-guess-value"
);
const temperatureGuessCookieName = "temperatureGuess";
const midTemp = { min: 93, max: 100 };
const skull = document.querySelector(".svg-skull");
const apiDomain = "https://api.surveyjs.io/public/v1/Survey/";
let skullActiveExpression = skull.dataset.expression;

const hasVoted = () => {
  const cookieExists = document.cookie
    .split(";")
    .some((name) => name.trim().startsWith(temperatureGuessCookieName));

  return cookieExists ? true : false;
};

const setSiteDisplayMode = () => {
  document.body.dataset.mode = displayModeSwitch.checked ? "dark" : "light";
};

const setThermostatButtonText = () => {
  thermostatButton.textContent = hasVoted()
    ? "See results"
    : "Submit this guess";
};

const getTemperatureGuess = () => {
  const cookieValue = document.cookie
    .split("; ")
    .find((name) => name.startsWith(temperatureGuessCookieName))
    .split("=")[1];

  temperatureGuessText.removeAttribute("hidden");
  temperatureGuessValue.textContent = cookieValue;
};

const getTemperature = (value) => {
  const min = 85;
  return value / 9 + min;
};

const setThermostatNumberDisplay = (value) => {
  thermostatNumber.textContent = parseFloat(value.toFixed());
};

const setThermostatProgress = (percent) => {
  const offset = thermostatRingCirc - (percent / 100) * thermostatRingCirc;
  thermostatFill.style.strokeDashoffset = offset;
};

const animateSkullExpression = () => {
  const className = "is-animating";

  const animationCallback = () => {
    setTimeout(() => skull.classList.remove(className));
    skull.removeEventListener("animationend", animationCallback, false);
  };

  skull.classList.add(className);
  skull.addEventListener("animationend", animationCallback);
};

const setSkullExpression = (value) => {
  const temperature = value.toFixed();

  if (temperature < midTemp.min) {
    skull.dataset.expression = 1;
  } else if (temperature > midTemp.max) {
    skull.dataset.expression = 3;
  } else {
    skull.dataset.expression = 2;
  }

  if (skullActiveExpression !== skull.dataset.expression) {
    skullActiveExpression = skull.dataset.expression;
    animateSkullExpression();
  }
};

const handleThermostatUpdate = (value) => {
  setThermostatNumberDisplay(getTemperature(value));
  setSkullExpression(getTemperature(value));
  setThermostatProgress((value / 360) * 100);
};

const fetchTemperatureGuessResults = () => {
  fetch(
    // `${apiDomain}/getResult?resultId=67020da8-7f65-4caf-acad-0da9ead7f0a8&name=temperature`
    "./mockResults.json"
  )
    .then((response) => response.json())
    .then((data) => console.log(data));
};

const submitTemperatureGuess = () => {
  if (hasVoted()) {
    return;
  }

  fetch(`${apiDomain}/post`, {
    method: "post",
    headers: {
      "Content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      PostId: "d12c0918-1995-4f86-91f5-bfd4c373048b",
      SurveyResult: JSON.stringify({
        temperature: thermostatNumber.textContent,
      }),
    }),
  });

  document.cookie = `${temperatureGuessCookieName}=${thermostatNumber.textContent}`;
};

const init = () => {
  if (document.body.dataset.mode === "light") {
    displayModeSwitch.checked = true;
  }

  setSiteDisplayMode();
  setThermostatButtonText();
  hasVoted() && getTemperatureGuess();
};

gsap.to(".svg-parallax", {
  yPercent: -10,
  ease: "none",
  scrollTrigger: {
    trigger: ".js-parallax",
    start: "top",
    end: "+=100%",
    scrub: 0.5,
  },
});

gsap.set(thermostatControl, { rotation: 45 }).then(() => {
  thermostatFill.style.strokeDasharray = `${thermostatRingCirc} ${thermostatRingCirc}`;
  handleThermostatUpdate(gsap.getProperty(thermostatControl, "rotation"));
});

Draggable.create(thermostatControl, {
  trigger: thermostatKnob,
  type: "rotation",
  bounds: {
    minRotation: 0,
    maxRotation: 180,
  },
  onDrag: function () {
    handleThermostatUpdate(this.rotation);
  },
});

window.addEventListener("keypress", (e) => {
  if (e.code === "KeyM") {
    displayModeSwitch.checked = !displayModeSwitch.checked;
    return setSiteDisplayMode();
  }
});

displayModeSwitch.addEventListener("click", setSiteDisplayMode);
thermostatButton.addEventListener("click", fetchTemperatureGuessResults);

init();
