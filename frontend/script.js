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
        } else {
            answerText.textContent = 'Incorrect. Try again!';
            answerText.style.color = 'red';
        }
        answerContainer.style.display = 'block';
    }

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            if (isReading) {
                isPaused = true;
                pauseButton.textContent = 'Resume';
                answerInputContainer.style.display = 'block'; // Show input field
                answerInput.focus(); // Focus on the input field
                answerContainer.style.display = 'none'; // Hide answer container
            }
        } else if (event.code === 'ArrowRight') {
            event.preventDefault();
            nextButton.click();
        }
    });
});
