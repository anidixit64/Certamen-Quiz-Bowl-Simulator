from flask import Flask, jsonify, request, send_from_directory
import os
import json
import random

app = Flask(__name__, static_folder='../frontend', static_url_path='/')

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

