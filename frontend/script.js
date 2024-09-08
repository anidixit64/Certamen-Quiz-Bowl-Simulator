document.addEventListener('DOMContentLoaded', () => {
    const questionElement = document.getElementById('question-text');
    const nextButton = document.getElementById('next-btn');
    const pauseButton = document.getElementById('pause-btn');
    const answerContainer = document.getElementById('answer-container');
    const answerText = document.getElementById('answer-text');
    const backBtn = document.getElementById('back-btn');

    let words = [];
    let interval;
    let isPaused = false;
    let isReading = false;
    let currentIndex = 0;
    let answerSanitized = ''; // Define answerSanitized

    fetchQuestion();

    nextButton.addEventListener('click', () => {
        clearInterval(interval);
        isPaused = false; // Ensure pause is reset
        pauseButton.textContent = 'Pause'; // Update pause button text
        fetchQuestion();
    });

    pauseButton.addEventListener('click', togglePause);
    backBtn.addEventListener('click', () => window.location.href = '/');

    function fetchQuestion() {
        clearInterval(interval);
        fetch('/api/question')
            .then(response => response.json())
            .then(data => {
                let question = data.question.replace(/\(\*\)/g, '');
                answerSanitized = data.answer; // Assign the answer from the response
                words = question.split(/(\s+)/);
                currentIndex = 0;
                questionElement.innerHTML = '';
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
        isReading = true; // Mark reading as in progress
    }

    function togglePause() {
        if (isReading) {
            isPaused = !isPaused;
            pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
            if (!isPaused) displayWords(); // Resume displaying words
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            if (isReading) {
                isPaused = !isPaused; // Toggle pause state
                answerText.textContent = answerSanitized; // Update answer text
                answerContainer.style.display = 'block'; // Show the answer
            }
        } else if (event.code === 'ArrowRight') {
            event.preventDefault();
            nextButton.click(); // Trigger the "Next Question" button click
        }
    });
});
