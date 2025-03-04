from flask import Flask, jsonify, request, send_from_directory
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, Question
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
import uvicorn
import os
import json
import random
import threading
import signal
import sys
from loguru import logger
import redis

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
CACHE_EXPIRATION = 60  # Cache questions for 60 seconds

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Configure logging
logger.remove()  # Remove default logger
logger.add(sys.stderr, format="{time} {level} {message}", level="INFO")

logger.add("logs/app.log", rotation="1 MB", level="INFO", retention="10 days")


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
                        logger.warning(f"⚠️ Warning: {filename} does not contain a list of questions.")
            except json.JSONDecodeError as e:
                logger.error(f"❌ Error decoding {filename}: {e}")
            except FileNotFoundError as e:
                logger.error(f"❌ File not found: {filename} - {e}")
            except Exception as e:
                logger.error(f"❌ Unexpected error loading {filename}: {e}")


    logger.info(f"✅ {len(questions)} questions loaded from the data directory.")


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
async def get_random_question_fastapi(db: Session = Depends(get_db)):
    logger.info("📡 Received request: /api/question")
    
    try:
        # Fetch total questions count
        total_questions = db.query(Question).count()
        
        if total_questions == 0:
            logger.warning("⚠️ No questions available in the database!")
            return JSONResponse(content={"error": "No questions available"}, status_code=500)
        
        # Generate a random ID and fetch the corresponding question
        random_id = random.randint(1, total_questions)
        question = db.query(Question).filter(Question.id == random_id).first()

        if not question:
            logger.warning("⚠️ No question found with id %d", random_id)
            return JSONResponse(content={"error": "No question found"}, status_code=500)
        
        # If everything is fine, return the question data
        return {
            "question": question.question,
            "answer": question.answer,
            "original": question.original,
            "category": question.category,
            "subcategory": question.subcategory,
            "tournament": question.tournament,
        }
    
    except Exception as e:
        logger.error(f"❌ Error occurred while fetching the question: {e}")
        return JSONResponse(content={"error": "Error loading question. Please try again."}, status_code=500)


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

