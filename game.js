const AVAILABLE_PICTURES = 24;
const CLASS_IS_SHOWN = 'is-shown';
const CLASS_MODAL_IS_SHOWN = 'modal-is-shown';
const PATH_PICTURE_BLANK = 'images/blank.svg';
const SELECTOR_CARDS_CONTAINER = '.cards-container';
const SELECTOR_CONGRATS = '.congrats-container';
const SELECTOR_MOVES = '#moves';
const SELECTOR_PLAY_BTN = '.settings-confirm-btn';
const SELECTOR_RESTART_BTN = '.js-restart-game';
const SELECTOR_TIMER = '.js-timer';
const SELECTOR_SETTINGS_BTN = 'settings-btn';

const { gameSettings: settings } = window;

const INITIAL_STATE = {
  cardsArray: [],
  moveCounter: 1,
  startTimestamp: 0,
  timerInterval: 0,
  btnsDisabled: false,
  lastChoiceId: undefined,
};

const gameElements = {
  cardsContainerEl: document.querySelector(SELECTOR_CARDS_CONTAINER),
  congratsEl: document.querySelector(SELECTOR_CONGRATS),
  movesDisplayEl: document.querySelector(SELECTOR_MOVES),
  playBtnEl: document.querySelector(SELECTOR_PLAY_BTN),
  timerEl: document.querySelector(SELECTOR_TIMER),
  settingsBtnEl: document.getElementById(SELECTOR_SETTINGS_BTN),
  body: document.body,
};

let state = {
  ...INITIAL_STATE,
};

// Functions
// select of random pictures from all available
const getRandomPictures = () => {
  const randomPictures = [];
  while (randomPictures.length < settings.cardsQty / 2) {
    var randomNumber = Math.floor(Math.random() * AVAILABLE_PICTURES) + 1;
    if (randomPictures.indexOf(randomNumber) === -1)
      randomPictures.push(randomNumber);
  }

  return [...randomPictures, ...randomPictures].sort(() => 0.5 - Math.random());
};

const renderTimer = (m, s) => {
  gameElements.timerEl.innerHTML = `
    <span class="time_title">Time: </span>
    <span id="m">${m}</span><span class="chrono_sep">:</span><span id="s">${s}</span>
  `;
};
// Time of the game
const countTime = () => {
  state.startTimestamp = Date.now() / 1000;
  state.timerInterval = setInterval(function () {
    const now = Date.now() / 1000;
    const deltaSeconds = now - state.startTimestamp;
    renderTimer(Math.floor(deltaSeconds / 60), Math.floor(deltaSeconds % 60));
  }, 1000);
};

const incrementMoves = () => {
  gameElements.movesDisplayEl.innerHTML = state.moveCounter++;
};

const showCongrats = () => {
  gameElements.congratsEl.classList.add(CLASS_IS_SHOWN);
  gameElements.body.classList.add(CLASS_MODAL_IS_SHOWN);
};

const hideCongrats = () => {
  gameElements.congratsEl.classList.remove(CLASS_IS_SHOWN);
  gameElements.body.classList.remove(CLASS_MODAL_IS_SHOWN);
};

const flipAllCards = () => {
  state.cardsArray.forEach(({ cardEl }) => flipCard(cardEl));
};

const disableMatchedCards = (selectedCards) => {
  selectedCards.forEach(({ cardEl }) => {
    cardEl.disabled = true;
  });
};

const handleMatchedCards = (selectedCards) => {
  if (selectedCards[0].pictureNumber === selectedCards[1].pictureNumber) {
    state.cardsArray = state.cardsArray.filter(({ isSelected }) => !isSelected);

    if (settings.speed !== '0') {
      setTimeout(function () {
        disableMatchedCards(selectedCards);
      }, settings.speed);
    } else {
      setTimeout(function () {
        disableMatchedCards(selectedCards);
      }, 600);
    }

    return;
  }
};
const handleCardFlipped = () => {
  const selectedCards = state.cardsArray.filter(({ isSelected }) => isSelected);

  // less than two cards selected, do noting
  if (selectedCards.length < 2) {
    return;
  }
  // increment number of pairs shown
  incrementMoves();

  // match
  if (selectedCards.length === 2) {
    handleMatchedCards(selectedCards);
  }

  // no match: back to blank
  if (settings.speed !== '0') {
    // no match - back to blank
    selectedCards.forEach((card) => {
      card.isSelected = false;
    });
    setTimeout(() => {
      selectedCards.forEach(({ cardEl }) => flipCard(cardEl));
    }, settings.speed);
  } else {
    // no match for NONE speed
    if (selectedCards.length < 3) return;
    const firstTwoChosenCards = selectedCards.filter((card) => {
      return card.arrayId !== state.lastChoiceId;
    });
    firstTwoChosenCards.forEach((card) => {
      card.isSelected = false;
    });

    firstTwoChosenCards.forEach(({ cardEl }) => flipCard(cardEl));
  }
};

// ---------------------

const flipCard = (el) => {
  el.classList.toggle(CLASS_IS_SHOWN);
};

// HANDLE ACTION ****************
const handleClick = (e) => {
  const clickedCard = state.cardsArray.find(
    ({ cardEl }) => cardEl === e.currentTarget
  );

  // prevent open and close the same card (first)
  if (clickedCard.isSelected === true) return;
  state.lastChoiceId = clickedCard.arrayId;
  clickedCard.isSelected = !clickedCard.isSelected;

  flipCard(clickedCard.cardEl);
  handleCardFlipped();

  // no cards left, game finished
  if (!state.cardsArray.length) {
    // setTimeout to avoid showing congrats while still checking the last match
    setTimeout(showCongrats, settings.speed);
  }
};
const resetAll = () => {
  clearInterval(state.timerInterval);
  renderTimer('--', '--');

  gameElements.cardsContainerEl.innerHTML = '';
  gameElements.movesDisplayEl.innerHTML = '--';

  state = {
    ...INITIAL_STATE,
  };
};

const renderCardEl = (pictureNumber) => {
  const cardBtnEl = document.createElement('button');
  cardBtnEl.classList.add('card-container');
  cardBtnEl.innerHTML = `
    <img class="card card--blank" src="${PATH_PICTURE_BLANK}">
    <img class="card card--image" src="images/${pictureNumber}.svg">
  `;
  gameElements.cardsContainerEl.appendChild(cardBtnEl);

  return cardBtnEl;
};

const renderBoard = () => {
  gameElements.cardsContainerEl.setAttribute(
    'data-cards-qty',
    `x${settings.cardsQty}`
  );
  state.cardsArray = getRandomPictures().map((pictureNumber, index) => ({
    cardEl: renderCardEl(pictureNumber),
    pictureNumber,
    isSelected: false,
    arrayId: index,
  }));
};

const bindBoard = () => {
  state.cardsArray.forEach(({ cardEl }) => {
    cardEl.addEventListener('click', handleClick);
  });
};

const SwitchDisableRestartSettingsBtns = () => {
  state.btnsDisabled = !state.btnsDisabled;
  document
    .querySelectorAll(SELECTOR_RESTART_BTN)
    .forEach((el) => (el.disabled = state.btnsDisabled));

  gameElements.settingsBtnEl.disabled = state.btnsDisabled;
};

const startNewGame = () => {
  resetAll();
  hideCongrats();
  renderBoard();
  countTime();

  // Check settings: SHOW cards?
  if (settings.showCards === 'true') {
    let displayTime = 8000;

    if (settings.cardsQty <= 32) {
      displayTime = 6000;
    }
    if (settings.cardsQty <= 16) {
      displayTime = 4000;
    }

    flipAllCards();
    SwitchDisableRestartSettingsBtns();

    setTimeout(() => {
      flipAllCards();

      // Disable Restart and settings btns while cards are shown
      SwitchDisableRestartSettingsBtns();

      //block clicking the cards while the cards are shown
      bindBoard();
    }, displayTime);
  } else bindBoard();
};

const handlePlayBtn = () => {
  resetAll();
  settings.closeSettingsModal();
  startNewGame();
};

const bind = () => {
  document
    .querySelectorAll(SELECTOR_RESTART_BTN)
    .forEach((el) => el.addEventListener('click', startNewGame));

  gameElements.playBtnEl.addEventListener('click', handlePlayBtn);
};

bind();
settings.showSettingsModal();
