const displayModeSwitch = document.getElementById("mode-switch");
const thermostatControl = document.querySelector(".thermostat-control");
const thermostatFill = document.querySelector(".thermostat-fill");
const thermostatKnob = document.querySelector(".thermostat-knob");
const thermostatNumber = document.querySelector(".thermostat-number");
const thermostatRingRadius = thermostatFill.r.baseVal.value;
const thermostatRingCirc = thermostatRingRadius * 2 * Math.PI;
const midTemp = { min: 92, max: 102 };
const skull = document.querySelector(".svg-skull");
let skullActiveExpression = skull.dataset.expression;

const setSiteDisplayMode = () => {
  document.body.dataset.mode = displayModeSwitch.checked ? "dark" : "light";
};

const getTemperature = (value) => {
  const min = 80;
  return value / 6 + min;
};

const setThermostatNumberDisplay = (value) => {
  thermostatNumber.textContent = parseFloat(value.toFixed());
};

const setThermostatProgress = (percent) => {
  const offset = thermostatRingCirc - (percent / 100) * thermostatRingCirc;
  thermostatFill.style.strokeDashoffset = offset;
};

const animateSkullExpression = () => {
  const cls = "is-animating";

  const animationCallback = () => {
    setTimeout(() => skull.classList.remove(cls));
    skull.removeEventListener("animationend", animationCallback, false);
  };

  skull.classList.add(cls);
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

gsap.to(".svg-stars", {
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

window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.remove("no-js");
});

displayModeSwitch.addEventListener("click", setSiteDisplayMode);

window.addEventListener("keypress", (e) => {
  if (e.code === "KeyM") {
    displayModeSwitch.checked = !displayModeSwitch.checked;
    return setSiteDisplayMode();
  }
});
