# Quiz Bowl Application - Certamen

## Overview
The **Quiz Bowl Application - Certamen** is a **full-stack web application** designed for interactive Quiz Bowl competitions. It features a **Flask** backend, a **JavaScript-powered** frontend, and a robust **RESTful API** for serving and managing quiz questions. The project is built to enhance quiz-based learning by delivering questions dynamically and validating user answers in real-time.

## Project Goals
- Develop a **scalable full-stack application** for Quiz Bowl competitions.
- Implement a **RESTful API** to efficiently manage a dataset of **156,888 questions**.
- Ensure a **smooth user experience** with a dynamic **JavaScript frontend** and real-time **question validation**.
- Utilize **Flask** for the backend, serving quiz questions and handling logic.
- Enhance answer validation with **Levenshtein distance matching**.
- Provide an intuitive **UI/UX** with **progressive question rendering**.

---

## Tech Stack
| Layer         | Technologies Used |
|--------------|-----------------|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend**  | Flask (Python) |
| **Database** | JSON-based dataset (156,888 questions) |
| **Styling**  | CSS with Google Fonts (Merriweather) |
| **API**      | RESTful API with Flask routes |

---

## Project Structure
```
quizbowl/
├── backend/
│   ├── app.py              # Flask application (API & routes)
│   ├── requirements.txt    # Python dependencies
│   ├── data/
│   │   ├── tossups_1.json  # Quiz questions dataset
│   │   ├── ...             # Additional JSON files
├── frontend/
│   ├── index.html          # Main UI for questions
│   ├── welcome.html        # Welcome screen
│   ├── style.css           # Styling for UI elements
│   ├── script.js           # Core logic for fetching and displaying questions
│   ├── utility.js          # Answer validation utilities (Levenshtein distance)
│
└── README.md               # Project documentation
```

---

## Installation & Setup

### Prerequisites
Ensure you have the following installed:
- **Python (3.x)**
- **pip**
- **Node.js (for frontend development)**

### 1. Clone the Repository
```sh
git clone https://github.com/yourusername/quizbowl.git
cd quizbowl
```

### 2. Install Backend Dependencies
```sh
cd backend
pip install -r requirements.txt
```

### 3. Run the Flask Server
```sh
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```
This starts the server at `http://127.0.0.1:5000/`.

### 4. Serve the Frontend
Simply open `frontend/index.html` in a browser or use:
```sh
python -m http.server 8080
```
Then, visit `http://localhost:8080/`.

---

## API Endpoints
| Method | Endpoint | Description |
|--------|---------|-------------|
| **GET** | `/api/question` | Fetch a random Quiz Bowl question |
| **GET** | `/api` | View API details |

Example API Response:
```json
{
  "question": "Who wrote *1984*?",
  "answer": "George Orwell",
  "original": "Orwell, George"
}
```

---

## Features
### Backend (Flask API)
- Loads **156,888 questions** from multiple JSON files.
- Provides **randomized question delivery** via `/api/question`.
- Implements **error handling** for missing or malformed datasets.

### Frontend (JavaScript, HTML, CSS)
- Dynamically fetches questions from the API.
- Displays questions **word-by-word** for a suspenseful effect.
- Allows **real-time answer input**.
- Validates answers using **Levenshtein distance matching**.
- Implements **spacebar-triggered timers** and **auto-answer submission**.

---

## How It Works
### 1. **Fetching Questions**
- The frontend fetches a random question via `/api/question`.
- The response is processed and displayed word-by-word.

### 2. **Answer Validation**
- The user submits an answer.
- The answer is normalized using **text sanitization** (`normalizeText` in `utility.js`).
- The Levenshtein distance function (`levenshtein()`) determines if the answer is **approximately correct**.

### 3. **Scoring & UI Effects**
- Correct answers trigger a **green success message**.
- Incorrect answers display a **red error message**.
- A countdown timer enforces **quick thinking**.

---

## Expected Outcomes
- **Faster response times** (~50ms per request) due to optimized API handling.
- **Improved engagement** with progressive word-by-word question display.
- **Higher answer accuracy** using **fuzzy matching (Levenshtein distance)**.
- **Enhanced user experience** with keyboard shortcuts and visual timers.

---

## Future Enhancements
- **Leaderboards**: Track player scores over multiple rounds.
- **Question Categorization**: Allow filtering by difficulty and topic.
- **Multiplayer Mode**: Implement live Quiz Bowl sessions.
- **Database Migration**: Move from JSON to PostgreSQL for better scalability.

---

## Contributors
- **Your Name** - Developer
- **Other Contributors** - Feel free to add contributors

---

## License
This project is licensed under the **MIT License**.
