from flask import Flask, jsonify, request, send_from_directory
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn
import os
import json
import random
import threading

# Create Flask and FastAPI instances
flask_app = Flask(__name__, static_folder='../frontend', static_url_path='/')
fastapi_app = FastAPI()

# Load all questions from JSON files in the data directory
questions = []
data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')

for filename in os.listdir(data_dir):
    if filename.endswith('.json'):
        try:
            with open(os.path.join(data_dir, filename), encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):  # Ensure it's a list before extending
                    questions.extend(data)
                else:
                    print(f"⚠️ Warning: {filename} does not contain a list of questions.")
        except json.JSONDecodeError as e:
            print(f"❌ Error decoding {filename}: {e}")
        except FileNotFoundError as e:
            print(f"❌ File not found: {filename} - {e}")
        except Exception as e:
            print(f"❌ Unexpected error loading {filename}: {e}")

print(f"✅ {len(questions)} questions loaded from the data directory.")



@flask_app.route('/api/question', methods=['GET'])
def get_random_question():
    if not questions:
        return jsonify({"error": "No questions available"}), 500

    question = random.choice(questions)

    if "question_sanitized" not in question or "answer_sanitized" not in question:
        return jsonify({"error": "Invalid question format"}), 500

    return jsonify({
        "question": question.get('question_sanitized', 'Question not found'),
        "answer": question.get('answer_sanitized', 'Answer not found'),
        "original": question.get('answer', 'Original answer not found')
    })


@fastapi_app.get("/api/question")
def get_random_question_fastapi():
    if not questions:
        return JSONResponse(content={"error": "No questions available"}, status_code=500)

    question = random.choice(questions)

    if "question_sanitized" not in question or "answer_sanitized" not in question:
        return JSONResponse(content={"error": "Invalid question format"}, status_code=500)

    return {
        "question": question.get('question_sanitized', 'Question not found'),
        "answer": question.get('answer_sanitized', 'Answer not found'),
        "original": question.get('answer', 'Original answer not found')
        "subcategory": question.get('subcategory', 'Subcategory not found'),
        "category": question.get('category', 'Category not found'),
        "tournament": question.get('tournament', 'Tournament answer not found')
    }

@flask_app.route('/')
def serve_welcome():
    # Serve the welcome page
    return send_from_directory('../frontend', 'welcome.html')

@flask_app.route('/questions')
def serve_questions():
    # Serve the main question page when accessing /questions
    return send_from_directory('../frontend', 'index.html')

@flask_app.route('/api', methods=['GET'])
def api_info():
    return jsonify({
        "endpoints": {
            "/api/question": "Get a random sanitized question"
        }
    })

@fastapi_app.get("/api/fastapi_test")
def fastapi_test():
    return {"message": "FastAPI is working alongside Flask!"}

def run_flask():
    debug_mode = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    flask_app.run(debug=debug_mode, port=5000, use_reloader=False)

def run_fastapi():
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8000)

if __name__ == '__main__':
    flask_thread = threading.Thread(target=run_flask)
    fastapi_thread = threading.Thread(target=run_fastapi)

    flask_thread.start()
    fastapi_thread.start()

    flask_thread.join()
    fastapi_thread.join()

