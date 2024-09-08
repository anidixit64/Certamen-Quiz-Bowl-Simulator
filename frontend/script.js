document.addEventListener('DOMContentLoaded', () => {
    const questionElement = document.getElementById('question-text');
    const nextButton = document.getElementById('next-btn');
    const pauseButton = document.getElementById('pause-btn');

    let words = [];
    let interval;
    let isReading = false;
    let isPaused = false; // New variable to track pause state
    let currentIndex = 0; // To keep track of the current word index

    fetchQuestion();

    nextButton.addEventListener('click', fetchQuestion);
    pauseButton.addEventListener('click', togglePause); // Add event listener for pause button

    function fetchQuestion() {
        fetch('/api/question')
            .then(response => response.json())
            .then(data => {
                let question = data.question;
                question = question.replace(/\(\*\)/g, ''); // Remove (asterisk) symbols
                words = question.split(/(\s+)/); // Split the question into words, keeping spaces
                currentIndex = 0; // Reset index for new question
                displayWords(); // Start displaying words
            })
            .catch(error => console.error('Error fetching question:', error));
    }

    function displayWords() {
        clearInterval(interval); // Clear any existing intervals
        questionElement.innerHTML = ''; // Clear existing content

        interval = setInterval(() => {
            if (!isPaused) {
                if (currentIndex < words.length) {
                    questionElement.innerHTML += words[currentIndex]; // Append the next word or space
                    currentIndex++;
                } else {
                    clearInterval(interval); // Clear the interval when done
                    isReading = false;
                }
            }
        }, 500); // Display a new word or space every 0.5 seconds
    }

    function togglePause() {
        if (isPaused) {
            // Resume
            isPaused = false;
            pauseButton.textContent = 'Pause';
        } else {
            // Pause
            isPaused = true;
            pauseButton.textContent = 'Resume';
        }
    }

    document.getElementById('next-btn').addEventListener('click', () => {
        clearInterval(interval); // Clear the interval if it's running
        isReading = false; // Mark reading as finished
        fetchQuestion(); // Fetch a new question
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = '/';  // Navigate to the welcome page
    });
});
