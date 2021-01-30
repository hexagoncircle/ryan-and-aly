const thermostatButton = document.getElementById("submit-temperature");
const thermostatControl = document.querySelector(".thermostat-control");
const thermostatFill = document.querySelector(".thermostat-fill");
const thermostatKnob = document.querySelector(".thermostat-knob");
const thermostatNumber = document.querySelector(".thermostat-number");
const thermostatRingRadius = thermostatFill.r.baseVal.value;
const thermostatRingCirc = thermostatRingRadius * 2 * Math.PI;

const temperatureGuessText = document.getElementById("temperature-actions");
const temperatureGuessValue = document.getElementById("temperature-actions");
const temperatureResults = document.getElementById("temperature-results");
const temperatureResultsTemplate = { primary: "", secondary: "" };
const temperatureGuessCookieName = "temperatureGuess";

const displayModeSwitch = document.getElementById("mode-switch");
const apiDomain = "https://api.surveyjs.io/public/v1/Survey/";
const midTemp = { min: 93, max: 100 };
const skull = document.querySelector(".svg-skull");
let skullActiveExpression = skull.dataset.expression;

const setSiteDisplayMode = () => {
  document.body.dataset.mode = displayModeSwitch.checked ? "dark" : "light";
};

const hasVoted = () => {
  const cookieExists = document.cookie
    .split(";")
    .some((name) => name.trim().startsWith(temperatureGuessCookieName));

  return cookieExists ? true : false;
};

// Event Handlers
const handleThermostatUpdate = (value) => {
  setThermostatNumberDisplay(getTemperature(value));
  setSkullExpression(getTemperature(value));
  setThermostatProgress((value / 360) * 100);
};

const handleThermostatButtonClick = () => {
  thermostatButton.removeEventListener("click", handleThermostatUpdate);
  fetchTemperatureResults();
};

const handleShowAllResultsClick = (e) => {
  document
    .getElementById("show-all-results")
    .removeEventListener("click", handleShowAllResultsClick);
  e.target.remove();
  renderTemperatureSecondaryResults(temperatureResultsTemplate.secondary);
};

// Skull
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

// Thermostat
const setThermostatButtonText = () => {
  thermostatButton.textContent = hasVoted()
    ? "See the results"
    : "Submit this guess";
};

const setThermostatNumberDisplay = (value) => {
  thermostatNumber.textContent = parseFloat(value.toFixed());
};

const setThermostatProgress = (percent) => {
  const offset = thermostatRingCirc - (percent / 100) * thermostatRingCirc;
  thermostatFill.style.strokeDashoffset = offset;
};

// Temperature
const getTemperatureGuess = () => {
  const cookieValue = document.cookie
    .split("; ")
    .find((name) => name.startsWith(temperatureGuessCookieName))
    .split("=")[1];

  temperatureGuessValue.textContent = `You guessed ${cookieValue} °F`;
};

const getTemperature = (value) => {
  const min = 85;
  return value / 9 + min;
};

const createTemperatureResult = ({ temperature, votes, total, index }) => {
  if (index !== 0) {
    return `
      <li class="temperature-result">
        <div class="value">${temperature}°</div>
        <span class="votes">${votes}</span>
        <progress class="bar" value="${votes}" max="${total}" />
      </li>
    `;
  }

  return `
    <li class="temperature-result top-result">
      <div class="value">
        <span class="heading">${temperature}°</span> top guess
      </div>
      <span class="votes">${votes} people</span>
      <progress class="bar" value="${votes}" max="${total / 2}" />
    </li>
  `;
};

const renderTemperaturePrimaryResults = (results) => {
  temperatureResults.insertAdjacentHTML(
    "afterbegin",
    `
      ${results}
      <button id="show-all-results" class="button button--text">
        Show all results
      </button>
    `
  );

  document.getElementById("show-all-results").addEventListener("click", (e) => {
    handleShowAllResultsClick(e);
  });

  temperatureResultsTimeline
    .staggerFromTo(
      ".temperature-result",
      1,
      { y: -120, opacity: 0 },
      {
        y: -160,
        opacity: 1,
        duration: 0.2,
        ease: "power4.out",
      },
      0.1,
      "-=0.8"
    )
    .fromTo(
      "#show-all-results",
      { y: -160, opacity: 0 },
      {
        y: -160,
        opacity: 1,
        duration: 1,
        ease: "power4.out",
      },
      "-=0.5"
    )
    .resume();
};

const renderTemperatureSecondaryResults = (results) => {
  temperatureResults.insertAdjacentHTML(
    "beforeend",
    `
    <div class="secondary-results">
      ${results}
    </div>
  `
  );

  temperatureResultsTimeline
    .fromTo(
      ".secondary-results",
      { y: -160, opacity: 0 },
      {
        y: -160,
        opacity: 1,
        duration: 0.4,
        ease: "power4.out",
      }
    )
    .resume();
};

const setTemperatureResults = (results, total) => {
  const sortedResults = Object.entries(results).sort((a, b) => b[1] - a[1]);

  sortedResults.map((item, index) => {
    const props = {
      temperature: item[0],
      votes: item[1],
      total: total,
      index,
    };

    if (index < 4) {
      temperatureResultsTemplate.primary += createTemperatureResult(props);
    } else {
      temperatureResultsTemplate.secondary += createTemperatureResult(props);
    }
  });

  renderTemperaturePrimaryResults(temperatureResultsTemplate.primary);
};

/** Todo: Fetch real data once feature-complete */
const fetchTemperatureResults = () => {
  fetch(
    // `${apiDomain}/getResult?resultId=67020da8-7f65-4caf-acad-0da9ead7f0a8&name=temperature`
    "./mockResults.json"
  )
    .then((response) => response.json())
    .then((data) => {
      setTemperatureResults(data.QuestionResult, data.AnswersCount);
    });
};

const sendTemperatureValue = () => {
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

// GSAP
const temperatureResultsTimeline = gsap
  .timeline({ paused: true })
  .to(".thermostat-base-group", {
    opacity: 0,
    duration: 0.5,
    ease: "power4.out",
  })
  .to(
    ".svg-skull",
    {
      x: -200,
      rotation: -25,
      duration: 0.25,
      ease: "power2.out",
    },
    "-=0.25"
  )
  .to(".svg-skull", {
    x: -150,
    rotation: 0,
    duration: 1,
    ease: "elastic.out(1, 0.3)",
  })
  .to(
    ".temperature-actions",
    {
      y: -140,
      duration: 0.6,
      ease: "power4.out",
    },
    "-=1.25"
  );

gsap.set(thermostatControl, { rotation: 45 }).then(() => {
  thermostatFill.style.strokeDasharray = `${thermostatRingCirc} ${thermostatRingCirc}`;
  handleThermostatUpdate(gsap.getProperty(thermostatControl, "rotation"));
});

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

// Init
const init = () => {
  if (document.body.dataset.mode === "light") {
    displayModeSwitch.checked = true;
  }

  setSiteDisplayMode();
  setThermostatButtonText();
  hasVoted() && getTemperatureGuess();

  window.addEventListener("keypress", (e) => {
    if (e.code === "KeyM") {
      displayModeSwitch.checked = !displayModeSwitch.checked;
      return setSiteDisplayMode();
    }
  });

  displayModeSwitch.addEventListener("click", setSiteDisplayMode);
  thermostatButton.addEventListener("click", handleThermostatButtonClick);
};

init();
