from flask import Flask, jsonify, request, send_from_directory
from fastapi import FastAPI, Depends
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
from loguru import logger
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# PostgreSQL Connection URL
DATABASE_URL = "postgresql://certamen_user:hortumetbiblio@localhost/certamen_db"

# Create database engine
engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define Base for ORM models
Base = declarative_base()

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    original = Column(Text)
    category = Column(String)
    subcategory = Column(String)
    tournament = Column(String)

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

    # Fetch a random question from PostgreSQL
    question = db.query(Question).order_by(func.random()).first()

    if not question:
        logger.warning("⚠️ No questions available in the database!")
        return JSONResponse(content={"error": "No questions available"}, status_code=500)

    return {
        "question": question.sanitized_question,
        "answer": question.sanitized_answer,
        "original": question.answer,
        "category": question.category,
        "subcategory": question.subcategory,
        "tournament": question.tournament,
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

