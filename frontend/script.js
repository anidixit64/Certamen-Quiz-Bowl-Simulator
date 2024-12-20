document.addEventListener('DOMContentLoaded', () => {
    const questionElement = document.getElementById('question');
    const nextButton = document.getElementById('next-btn');

    // Fetch and display a random question on page load
    fetchQuestion();

    // Fetch and display a new question when "Next Question" button is clicked
    nextButton.addEventListener('click', fetchQuestion);

    function fetchQuestion() {
        nextButton.disabled = true; // Disable button to prevent multiple clicks
        questionElement.textContent = 'Loading...'; // Show a loading message

        fetch('/api/question')  // Relative URL for compatibility across environments
            .then(response => response.json())
            .then(data => {
                questionElement.textContent = data.question;
            })
            .catch(error => {
                console.error('Error fetching question:', error);
                questionElement.textContent = 'Failed to load question. Please try again.';
            })
            .finally(() => {
                nextButton.disabled = false; // Re-enable button
            });
    }
});

