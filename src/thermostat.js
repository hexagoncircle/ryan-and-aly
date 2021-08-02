const thermostat = document.querySelector(".thermostat");
const thermostatButton = document.getElementById("submit-temperature");
const thermostatControl = document.querySelector(".thermostat-control");
const thermostatFill = document.querySelector(".thermostat-fill");
const thermostatKnob = document.querySelector(".thermostat-knob");
const thermostatNumber = document.querySelector(".thermostat-number");
const thermostatRelatedCount = document.querySelector(
  ".thermostat-related-count"
);
const thermostatRingRadius = thermostatFill.r.baseVal.value;
const thermostatRingCirc = thermostatRingRadius * 2 * Math.PI;

const temperatureText = document.querySelector(".thermostat-temp-text");
const temperatureResults = document.getElementById("temperature-results");
const temperatureResultsTemplate = { primary: "", secondary: "" };

const apiDomain = "https://api.surveyjs.io/public/Survey/";
const resultsData = "./temperatureGuessResults.json";
const midTemp = { min: 93, max: 100 };
const skull = document.querySelector(".svg-skull");

const cookieName = {
  guess: "temperature_guess",
  angle: "temperature_angle",
};

let skullActiveExpression = skull.dataset.expression;
let hasGuessed = false;
let currentGuess, currentAngle;

/**
 * Event handlers
 */
const handleThermostatUpdate = (value) => {
  currentAngle = value;
  currentGuess = getTemperature(value);

  thermostatNumber.textContent = getTemperature(value);
  setSkullExpression(getTemperature(value));
  setThermostatProgress((value / 360) * 100);
};

const handleThermostatButtonClick = () => {
  thermostatButton.disabled = true;
  thermostatButton.removeEventListener("click", handleThermostatUpdate);
  sendTemperatureGuess();
};

const handleShowAllResultsClick = (e) => {
  document
    .getElementById("show-all-results")
    .removeEventListener("click", handleShowAllResultsClick);
  e.target.remove();
  renderTemperatureSecondaryResults(temperatureResultsTemplate.secondary);
};

/**
 * Skull
 */
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
  if (value < midTemp.min) {
    skull.dataset.expression = 1;
  } else if (value > midTemp.max) {
    skull.dataset.expression = 3;
  } else {
    skull.dataset.expression = 2;
  }

  if (skullActiveExpression !== skull.dataset.expression) {
    skullActiveExpression = skull.dataset.expression;
    animateSkullExpression();
  }
};

const setThermostatProgress = (percent) => {
  const offset = thermostatRingCirc - (percent / 100) * thermostatRingCirc;
  thermostatFill.style.strokeDashoffset = offset;
};

/**
 * Temperature
 */
const getTemperature = (value) => {
  const min = 85;
  const threshold = 9;
  return parseFloat(value / threshold + min).toFixed();
};

const getTemperatureRelatedCount = (data) => {
  const t = Object.entries(data).find((temp) => currentGuess == temp[0]);
  const guesses = t ? t[1] : 1;

  if (guesses > 2) {
    thermostatRelatedCount.textContent = `${guesses - 1} others guessed`;
  } else if (guesses === 2) {
    thermostatRelatedCount.textContent = `1 other guessed`;
  } else {
    thermostatRelatedCount.textContent = `You guessed it first!`;
  }
};

const createTemperatureResult = ({ temperature, votes, total, index }) => {
  if (index !== 0) {
    return `
      <li class="temperature-result">
        <div class="value">${temperature}°</div>
        <span class="votes">${votes}</span>
        <progress class="bar" value="${votes}" max="${total / 3}" />
      </li>
    `;
  }

  return `
    <li class="temperature-result top-result">
      <div class="value">
        <span class="heading">${temperature}°</span> top guess
      </div>
      <span class="votes">${votes} people</span>
      <progress class="bar" value="${votes}" max="${total / 3.5}" />
    </li>
  `;
};

/**
 * Temperature guess results
 */
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
    .resume()
    .staggerFromTo(
      ".temperature-result",
      1,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: "power4.out",
      },
      0.1,
      "-=0.8"
    )
    .fromTo(
      "#show-all-results",
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.5,
        ease: "power4.out",
      },
      "-=0.5"
    );
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

  temperatureResultsTimeline.resume().to(".secondary-results", {
    opacity: 1,
    height: "auto",
    duration: 0.4,
    ease: "power4.out",
  });
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

/**
 * Thermostat controller
 */
gsap.set(thermostatControl, { rotation: 45 });

const draggableKnob = Draggable.create(thermostatControl, {
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

/**
 * Handle temperature data
 */
const sendTemperatureGuess = () => {
  draggableKnob[0].kill();
  thermostatKnob.classList.add("is-disabled");
  fetchTemperatureResults();
};

const fetchTemperatureResults = () => {
  fetch(resultsData)
    .then((response) => response.json())
    .then((data) => {
      setTemperatureResults(data.QuestionResult, data.AnswersCount);
      getTemperatureRelatedCount(data.QuestionResult);
    })
    .catch(() => (thermostatButton.textContent = "Can't submit at the moment"));
};

/**
 * Results animation timeline
 */
const temperatureResultsTimeline = gsap
  .timeline({ paused: true })
  .to(".thermostat-base-group", {
    opacity: 0,
    scale: 0.96,
    duration: 0.5,
    ease: "power4.out",
  })
  .to(
    ".temperature-results-list",
    {
      height: "auto",
      marginBottom: -100,
      duration: 0.5,
      ease: "power4.out",
    },
    "<"
  )
  .to(
    ".svg-skull",
    {
      x: "-140%",
      rotation: -30,
      duration: 0.25,
      ease: "power2.out",
    },
    "-=0.1"
  )
  .to(".svg-skull", {
    x: "-110%",
    rotation: 0,
    duration: 1,
    ease: "elastic.out(1.2, 0.4)",
  })
  .to(
    ".thermostat-temp",
    {
      x: "25%",
      y: "-118%",
      scale: 0.8,
      duration: 0.5,
      ease: "power4.out",
    },
    "-=1.25"
  )
  .fromTo(
    ".svg-hot-take",
    {
      opacity: 0,
      x: "-50%",
      rotation: -30,
    },
    {
      x: 0,
      rotation: 0,
      opacity: 1,
      duration: 0.75,
      ease: "elastic.out(0.6, 0.3)",
    },
    "-=1"
  )
  .to(
    ".thermostat-related-count",
    {
      opacity: 1,
      duration: 0.5,
      ease: "power4.out",
    },
    "<"
  )
  .to(
    ".temperature-results-list",
    {
      opacity: 1,
      y: -130,
      duration: 0.6,
      ease: "power4.out",
    },
    "<"
  );

/**
 * Parallax
 */
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

/**
 * Initialize thermostat
 */
const initThermostat = () => {
  handleThermostatUpdate(gsap.getProperty(thermostatControl, "rotation"));
};

thermostatButton.addEventListener("click", handleThermostatButtonClick);

initThermostat();
