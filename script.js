// Game configuration and state variables
const DIFFICULTY_SETTINGS = {
  easy: { goal: 12, time: 35, spawnRate: 1200, badChance: 0.15 },
  normal: { goal: 20, time: 30, spawnRate: 1000, badChance: 0.25 },
  hard: { goal: 25, time: 22, spawnRate: 700, badChance: 0.35 }
};

const MILESTONE_MESSAGES = [
  'Great start! Keep going!',
  'Nice! You’re halfway there!',
  'Awesome! Just a few more to go!'
];

let selectedDifficulty = 'normal'; // Tracks the selected difficulty
let currentGoal = DIFFICULTY_SETTINGS[selectedDifficulty].goal; // Total items needed to collect
let currentStartTime = DIFFICULTY_SETTINGS[selectedDifficulty].time; // Starting time for the game in seconds
let currentCans = 0;         // Current number of items collected
let timeLeft = currentStartTime;   // Current time remaining
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let timerInterval;           // Holds the interval for the countdown timer
let milestoneIndex = 0;      // Tracks which milestone message should appear next

// Cache common elements so they are easier to update
const cansDisplay = document.getElementById('current-cans');
const goalDisplay = document.getElementById('goal-cans');
const timerDisplay = document.getElementById('timer');
const achievementsDisplay = document.getElementById('achievements');
const startButton = document.getElementById('start-game');
const resetButton = document.getElementById('reset-game');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

// Added simple built-in sound effects using Web Audio
let audioContext;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playTone(frequency, duration, type = 'sine', volume = 0.03) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();

  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + duration
  );

  oscillator.stop(audioContext.currentTime + duration);
}

function playGoodSound() {
  playTone(750, 0.08, 'triangle');
}

function playBadSound() {
  playTone(180, 0.12, 'sawtooth');
}

function playStartSound() {
  playTone(500, 0.06, 'triangle');
}

function playWinSound() {
  playTone(700, 0.08, 'triangle');
  setTimeout(() => playTone(900, 0.08, 'triangle'), 100);
}

function playLoseSound() {
  playTone(220, 0.15, 'square');
}

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
updateAchievementMessage('Choose a difficulty and press Start Game.');

// Updates the score and timer display
function updateDisplay() {
  cansDisplay.textContent = currentCans;
  goalDisplay.textContent = currentGoal;
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
  const spawnBadDrop = Math.random() < DIFFICULTY_SETTINGS[selectedDifficulty].badChance; // Difficulty-based chance of bad item

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

  initAudio();
  playGoodSound();

  currentCans++;
  updateDisplay();

  // Milestone feedback
  const milestoneThresholds = [
    Math.ceil(currentGoal * 0.25),
    Math.ceil(currentGoal * 0.5),
    Math.ceil(currentGoal * 0.75)
  ];

  if (
    milestoneIndex < milestoneThresholds.length &&
    currentCans >= milestoneThresholds[milestoneIndex]
  ) {
    updateAchievementMessage(MILESTONE_MESSAGES[milestoneIndex]);
    milestoneIndex++;
  }

  // Check for win condition
  if (currentCans >= currentGoal) {
    endGame(true);
    return;
  }

  // Spawn the next item immediately after a successful click
  spawnWaterCan();
}

// Handles when the player clicks a bad item
function handleBadItemClick() {
  if (!gameActive) return;

  initAudio();
  playBadSound();

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
      endGame(currentCans >= currentGoal);
    }
  }, 1000);
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active

  initAudio();
  playStartSound();

  // Reset game state before starting
  currentGoal = DIFFICULTY_SETTINGS[selectedDifficulty].goal;
  currentStartTime = DIFFICULTY_SETTINGS[selectedDifficulty].time;
  currentCans = 0;
  timeLeft = currentStartTime;
  gameActive = true;
  milestoneIndex = 0;

  updateDisplay();
  updateAchievementMessage('Game started! Collect the cans!');

  createGrid(); // Set up the game grid
  spawnWaterCan(); // Spawn the first item immediately
  startTimer(); // Start the countdown timer

  // Spawn water cans based on selected difficulty
  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnWaterCan, DIFFICULTY_SETTINGS[selectedDifficulty].spawnRate);
}

function endGame(didWin) {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop the timer

  // Clear remaining items from the board
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  if (didWin) {
    initAudio();
    playWinSound();
    updateAchievementMessage(`You win! You collected all ${currentGoal} items!`, 'win-message');
    launchConfetti();
  } else {
    initAudio();
    playLoseSound();
    updateAchievementMessage(`Time's up! You collected ${currentCans} items.`, 'lose-message');
  }
}

// Resets the game back to its starting state
function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);

  currentGoal = DIFFICULTY_SETTINGS[selectedDifficulty].goal;
  currentStartTime = DIFFICULTY_SETTINGS[selectedDifficulty].time;
  currentCans = 0;
  timeLeft = currentStartTime;
  milestoneIndex = 0;

  updateDisplay();
  updateAchievementMessage('Game reset. Choose a difficulty and press Start Game.');

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

// Set up click handlers for the difficulty buttons
difficultyButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectedDifficulty = button.dataset.difficulty;

    difficultyButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    if (!gameActive) {
      currentGoal = DIFFICULTY_SETTINGS[selectedDifficulty].goal;
      currentStartTime = DIFFICULTY_SETTINGS[selectedDifficulty].time;
      timeLeft = currentStartTime;
      updateDisplay();
      updateAchievementMessage(`${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} mode selected. Press Start Game.`);
    } else {
      updateAchievementMessage('Difficulty changed. It will apply next round.');
    }
  });
});

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);

// Set up click handler for the reset button
document.getElementById('reset-game').addEventListener('click', resetGame);