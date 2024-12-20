document.addEventListener('DOMContentLoaded', () => {
    const questionElement = document.getElementById('question-text');
    const nextButton = document.getElementById('next-btn');
    const pauseButton = document.getElementById('pause-btn');
    const answerContainer = document.getElementById('answer-container');
    const answerText = document.getElementById('answer-text');
    const backBtn = document.getElementById('back-btn');
    const answerInputContainer = document.getElementById('answer-input-container');
    const answerInput = document.getElementById('answer-input');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');

    let words = [];
    let interval;
    let isPaused = false;
    let isReading = false;
    let currentIndex = 0;
    let correctAnswer = ''; // Store the correct answer for comparison

    fetchQuestion();

    nextButton.addEventListener('click', () => {
        clearInterval(interval);
        isPaused = false;
        pauseButton.textContent = 'Pause';
        fetchQuestion();
    });

    pauseButton.addEventListener('click', togglePause);
    backBtn.addEventListener('click', () => window.location.href = '/');
    submitAnswerBtn.addEventListener('click', checkAnswer);

    function fetchQuestion() {
        clearInterval(interval);
        fetch('/api/question')
            .then(response => response.json())
            .then(data => {
                let question = data.question.replace(/\(\*\)/g, '');
                correctAnswer = data.answer; // Store the correct answer
                words = question.split(/(\s+)/);
                currentIndex = 0;
                questionElement.innerHTML = '';
                answerInputContainer.style.display = 'none';
                answerContainer.style.display = 'none';
                answerInput.value = ''; // Reset the input field
                displayWords();
            })
            .catch(error => console.error('Error fetching question:', error));
    }

    function displayWords() {
        clearInterval(interval);
        interval = setInterval(() => {
            if (!isPaused && currentIndex < words.length) {
                questionElement.innerHTML += words[currentIndex++];
            } else {
                clearInterval(interval);
                isReading = false;
            }
        }, 50);
        isReading = true;
    }

    function togglePause() {
        if (isReading) {
            isPaused = !isPaused;
            pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
            if (!isPaused) displayWords();
        }
    }

    function checkAnswer() {
        const userAnswer = answerInput.value.trim();
        if (userAnswer === correctAnswer) {
            answerText.textContent = 'Correct!';
            answerText.style.color = 'green';
            answerContainer.style.display = 'block'; // Show the correct message

            // Hide the message and fetch the next question after 0.35 seconds
            setTimeout(() => {
                answerContainer.style.display = 'none'; // Hide the message
                fetchQuestion(); // Fetch the next question
            }, 350); // 350 milliseconds delay
        } else {
            answerText.textContent = 'Incorrect. Try again!';
            answerText.style.color = 'red';
            answerInputContainer.style.display = 'none'; // Hide the input bar
            answerInput.value = ''; // Reset the input field

            // Show the incorrect message and then hide it after 0.35 seconds
            answerContainer.style.display = 'block'; // Show the answer feedback
            setTimeout(() => {
                answerContainer.style.display = 'none'; // Hide the answer feedback
                // Resume reading
                isPaused = false;
                pauseButton.textContent = 'Pause';
                displayWords();
            }, 350); // 350 milliseconds delay
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            // Show the input field and stop reading if the question is currently being read
            if (isReading) {
                isPaused = true;
                pauseButton.textContent = 'Resume';
                answerInputContainer.style.display = 'block'; // Show input field
                answerInput.focus(); // Focus on the input field
            } else {
                // If the question is not being read, still show the input field
                answerInputContainer.style.display = 'block'; // Show input field
                answerInput.focus(); // Focus on the input field
            }
        } else if (event.code === 'ArrowRight') {
            event.preventDefault();
            // Only trigger the next question functionality if the input field is not focused
            if (document.activeElement !== answerInput) {
                nextButton.click();
            } else {
                // Move cursor within the answer input field
                const cursorPosition = answerInput.selectionStart;
                answerInput.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
            }
        } else if (event.code === 'Enter') {
            // Only trigger checkAnswer if the input field is focused
            if (document.activeElement === answerInput) {
                event.preventDefault();
                checkAnswer(); // Call the checkAnswer function when Enter is pressed
            }
        } else {
            // Allow all other keyboard symbols in the input field
            if (document.activeElement === answerInput) {
                return;
            }
        }
    });
});