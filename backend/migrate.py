import json
import os
from sqlalchemy.orm import Session
from database import SessionLocal, Question

# Path to JSON files
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data"))
data_files = [f"{DATA_DIR}/tossups_part_{i}.json" for i in range(1, 7)]  # Adjust for all parts

def clean_text(text):
    """ Remove NULL characters and extra spaces """
    if isinstance(text, str):
        return text.replace("\x00", "").strip()
    return text

def load_questions():
    db: Session = SessionLocal()

    for file in data_files:
        if not os.path.exists(file):
            print(f"⚠️ Skipping {file}, file not found.")
            continue

        try:
            with open(file, encoding="utf-8") as f:
                questions = json.load(f)

                for q in questions:
                    new_question = Question(
                        question=clean_text(q.get("question_sanitized", "")),
                        answer=clean_text(q.get("answer_sanitized", "")),
                        original=clean_text(q.get("answer", "")),
                        category=clean_text(q.get("category", "")),
                        subcategory=clean_text(q.get("subcategory", "")),
                        tournament=clean_text(q.get("tournament", "")),
                    )
                    
                    db.add(new_question)

            db.commit()
            print(f"✅ Loaded questions from {file}")

        except Exception as e:
            print(f"❌ Error loading {file}: {e}")

    db.close()

if __name__ == "__main__":
    load_questions()
