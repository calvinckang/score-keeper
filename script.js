const scoreA = document.getElementById('score-a');
const scoreB = document.getElementById('score-b');
const STORAGE_KEY = 'scoreKeeper';

function saveScores() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scoreA: parseInt(scoreA.textContent),
        scoreB: parseInt(scoreB.textContent)
    }));
}

function loadScores() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const { scoreA: a, scoreB: b } = JSON.parse(saved);
        scoreA.textContent = a;
        scoreB.textContent = b;
    }
}

loadScores();

document.getElementById('increment-a').addEventListener('click', () => {
    scoreA.textContent = parseInt(scoreA.textContent) + 1;
    saveScores();
});
document.getElementById('decrement-a').addEventListener('click', () => {
    const current = parseInt(scoreA.textContent);
    if (current > 0) {
        scoreA.textContent = current - 1;
        saveScores();
    }
});
document.getElementById('increment-b').addEventListener('click', () => {
    scoreB.textContent = parseInt(scoreB.textContent) + 1;
    saveScores();
});
document.getElementById('decrement-b').addEventListener('click', () => {
    const current = parseInt(scoreB.textContent);
    if (current > 0) {
        scoreB.textContent = current - 1;
        saveScores();
    }
});
