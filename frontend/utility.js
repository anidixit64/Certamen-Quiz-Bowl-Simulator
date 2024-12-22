function normalizeText(text) {
    return text
        .replace(/[\[\](){}<>]/g, '') // Remove brackets and their content
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove other punctuation
        .toLowerCase()
        .trim();
}

function levenshtein (a, b) {
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

function isApproximatelyEqual(input, answer) {
    const normalizedInput = normalizeText(input);
    const normalizedAnswer = normalizeText(answer);
    const distance = levenshtein(normalizedInput, normalizedAnswer);
    return distance <= Math.max(normalizedAnswer.length * 0.3, 2); // Allow up to 30% difference or a minimum of 2 characters
}

// Export the utility functions for use in other files.
export { normalizeText, levenshtein, isApproximatelyEqual };
