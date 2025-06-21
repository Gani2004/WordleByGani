/* jshint esversion: 11 */

let currentRow = 0;
let currentGuess = '';
const board = document.getElementById('board');
const keyboard = document.getElementById('keyboard');
const popup = document.getElementById('popup');
const popupMessage = document.getElementById('popup-message');
const newGameBtn = document.getElementById('newGameBtn');
const errorMsg = document.getElementById('error-message');

const KEYS = [
  'Q','W','E','R','T','Y','U','I','O','P',
  'A','S','D','F','G','H','J','K','L',
  'Enter','Z','X','C','V','B','N','M','Del'
];

// Setup board
for (let i = 0; i < 30; i++) {
  const tile = document.createElement('div');
  tile.classList.add('tile');
  tile.setAttribute('id', `tile-${i}`);
  board.appendChild(tile);
}

// Setup keyboard
KEYS.forEach(key => {
  const btn = document.createElement('button');
  btn.textContent = key;
  btn.className = 'key';
  if (key === 'Enter' || key === 'Del') btn.classList.add('key-wide');
  btn.addEventListener('click', () => handleKey(key));
  keyboard.appendChild(btn);
});

function handleKey(key) {
  if (!popup.classList.contains('hidden')) return;

  if (key === 'Del') {
    currentGuess = currentGuess.slice(0, -1);
  } else if (key === 'Enter') {
    submitGuess();
    return;
  } else if (/^[a-zA-Z]$/.test(key) && currentGuess.length < 5) {
    currentGuess += key.toLowerCase();
  }

  updateTiles();
}

function updateTiles() {
  for (let i = 0; i < 5; i++) {
    const tileIndex = currentRow * 5 + i;
    const tile = document.getElementById(`tile-${tileIndex}`);
    tile.textContent = currentGuess[i]?.toUpperCase() || '';
  }
}

function markUsedKey(letter, color) {
  const keyButtons = document.querySelectorAll('.key');
  keyButtons.forEach(btn => {
    if (btn.textContent.toLowerCase() === letter) {
      if (!btn.classList.contains('green')) {
        btn.classList.remove('grey', 'yellow');
        btn.classList.add(color);
        if (color === 'grey') btn.classList.add('used-grey');
      }
    }
  });
}

function updateFeedback(result) {
  for (let i = 0; i < 5; i++) {
    const index = currentRow * 5 + i;
    const tile = document.getElementById(`tile-${index}`);
    tile.classList.add(result[i]);
    markUsedKey(currentGuess[i], result[i]);
  }
  currentRow++;
  currentGuess = '';
}

function submitGuess() {
  if (currentGuess.length !== 5) {
    errorMsg.textContent = "Enter a 5-letter word!";
    return;
  }

  fetch('/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess: currentGuess })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        errorMsg.textContent = data.error;
      } else {
        updateFeedback(data.result);
        errorMsg.textContent = '';
        if (data.win) {
          showPopup("You guessed it! Start a new game?");
        } else if (data.reveal) {
          showPopup(`Out of chances! Word was: ${data.reveal.toUpperCase()}`);
        }
      }
    })
    .catch(() => {
      errorMsg.textContent = "Server error. Try again.";
    });
}

function showPopup(message) {
  popupMessage.textContent = message;
  popup.classList.remove('hidden');
}

function resetGame() {
  fetch('/reset', { method: 'POST' })
    .then(() => window.location.reload());
}

newGameBtn.addEventListener('click', resetGame);

// 🛡️ Prevent double letter entry (especially on mobile)
let lastHandledKey = null;
let lastHandledTime = 0;
function debounceKey(key) {
  const now = Date.now();
  if (key === lastHandledKey && now - lastHandledTime < 200) return false;
  lastHandledKey = key;
  lastHandledTime = now;
  return true;
}

// 🔑 Full Keyboard Support (Desktop + Soft Keyboard)
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key === 'Enter') return handleKey('Enter');
  if (key === 'Backspace') return handleKey('Del');
  if (/^[a-zA-Z]$/.test(key)) {
    if (debounceKey(key.toUpperCase())) {
      handleKey(key.toUpperCase());
    }
  }
});

// 🧠 Mobile Soft Keyboard Hack: Invisible input for iOS/Android
const mobileInput = document.createElement('input');
mobileInput.type = 'text';
mobileInput.inputMode = 'text';
mobileInput.autocapitalize = 'characters';
mobileInput.style.opacity = '0';
mobileInput.style.position = 'absolute';
mobileInput.style.zIndex = '-1';
mobileInput.style.height = '0';
document.body.appendChild(mobileInput);

// Focus invisible input to trigger mobile keyboard
document.body.addEventListener('click', () => {
  mobileInput.focus();
});

// Handle mobile input
mobileInput.addEventListener('input', (e) => {
  const value = e.target.value.toUpperCase();
  e.target.value = '';
  if (/^[A-Z]$/.test(value) && debounceKey(value)) {
    handleKey(value);
  }
});

// Show rules popup only once
window.addEventListener('load', () => {
  const rulesPopup = document.getElementById('rules-popup');
  const startBtn = document.getElementById('startBtn');
  if (!sessionStorage.getItem('rulesShown')) {
    rulesPopup.classList.remove('hidden');
  }
  startBtn?.addEventListener('click', () => {
    rulesPopup.classList.add('hidden');
    sessionStorage.setItem('rulesShown', 'true');
  });
});
