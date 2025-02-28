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

# Read all JSON files and insert questions into the database
for filename in os.listdir(DATA_DIR):
    if filename.endswith('.json'):
        with open(os.path.join(DATA_DIR, filename), 'r', encoding='utf-8') as f:
            questions = json.load(f)
            for question in questions:
                cur.execute(
                    """
                    INSERT INTO questions (question, answer, category, subcategory, tournament)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        question["question_sanitized"],
                        question["answer_sanitized"],
                        question.get("category", None),
                        question.get("subcategory", None),
                        question.get("tournament", None),
                    ),
                )

# Commit changes and close connection
conn.commit()
cur.close()
conn.close()

print("✅ Migration completed! All questions have been added to PostgreSQL.")