// script.js
// Make card flip sound globally accessible
const cardFlipSound = new Audio('card-sounds-35956 (1).mp3');

document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("get-started");
    const levelSelect = document.getElementById("level-select");
    const movesDisplay = document.getElementById('moves');
    let moves = 0;

    // Initialize music with default volume
    const defaultVolume = 0.5; // 50%
    let currentVolume = sessionStorage.getItem('musicVolume') || defaultVolume;
    
    // Create background music
    const backgroundMusic = new Audio('game-music-loop-7-145285.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = currentVolume;

    // Function to update music volume
    function updateMusicVolume(volume) {
        currentVolume = volume;
        backgroundMusic.volume = volume;
        sessionStorage.setItem('musicVolume', volume);
    }

    // Set up volume slider
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
        // Set initial slider value
        volumeSlider.value = currentVolume * 100;
        
        volumeSlider.addEventListener('input', (e) => {
            const newVolume = e.target.value / 100;
            updateMusicVolume(newVolume);
        });
    }

    // Play music on both homepage and game page
    if (startButton) {
        // On homepage
        const welcomeModal = document.getElementById('welcome-modal');
        const welcomeStartBtn = document.getElementById('welcome-start-btn');
        
        // Always try to play music on homepage
        const playHomepageMusic = () => {
            if (backgroundMusic.paused) {
                backgroundMusic.play().catch(e => console.log('Music play failed:', e));
            }
        };

        if (welcomeStartBtn) {
            welcomeStartBtn.onclick = () => {
                welcomeModal.style.display = 'none';
                playHomepageMusic();
                sessionStorage.setItem('welcomeShown', 'true');
            };
        } else {
            // If no welcome modal, play music directly
            playHomepageMusic();
        }

        // Try to play music after a short delay (helps with browser autoplay policies)
        setTimeout(playHomepageMusic, 1000);
    } else if (window.location.pathname.includes('game.html')) {
        // On game page, play music immediately
        backgroundMusic.play().catch(e => console.log('Music play failed:', e));
    }

    if (startButton && levelSelect) {
        startButton.addEventListener("click", () => {
            localStorage.setItem('level', levelSelect.value);
            // Keep music playing when transitioning to game
            sessionStorage.setItem('keepMusicPlaying', 'true');
            window.location.href = "game.html";
        });
    }

    // Rules modal
    const rulesModal = document.getElementById("rules-modal");
    const rulesOkBtn = document.getElementById("rules-ok-btn");
    if (rulesModal && rulesOkBtn) {
        rulesModal.style.display = 'flex';
        rulesOkBtn.addEventListener("click", () => {
            rulesModal.style.display = 'none';
        });
    }
});

// Settings card functionality
const settingsIcon = document.querySelector('.settings i.fa-cog');
const settingsCard = document.querySelector('.settings-card');
const closeSettings = document.querySelector('.close-settings');

settingsIcon.addEventListener('click', () => {
    settingsCard.classList.toggle('active');
});

closeSettings.addEventListener('click', () => {
    settingsCard.classList.remove('active');
});

// Close settings when clicking outside
document.addEventListener('click', (e) => {
    if (!settingsCard.contains(e.target) && !settingsIcon.contains(e.target)) {
        settingsCard.classList.remove('active');
    }
});

// --- Memory Game Logic ---
let totalCards = 30;
let cards = [];
let flippedCards = [];
let matched = [];
let score = 0;
let canFlip = true;

const cardGrid = document.querySelector('.card-grid');
const scoreDisplay = document.getElementById('score');
const movesDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
let timer = 0;
let timerInterval = null;

function getLevelConfig() {
    const level = localStorage.getItem('level') || 'hard';
    if (level === 'easy') return { pairs: 6, total: 12 };
    if (level === 'medium') return { pairs: 10, total: 20 };
    return { pairs: 15, total: 30 };
}

function getCardImages() {
    const customImages = [
        'Screenshot 2025-05-30 190027.png',
        'Screenshot 2025-05-30 175336.png',
        'Screenshot 2025-05-30 175451.png',
        'Screenshot 2025-05-30 175720.png',
        'Screenshot 2025-05-30 190613.png',
        'Screenshot 2025-05-30 180636.png',
        'Screenshot 2025-05-30 181142.png',
        'Screenshot 2025-05-30 181318.png',
        'Screenshot 2025-05-30 181507.png',
        'Screenshot 2025-05-30 181818.png',
        'Screenshot 2025-05-30 181928.png',
        'Screenshot 2025-05-30 182038.png',
        'Screenshot 2025-05-30 190136.png',
        'Screenshot 2025-05-30 190316.png',
        'Screenshot 2025-05-30 190404.png',
    ];
    const { pairs } = getLevelConfig();
    return customImages.slice(0, pairs);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createCard(index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    
    const frontImage = cards[index];
    const backImage = 'Screenshot 2025-05-30 185722.png';
    
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front" style="background-image: url('${frontImage}')"></div>
            <div class="card-back" style="background-image: url('${backImage}')"></div>
        </div>
    `;

    card.onclick = function() {
        // Prevent flipping if not allowed, already flipped, or already matched
        if (!canFlip || this.classList.contains('flipped') || matched[index]) {
            return;
        }
        // Play card flip sound
        if (typeof cardFlipSound !== 'undefined' && cardFlipSound) {
            cardFlipSound.currentTime = 0;
            cardFlipSound.play();
        }
        // Flip the card
        this.classList.add('flipped');
        // Increment moves counter only when a card is actually flipped
        if (movesDisplay) {
            moves++;
            movesDisplay.textContent = moves;
        }
        flippedCards.push({ card: this, index });
        // If this is the second card
        if (flippedCards.length === 2) {
            canFlip = false;
            const [first, second] = flippedCards;
            // Check if cards match
            if (cards[first.index] === cards[second.index]) {
                // Match found
                matched[first.index] = true;
                matched[second.index] = true;
                score++;
                if (scoreDisplay) scoreDisplay.textContent = score;
                // Hide matched cards after a short delay
                setTimeout(() => {
                    first.card.style.visibility = 'hidden';
                    second.card.style.visibility = 'hidden';
                    flippedCards = [];
                    canFlip = true;
                    // Check if game is complete
                    if (score === totalCards / 2) {
                        showFinishModal();
                    }
                }, 500);
            } else {
                // No match - flip cards back after a delay
                setTimeout(() => {
                    first.card.classList.remove('flipped');
                    second.card.classList.remove('flipped');
                    flippedCards = [];
                    canFlip = true;
                }, 1000);
            }
        }
    };
    return card;
}

function renderGrid() {
    const columns = 10;
    const rows = 3;
    cardGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    cardGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    cardGrid.innerHTML = '';

    const level = localStorage.getItem('level') || 'hard';
    if (level === 'easy') {
        let cardIndex = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                if (col < 2 || col > 7) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'card-placeholder';
                    cardGrid.appendChild(placeholder);
                } else if (cardIndex < totalCards) {
                    cardGrid.appendChild(createCard(cardIndex));
                    cardIndex++;
                }
            }
        }
    } else {
        for (let i = 0; i < totalCards; i++) {
            cardGrid.appendChild(createCard(i));
        }
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timer = 0;
    if (timerDisplay) timerDisplay.textContent = timer + 's';
    timerInterval = setInterval(() => {
        timer++;
        if (timerDisplay) timerDisplay.textContent = timer + 's';
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function resetGame() {
    const { total } = getLevelConfig();
    totalCards = total;
    cards = getCardImages();
    cards = [...cards, ...cards];
    shuffle(cards);
    flippedCards = [];
    matched = Array(totalCards).fill(false);
    score = 0;
    canFlip = true;
    if (scoreDisplay) scoreDisplay.textContent = score;
    if (movesDisplay) moves = 0, movesDisplay.textContent = moves;
    if (timerDisplay) timerDisplay.textContent = '0s';
    renderGrid();
    startTimer();
}

function showFinishModal() {
    stopTimer();
    const modal = document.createElement('div');
    modal.className = 'game-finish-modal';
    modal.innerHTML = `
        <h2>Congratulations!<br>You matched all cards!</h2>
        <div class="game-finish-actions">
            <button class="game-finish-btn" id="finish-restart">Restart</button>
            <button class="game-finish-btn" id="finish-quit">Quit</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('finish-restart').onclick = () => {
        modal.remove();
        resetGame();
    };
    document.getElementById('finish-quit').onclick = () => {
        window.location.href = 'hompage.html';
    };
}

// Initialize game if on game page
if (cardGrid && scoreDisplay) {
    resetGame();
}

// Settings actions
const quitBtn = document.getElementById('quit-game');
const restartBtn = document.getElementById('restart-game');
if (quitBtn) {
    quitBtn.addEventListener('click', () => {
        // Keep music playing when returning to homepage
        sessionStorage.setItem('keepMusicPlaying', 'true');
        // Small delay to ensure music state is saved
        setTimeout(() => {
            window.location.href = 'hompage.html';
        }, 100);
    });
}
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        resetGame();
        const settingsCard = document.querySelector('.settings-card');
        if (settingsCard) settingsCard.classList.remove('active');
    });
}
  