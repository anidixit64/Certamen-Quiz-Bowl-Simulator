document.addEventListener('DOMContentLoaded', () => {
    const questionElement = document.getElementById('question');
    const nextButton = document.getElementById('next-btn');

    // Fetch and display a random question on page load
    fetchQuestion();

    // Fetch and display a new question when "Next Question" button is clicked
    nextButton.addEventListener('click', fetchQuestion);

    function fetchQuestion() {
        fetch('http://127.0.0.1:5000/api/question')  // Make sure the backend is running
            .then(response => response.json())
            .then(data => {
                questionElement.textContent = data.question;
            })
            .catch(error => console.error('Error fetching question:', error));
    }
});
