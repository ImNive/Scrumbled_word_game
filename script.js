console.log("Script is connected!");
const homePage = document.getElementById("home-page");
const gamePage = document.getElementById("game-page");
const endPage = document.getElementById("end-page");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

function showPage(pageToShow) {
  homePage.classList.remove("active");
  gamePage.classList.remove("active");
  endPage.classList.remove("active");
  pageToShow.classList.add("active");
}

// ====== GAME LOGIC ======
let currentWord = "";
let score = 0;
let wrongCount = 0;
let skipUsed = false;
let timer;
let timeLeft = 30;
const maxLives = 3;
const maxSkips = 1;

// 🧠 Updated Banana API: ignore 0, retry, or randomize
async function getNumberFromBananaAPI() {
  let number = 0;
  let tries = 0;

  while ((number < 3 || number > 10) && tries < 5) {
    const response = await fetch("https://marcconrad.com/uob/banana/api.php");
    const data = await response.json();
    number = data;
    tries++;
  }

  if (number < 3 || number > 10) {
    number = Math.floor(Math.random() * 6) + 3;
  }

  console.log("Word length from API:", number);
  return number;
}

// Get word of given length
async function getWordFromDictionaryAPI(length) {
  try {
    const response = await fetch("https://random-words-api.kushcreates.com/api?language=en&type=lowercase&words=1");
    const data = await response.json();
    let word = data[0].word;
    console.log(word);

    // retry until a word roughly matches the Banana API length
    if (Math.abs(word.length - length) > 2) {
      return await getWordFromDictionaryAPI(length);
    }

    console.log(`Word fetched (${word.length} letters):`, word);
    return word;
  } catch (error) {
    console.error(" Dictionary API error:", error);
    return "apple";
  }
}

// Shuffle letters
function shuffleWord(word) {
  return word.split("").sort(() => Math.random() - 0.5).join("");
}

// Start timer for 30 seconds
function startTimer() {
  clearInterval(timer);
  timeLeft = 30;
  document.getElementById("timer").innerText = `Time: ${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleWrongAnswer("⏰ Time's up!");
    }
  }, 1000);
}

// Load new word
async function newWord() {
  document.getElementById("scrambled-word").innerText = "Loading...";
  document.getElementById("result").innerText = "";
  document.getElementById("user-input").value = "";

  try {
    const length = await getNumberFromBananaAPI();
    const word = await getWordFromDictionaryAPI(length);
    const scrambled = shuffleWord(word);
    currentWord = word;
    document.getElementById("scrambled-word").innerText = scrambled;
    startTimer();
  } catch (error) {
    console.error(error);
    document.getElementById("scrambled-word").innerText = "Error loading word!";
  }
}

// Handle wrong answer
function handleWrongAnswer(message) {
  document.getElementById("result").innerText = message;
  wrongCount++;
  updateLivesAndSkips();
  clearInterval(timer);

  if (wrongCount >= maxLives) {
    setTimeout(endGame, 1500);
  } else {
    setTimeout(newWord, 1500);
  }
}

// Update lives and skips on screen
function updateLivesAndSkips() {
  document.getElementById("lives").innerText = `❤ Lives Left: ${maxLives - wrongCount}`;
  document.getElementById("skips").innerText = `⏭ Skips Left: ${skipUsed ? 0 : maxSkips}`;
}

// ====== BUTTON EVENTS ======
document.getElementById("check-btn").addEventListener("click", () => {
  const userInput = document.getElementById("user-input").value.trim().toLowerCase();

  if (userInput === currentWord) {
    document.getElementById("result").innerText = "✅ Correct!";
    score++;
    clearInterval(timer);
    setTimeout(newWord, 1500);
  } else {
   handleWrongAnswer(`❌ Wrong! It was "${currentWord}"`);
  }

  document.getElementById("score").innerText = score;
  localStorage.setItem("latestScore", score);
});

// Skip button
document.getElementById("skip-btn").addEventListener("click", () => {
  if (!skipUsed) {
    skipUsed = true;
    clearInterval(timer);
    document.getElementById("result").innerText = "⏭️ You skipped this word!";
    updateLivesAndSkips();
    setTimeout(newWord, 1500);
  } else {
    document.getElementById("result").innerText = "⚠️ You already used your skip!";
  }
});

// Start game
startBtn.addEventListener("click", () => {
  score = 0;
  wrongCount = 0;
  skipUsed = false;
  document.getElementById("score").innerText = score;
  updateLivesAndSkips();
  showPage(gamePage);
  newWord();
});

// End game
function endGame() {
  clearInterval(timer);
  document.getElementById("final-score").innerText = score;
  showPage(endPage);
}

// Restart
restartBtn.addEventListener("click", () => {
  showPage(homePage);
});