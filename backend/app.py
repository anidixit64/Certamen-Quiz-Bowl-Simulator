from flask import Flask, jsonify, request, send_from_directory
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
import json
import random
import threading
import signal
import sys

# Create Flask and FastAPI instances
flask_app = Flask(__name__, static_folder='../frontend', static_url_path='/')
fastapi_app = FastAPI()

# Enable CORS so the frontend can communicate with FastAPI
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from any origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


# Load all questions from JSON files in the data directory
from fastapi import BackgroundTasks

questions = []
data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')

def load_questions():
    global questions
    questions = []  # Reset the list to avoid duplicates

    for filename in os.listdir(data_dir):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(data_dir, filename), encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 FastAPI is starting... Loading questions in the background.")
    load_questions()  # Run it synchronously so that it completes before API calls
    yield  # This ensures FastAPI starts after questions are loaded

fastapi_app = FastAPI(lifespan=lifespan)

# Enable CORS to allow frontend requests
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5000"],  # Only allow requests from the frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

@fastapi_app.get("/api/question")
async def get_random_question_fastapi():
    if not questions:
        return JSONResponse(content={"error": "No questions available"}, status_code=500)

    question = random.choice(questions)

    if "question_sanitized" not in question or "answer_sanitized" not in question:
        return JSONResponse(content={"error": "Invalid question format"}, status_code=500)

    return {
        "question": question.get('question_sanitized', 'Question not found'),
        "answer": question.get('answer_sanitized', 'Answer not found'),
        "original": question.get('answer', 'Original answer not found'),
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

@fastapi_app.get("/api")
async def api_info_fastapi():
    return {
        "endpoints": {
            "/api/question": "Get a random sanitized question"
        }
    }

@fastapi_app.get("/api/fastapi_test")
def fastapi_test():
    return {"message": "FastAPI is working alongside Flask!"}

def run_flask():
    debug_mode = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    flask_app.run(debug=debug_mode, port=5000, use_reloader=False)

def run_fastapi():
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8000)

flask_thread = threading.Thread(target=run_flask, daemon=True)
fastapi_thread = threading.Thread(target=run_fastapi, daemon=True)

flask_thread.start()
fastapi_thread.start()

# Gracefully handle shutdown when CTRL+C is pressed
def shutdown_server(sig, frame):
    print("\n🛑 Shutting down servers...")
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown_server)

# Keep the main thread alive until interrupted
flask_thread.join()
fastapi_thread.join()

