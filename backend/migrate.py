import os
import json
import psycopg2

# Database connection setup
DB_NAME = "certamen"
DB_USER = "aniketdixit"  # Change this if your PostgreSQL user is different
DB_PASSWORD = ""  # If you set a password, add it here
DB_HOST = "localhost"

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST
)
cur = conn.cursor()

# Directory containing JSON files
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def clean_text(text):
    """ Remove NULL characters and strip whitespace. """
    if text:
        return text.replace('\x00', '').strip()
    return None

# Read all JSON files and insert questions into the database
# Read all JSON files and insert questions into the database
for filename in os.listdir(DATA_DIR):
    if filename.endswith('.json'):
        with open(os.path.join(DATA_DIR, filename), 'r', encoding='utf-8') as f:
            questions = json.load(f)
            for question in questions:
                sanitized_answer = clean_text(question.get("answer_sanitized"))
                sanitized_question = clean_text(question.get("question_sanitized"))

                if not sanitized_answer or not sanitized_question:
                    continue

                cur.execute(
                    """
                    INSERT INTO questions (question, answer, category, subcategory, tournament, answer_real)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        clean_text(question["question_sanitized"]),
                        clean_text(question["answer_sanitized"]),
                        clean_text(question.get("category")),
                        clean_text(question.get("subcategory")),
                        clean_text(question.get("tournament")),
                        clean_text(question["answer"])
                    ),
                )

# Commit changes and close connection
conn.commit()
cur.close()
conn.close()

print("✅ Migration completed! All questions have been added to PostgreSQL.")