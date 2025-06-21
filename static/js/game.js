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
  btn.onclick = () => handleKey(key);
  keyboard.appendChild(btn);
});

function handleKey(key) {
  if (!popup.classList.contains('hidden')) return;

  if (key === 'Del') {
    currentGuess = currentGuess.slice(0, -1);
  } else if (key === 'Enter') {
    submitGuess();
    return;
  } else if (currentGuess.length < 5) {
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
        showPopup("🎉 You guessed it! Start a new game?");
      } else if (data.reveal) {
        showPopup(`❌ Out of chances! Word was: ${data.reveal.toUpperCase()}`);
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

// Keyboard input support
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key === 'Enter') handleKey('Enter');
  else if (key === 'Backspace') handleKey('Del');
  else if (/^[a-zA-Z]$/.test(key)) handleKey(key.toUpperCase());
});
window.addEventListener('load', () => {
  const rulesPopup = document.getElementById('rules-popup');
  const startBtn = document.getElementById('startBtn');

  if (!sessionStorage.getItem('rulesShown')) {
    rulesPopup.classList.remove('hidden');
  }

  startBtn.addEventListener('click', () => {
    rulesPopup.classList.add('hidden');
    sessionStorage.setItem('rulesShown', 'true');
  });
});
