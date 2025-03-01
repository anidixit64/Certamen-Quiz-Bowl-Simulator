from flask import Flask, jsonify, request, send_from_directory
import os
import json
import random
import psycopg2

app = Flask(__name__, static_folder='../frontend', static_url_path='/')

# Database connection setup
DB_NAME = "certamen"
DB_USER = "aniketdixit"  # Change if your PostgreSQL user is different
DB_PASSWORD = ""  # Add password if needed
DB_HOST = "localhost"

# Function to fetch a random question from the database
def get_random_question():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST
        )
        cur = conn.cursor()
        
        cur.execute("SELECT question, answer, category, subcategory, tournament FROM questions ORDER BY RANDOM() LIMIT 1;")
        result = cur.fetchone()

        cur.close()
        conn.close()

        if result:
            return {
                "question": result[0],
                "answer": result[1],
                "category": result[2],
                "subcategory": result[3],
                "tournament": result[4]
            }
        else:
            return None
    except Exception as e:
        print(f"Database error: {e}")
        return None

# Modify API endpoint to use PostgreSQL instead of JSON
@app.route('/api/question', methods=['GET'])
def fetch_question():
    question = get_random_question()
    if not question:
        return jsonify({"error": "No questions available"}), 500
    return jsonify(question)

@app.route('/api/question', methods=['GET'])
def get_random_question():
    if not questions:
        return jsonify({"error": "No questions available"}), 500
    question = random.choice(questions)
    return jsonify({"question": question['question_sanitized'], "answer": question['answer_sanitized'], "original": question['answer']})

@app.route('/')
def serve_welcome():
    # Serve the welcome page
    return send_from_directory('../frontend', 'welcome.html')

@app.route('/questions')
def serve_questions():
    # Serve the main question page when accessing /questions
    return send_from_directory('../frontend', 'index.html')

@app.route('/api', methods=['GET'])
def api_info():
    return jsonify({
        "endpoints": {
            "/api/question": "Get a random sanitized question"
        }
    })

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(debug=debug_mode)

