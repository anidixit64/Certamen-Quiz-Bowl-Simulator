let intervalId; // Variable to store the interval for word display
let isReading = true; // Flag to track whether the question is currently being read
let index = 0; // To track the current word being displayed
let words = []; // Array to hold the words of the current question
let currentAnswer = ''; // Variable to store the current answer
let specificAnswer = ''; // Variable to store the specific part of the answer
let timer; // Variable to hold the timeout for the 10-second timer
const questionElement = document.getElementById('question-text'); // Reference to the question text element
const nextButton = document.getElementById('next-btn');
const nextBtnContainer = document.getElementById('next-btn-container');
const answerContainer = document.getElementById('answer-container');
const answerInput = document.getElementById('answer-input');

// Fetch a random question on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchQuestion();
});

// Function to normalize text by removing punctuation, converting to lowercase, and trimming
function normalizeText(text) {
    return text
        .replace(/[\[\](){}<>]/g, '') // Remove brackets and their content
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove other punctuation
        .toLowerCase()
        .trim();
}

// Function to calculate Levenshtein Distance
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

// Function to check if two strings are approximately equal
function isApproximatelyEqual(input, answer) {
    const normalizedInput = normalizeText(input);
    const normalizedAnswer = normalizeText(answer);
    const distance = levenshtein(normalizedInput, normalizedAnswer);
    return distance <= Math.max(normalizedAnswer.length * 0.3, 2); // Allow up to 30% difference or a minimum of 2 characters
}

// Fetch question function
function fetchQuestion() {
    // Reset state for new question
    clearInterval(intervalId); // Clear any ongoing interval
    clearTimeout(timer); // Clear any ongoing timer
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
            currentAnswer = data.answer.replace(/\[.*?\]/g, ''); // Remove content in brackets
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
            startTimer(); // Start the 10-second timer
        }
    }, 150); // 150 milliseconds delay between each word
}

// Start a 10-second timer after the question is fully read
function startTimer() {
    timer = setTimeout(() => {
        nextBtnContainer.style.display = 'none';

        // Display the correct answer after 10 seconds
        const correctMessage = document.createElement('p'); // Create a new paragraph element
        correctMessage.textContent = `${currentAnswer}`; // Set the text
        correctMessage.style.color = 'yellow'; // Set the color
        correctMessage.style.fontSize = '1.5rem'; // Set font size
        correctMessage.style.fontWeight = 'bold'; // Make it bold
        nextBtnContainer.parentElement.appendChild(correctMessage); // Append the message

        setTimeout(() => {
            correctMessage.remove(); // Remove the message after 5 seconds
            fetchQuestion(); // Fetch the next question
        }, 1100);
    }, 10000); // 10-second delay
}

// Fetch a new question when the "Next Question" button is clicked
nextButton.addEventListener('click', fetchQuestion);

document.addEventListener('keydown', (event) => {
    if (event.key === ' ') { // Spacebar pressed
        if (isReading) {
            // Pause the question and show input field for the answer
            clearInterval(intervalId); // Stop the word-by-word display
            clearTimeout(timer); // Stop the 10-second timer
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
            if (
                isApproximatelyEqual(userGuess, currentAnswer) ||
                isApproximatelyEqual(userGuess, specificAnswer)
            ) {
                // Show the "Correct!" message
                answerContainer.style.display = 'none';

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
                // Show the "Incorrect!" message
                answerContainer.style.display = 'none';

                const incorrectMessage = document.createElement('p'); // Create a new paragraph element
                incorrectMessage.textContent = 'Incorrect!'; // Set the text to "Incorrect!"
                incorrectMessage.style.color = 'red'; // Set the color to red
                incorrectMessage.style.fontSize = '1.5rem'; // Set font size to match button size
                incorrectMessage.style.fontWeight = 'bold'; // Make it bold
                nextBtnContainer.parentElement.appendChild(incorrectMessage); // Append the message below the container

                setTimeout(() => {
                    incorrectMessage.remove(); // Remove the "Incorrect!" message after 5 seconds
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
