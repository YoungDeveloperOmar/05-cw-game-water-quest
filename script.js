// Game configuration and state variables
const GOAL_CANS = 20;        // Total items needed to collect
const START_TIME = 30;       // Starting time for the game in seconds
let currentCans = 0;         // Current number of items collected
let timeLeft = START_TIME;   // Current time remaining
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let timerInterval;           // Holds the interval for the countdown timer

// Cache common elements so they are easier to update
const cansDisplay = document.getElementById('current-cans');
const timerDisplay = document.getElementById('timer');
const achievementsDisplay = document.getElementById('achievements');
const startButton = document.getElementById('start-game');
const resetButton = document.getElementById('reset-game');

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();
updateDisplay();

// Updates the score and timer display
function updateDisplay() {
  cansDisplay.textContent = currentCans;
  timerDisplay.textContent = timeLeft;
}

// Shows milestone / status messages to the player
function updateAchievementMessage(message, className = '') {
  achievementsDisplay.textContent = message;
  achievementsDisplay.className = 'achievement';
  
  if (className) {
    achievementsDisplay.classList.add(className);
  }
}

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  
  // Clear all cells before spawning a new water can
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Randomly decide whether to spawn a good water can or a bad drop
  const spawnBadDrop = Math.random() < 0.25; // 25% chance of bad item

  // Use a template literal to create the wrapper and water-can element
  if (spawnBadDrop) {
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <div class="dirty-water"></div>
      </div>
    `;

    // Add click event for bad item
    const dirtyWater = randomCell.querySelector('.dirty-water');
    dirtyWater.addEventListener('click', handleBadItemClick);
  } else {
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <div class="water-can"></div>
      </div>
    `;

    // Add click event for good item
    const waterCan = randomCell.querySelector('.water-can');
    waterCan.addEventListener('click', handleCanClick);
  }
}

// Handles when the player clicks a good water can
function handleCanClick() {
  if (!gameActive) return;

  currentCans++;
  updateDisplay();

  // Milestone feedback
  if (currentCans === 5) {
    updateAchievementMessage('Great start! 5 cans collected!');
  } else if (currentCans === 10) {
    updateAchievementMessage('Nice! You’ve reached 10 cans!');
  } else if (currentCans === 15) {
    updateAchievementMessage('Awesome! Just a few more to go!');
  }

  // Check for win condition
  if (currentCans >= GOAL_CANS) {
    endGame(true);
    return;
  }

  // Spawn the next item immediately after a successful click
  spawnWaterCan();
}

// Handles when the player clicks a bad item
function handleBadItemClick() {
  if (!gameActive) return;

  currentCans = Math.max(0, currentCans - 1); // Prevent score from going below 0
  updateDisplay();
  updateAchievementMessage('Oops! Dirty water lowered your score.', 'lose-message');

  // Spawn the next item immediately after penalty
  spawnWaterCan();
}

// Starts the countdown timer
function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active

  // Reset game state before starting
  currentCans = 0;
  timeLeft = START_TIME;
  gameActive = true;

  updateDisplay();
  updateAchievementMessage('Game started! Collect the cans!');

  createGrid(); // Set up the game grid
  spawnWaterCan(); // Spawn the first item immediately
  startTimer(); // Start the countdown timer

  // Spawn water cans every second
  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnWaterCan, 1000);
}

function endGame(didWin) {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop the timer

  // Clear remaining items from the board
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  if (didWin) {
    updateAchievementMessage('You win! You collected all 20 items!', 'win-message');
    launchConfetti();
  } else {
    updateAchievementMessage(`Time's up! You collected ${currentCans} items.`, 'lose-message');
  }
}

// Resets the game back to its starting state
function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);

  currentCans = 0;
  timeLeft = START_TIME;

  updateDisplay();
  updateAchievementMessage('Game reset. Press Start Game to play again.');

  createGrid();
}

// Creates a simple celebration effect when the player wins
function launchConfetti() {
  for (let i = 0; i < 25; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.textContent = '💧';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.fontSize = `${16 + Math.random() * 18}px`;
    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 2500);
  }
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);

// Set up click handler for the reset button
document.getElementById('reset-game').addEventListener('click', resetGame);