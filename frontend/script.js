let intervalId; // Variable to store the interval for word display
let isReading = true; // Flag to track whether the question is currently being read
let index = 0; // To track the current word being displayed
let words = []; // Array to hold the words of the current question
let currentAnswer = ''; // Variable to store the current answer
const questionElement = document.getElementById('question-text'); // Reference to the question text element
const nextButton = document.getElementById('next-btn');
const nextBtnContainer = document.getElementById('next-btn-container');
const answerContainer = document.getElementById('answer-container');
const answerInput = document.getElementById('answer-input');

// Fetch a random question on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchQuestion();
});

// Fetch question function
function fetchQuestion() {
    // Reset state for new question
    clearInterval(intervalId); // Clear any ongoing interval
    isReading = true; // Reset to reading state
    index = 0; // Reset word index
    questionElement.innerHTML = ''; // Clear previous question content
    answerContainer.style.display = 'none'; // Hide answer input field
    nextBtnContainer.style.display = 'block'; // Show Next Question button

    // Clear the answer input field
    answerInput.value = ''; 

    fetch('/api/question')
        .then(response => response.json())
        .then(data => {
            const questionText = data.question;
            currentAnswer = data.answer; // Store the current answer
            const match = data.original.match(/<b><u>(.*?)<\/u><\/b>/);
            specificAnswer = match ? match[1] : ''; // Assign the matched part or an empty string if no match found
            words = questionText.split(' '); // Split question into words
            displayQuestionWordByWord(); // Start displaying the question word by word
        })
        .catch(error => console.error('Error fetching question:', error));
}

// Display question word by word with no shifting
function displayQuestionWordByWord() {
    // Start displaying words from the current index
    intervalId = setInterval(() => {
        if (index < words.length) {
            questionElement.innerHTML += words[index] + ' '; // Add each word with space
            index++;
        } else {
            clearInterval(intervalId); // Stop the interval when all words are shown
        }
    }, 150); // 150 milliseconds delay between each word
}

// Fetch a new question when the "Next Question" button is clicked
nextButton.addEventListener('click', fetchQuestion);

document.addEventListener('keydown', (event) => {
    if (event.key === ' ') { // Spacebar pressed
        if (isReading) {
            // Pause the question and show input field for the answer
            clearInterval(intervalId); // Stop the word-by-word display
            answerContainer.style.display = 'block'; // Show input field
            nextBtnContainer.style.display = 'none'; // Hide Next Question button
            answerInput.focus(); // Focus on the input field
            answerInput.value = ''; // Clear the input field each time spacebar is pressed
            isReading = false; // Set to paused state
        }
        // If the question is already paused, do nothing
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { // Enter key pressed
        if (isReading) {
            // Load a new question when the question is being read
            fetchQuestion(); // Move to the next question
        } else {
            // Submit the user's answer
            const userGuess = answerInput.value.trim();
            console.log('User guessed: ', userGuess);

            // Check if the user's guess matches the answer
            if (userGuess.toLowerCase() === currentAnswer.toLowerCase() || userGuess.toLowerCase() === specificAnswer.toLowerCase()) {
                // Show the "Correct!" message and hide the "Next Question" button
                answerContainer.style.display = 'none'; // Hide the Next Question button
                
                const correctMessage = document.createElement('p'); // Create a new paragraph element
                correctMessage.textContent = 'Correct!'; // Set the text to "Correct!"
                correctMessage.style.color = 'green'; // Set the color to green
                correctMessage.style.fontSize = '1.5rem'; // Set font size to match button size
                correctMessage.style.fontWeight = 'bold'; // Make it bold
                nextBtnContainer.parentElement.appendChild(correctMessage); // Append the message below the container
                
                setTimeout(() => {
                    correctMessage.remove(); // Remove the "Correct!" message after 5 seconds
                    fetchQuestion(); // Fetch the next question after a short delay
                }, 750); // 5-second delay before fetching the next question
            } else {
                // Show the "Correct!" message and hide the "Next Question" button
                answerContainer.style.display = 'none'; // Hide the Next Question button
                
                const correctMessage = document.createElement('p'); // Create a new paragraph element
                correctMessage.textContent = 'Incorrect!'; // Set the text to "Correct!"
                correctMessage.style.color = 'red'; // Set the color to green
                correctMessage.style.fontSize = '1.5rem'; // Set font size to match button size
                correctMessage.style.fontWeight = 'bold'; // Make it bold
                nextBtnContainer.parentElement.appendChild(correctMessage); // Append the message below the container
                
                setTimeout(() => {
                    correctMessage.remove(); // Remove the "Correct!" message after 5 seconds
                    // Clear the answer input field before hiding it
                    answerInput.value = '';

                    // Resume the question reading and hide input field
                    isReading = true;
                    answerContainer.style.display = 'none'; // Hide answer input field
                    nextBtnContainer.style.display = 'block'; // Show Next Question button
                    displayQuestionWordByWord(); // Resume reading the question
                }, 750); // 5-second delay before fetching the next question
            }
        }
    }
});

// Navigate back to the welcome page
document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = '/';  // Navigate to the welcome page
});