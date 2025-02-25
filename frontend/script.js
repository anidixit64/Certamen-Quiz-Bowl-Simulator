let intervalId; // Variable to store the interval for word display
let isReading = true; // Flag to track whether the question is currently being read
let index = 0; // To track the current word being displayed
let words = []; // Array to hold the words of the current question
let currentAnswer = ''; // Variable to store the correct answer (with parentheses/brackets removed)
let specificAnswer = ''; // Variable to store the specific part of the answer (underlined)
let readingFinished = false; // NEW OR CHANGED ↓: We track when question reading is fully done

// Timers
let questionTimer; // 10-second "post-read" timer
let questionTimerLeft = 10; // NEW OR CHANGED ↓: We'll keep track of leftover time
let questionTimerStarted = false; // NEW OR CHANGED ↓: Did the post-read timer start yet?

let spacebarTimer; // 10-second "buzz-in" timer
let spacebarTimeLeft = 10;

const questionElement = document.getElementById('question-text');
const nextButton = document.getElementById('next-btn');
const nextBtnContainer = document.getElementById('next-btn-container');
const answerContainer = document.getElementById('answer-container');
const answerInput = document.getElementById('answer-input');

// Timer bars
const spacebarTimerContainer = document.getElementById('spacebar-timer-container');
const spacebarTimerProgress = document.getElementById('spacebar-timer-progress');
const questionTimerContainer = document.getElementById('question-timer-container');
const questionTimerProgress = document.getElementById('question-timer-progress');

// =============================================================
// FETCH QUESTION ON PAGE LOAD
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchQuestion();
});

// =============================================================
// FETCH A NEW QUESTION
// =============================================================
function fetchQuestion() {
    // Reset all states for a fresh question
    clearInterval(intervalId);
    clearInterval(questionTimer);
    clearInterval(spacebarTimer);

    questionTimerLeft = 10;      // NEW OR CHANGED ↓
    questionTimerStarted = false; // NEW OR CHANGED ↓
    spacebarTimeLeft = 10;

    readingFinished = false; // NEW OR CHANGED ↓
    isReading = true;
    index = 0;

    // Hide & reset timer visuals
    questionTimerContainer.style.display = 'none';
    questionTimerProgress.style.width = '100%';

    spacebarTimerContainer.style.display = 'none';
    spacebarTimerProgress.style.width = '100%';

    // Hide answer container
    answerContainer.style.display = 'none';
    answerInput.value = '';

    // Clear old question text
    questionElement.innerHTML = 'Loading question...';
    nextBtnContainer.style.display = 'block';

    fetch('/api/question')
        .then(response => response.json())
        .then(data => {
            // Remove parentheses & brackets from answer
            let sanitizedAnswer = data.answer
                .replace(/\[.*?\]/g, '')  // Remove [ ... ]
                .replace(/\(.*?\)/g, ''); // Remove ( ... )
            currentAnswer = sanitizedAnswer;

            // Extract <b><u>... if present
            const match = data.original.match(/<b><u>(.*?)<\/u><\/b>/);
            specificAnswer = match ? match[1] : '';

            // Split question text into words
            words = data.question.split(' ');
            questionElement.innerHTML = '';
            displayQuestionWordByWord();
        })
        .catch(error => console.error('Error fetching question:', error));
}

// =============================================================
// DISPLAY QUESTION WORD-BY-WORD
// =============================================================
function displayQuestionWordByWord() {
    clearInterval(intervalId); // Ensure no previous interval is running before starting a new one

    index = 0; // Reset the word index
    questionElement.innerHTML = ''; // Clear the previous question

    intervalId = setInterval(() => {
        if (index < words.length) {
            questionElement.innerHTML += words[index] + ' ';
            index++;
        } else {
            clearInterval(intervalId); // Stop interval once all words are displayed
            readingFinished = true;
            startPostReadTimer();
        }
    }, 150);
}

// =============================================================
// START THE 10-SECOND "POST-READ" TIMER
// =============================================================
function startPostReadTimer() {
    if (!questionTimerStarted) {
        questionTimerLeft = 10; // Only reset to 10 the first time
        questionTimerStarted = true;
    }

    questionTimerContainer.style.display = 'block';
    questionTimerProgress.style.width = `${(questionTimerLeft / 10) * 100}%`;

    questionTimer = setInterval(() => {
        questionTimerLeft--;
        questionTimerProgress.style.width = `${(questionTimerLeft / 10) * 100}%`;

        if (questionTimerLeft <= 0) {
            clearInterval(questionTimer);
            questionTimerContainer.style.display = 'none';

            // Time's up => Show correct answer for 5s
            showCorrectAnswerForFiveSeconds();
        }
    }, 1000);
}

// =============================================================
// START THE 10-SECOND "BUZZ-IN" TIMER
// =============================================================
function startSpacebarTimer() {
    spacebarTimeLeft = 10;
    spacebarTimerContainer.style.display = 'block';
    spacebarTimerProgress.style.width = '100%';

    spacebarTimer = setInterval(() => {
        spacebarTimeLeft--;
        spacebarTimerProgress.style.width = `${(spacebarTimeLeft / 10) * 100}%`;

        if (spacebarTimeLeft <= 0) {
            clearInterval(spacebarTimer);
            spacebarTimerContainer.style.display = 'none';
            // Mark as incorrect if time runs out
            submitAnswer('');
        }
    }, 1000);
}

// =============================================================
// LISTEN FOR KEY PRESSES
// =============================================================
document.addEventListener('keydown', (event) => {
    // SPACE => BUZZ IN
    if (event.key === ' ') {
        // If question is reading or just finished, user can buzz in
        if (isReading || readingFinished) {
            // Stop reading (if still going)
            clearInterval(intervalId);

            // Pause the post-read timer (don't reset leftover time!)
            clearInterval(questionTimer);
            questionTimerContainer.style.display = 'none';

            // Show the answer input
            answerContainer.style.display = 'block';
            nextBtnContainer.style.display = 'block';
            answerInput.focus();
            answerInput.value = '';

            // Start the buzz-in timer
            startSpacebarTimer();

            // We are no longer reading
            isReading = false;
        }
    }

    // ENTER => SUBMIT OR NEXT
    if (event.key === 'Enter') {
        // If not reading => the user is submitting an answer
        if (!isReading) {
            clearInterval(spacebarTimer);
            spacebarTimerContainer.style.display = 'none';

            const userGuess = answerInput.value.trim();
            submitAnswer(userGuess);
        } else {
            // If reading => skip to next question
            fetchQuestion();
        }
    }
});

// =============================================================
// NEXT BUTTON => FETCH NEXT QUESTION
// =============================================================
nextButton.addEventListener('click', fetchQuestion);

// =============================================================
// SUBMIT USER ANSWER
// =============================================================
function submitAnswer(userGuess) {
    console.log('User guessed:', userGuess);
    answerContainer.style.display = 'none';

    if (
        isApproximatelyEqual(userGuess, currentAnswer) ||
        isApproximatelyEqual(userGuess, specificAnswer)
    ) {
        // CORRECT
        showTemporaryMessage('Correct!', 'green');
        setTimeout(() => {
            fetchQuestion();
        }, 750);
    } else {
        // INCORRECT
        showTemporaryMessage('Incorrect!', 'red');

        setTimeout(() => {
            // If question reading wasn't finished, resume
            if (!readingFinished) {
                isReading = true;
                intervalId = setInterval(() => {
                    if (index < words.length) {
                        questionElement.innerHTML += words[index] + ' ';
                        index++;
                    } else {
                        clearInterval(intervalId);
                        readingFinished = true;
                        // Resume or start the post-read timer
                        startPostReadTimer();
                    }
                }, 150);
            } else {
                // If reading was finished, resume the leftover post-read time
                if (questionTimerLeft > 0) {
                    startPostReadTimer();
                } else {
                    // If no time left, show correct answer
                    showCorrectAnswerForFiveSeconds();
                }
            }
        }, 750);
    }
}

// =============================================================
// SHOW CORRECT ANSWER FOR 5 SECONDS
// =============================================================
function showCorrectAnswerForFiveSeconds() {
    const correctMessage = document.createElement('p');
    correctMessage.textContent = currentAnswer;
    correctMessage.style.color = 'yellow';
    correctMessage.style.fontSize = '1.5rem';
    correctMessage.style.fontWeight = 'bold';
    nextBtnContainer.parentElement.appendChild(correctMessage);

    // Wait 5 seconds before loading next question
    setTimeout(() => {
        correctMessage.remove();
        fetchQuestion();
    }, 3000);
}

// =============================================================
// HELPER: APPROXIMATELY EQUAL
// =============================================================
function isApproximatelyEqual(input, answer) {
    const normalizedInput = normalizeText(input);
    const normalizedAnswer = normalizeText(answer);
    const distance = levenshtein(normalizedInput, normalizedAnswer);
    return distance <= Math.max(normalizedAnswer.length * 0.3, 2);
}

// =============================================================
// HELPER: NORMALIZE TEXT
// =============================================================
function normalizeText(text) {
    return text
        .replace(/[\[\](){}<>]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .toLowerCase()
        .trim();
}

// =============================================================
// HELPER: LEVENSHTEIN
// =============================================================
function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// =============================================================
// HELPER: SHOW TEMPORARY MESSAGE
// =============================================================
function showTemporaryMessage(text, color) {
    const msg = document.createElement('p');
    msg.textContent = text;
    msg.style.color = color;
    msg.style.fontSize = '1.5rem';
    msg.style.fontWeight = 'bold';
    nextBtnContainer.parentElement.appendChild(msg);

    // Remove after 0.75s
    setTimeout(() => {
        msg.remove();
    }, 750);
}


// Navigate back to the welcome page
document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = '/';  // Navigate to the welcome page
});
