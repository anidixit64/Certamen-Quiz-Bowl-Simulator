from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# PostgreSQL Connection URL
DATABASE_URL = "postgresql://certamen_user:hortumetbiblio@localhost/certamen_db"

# Create database engine
engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20, pool_timeout=30, pool_recycle=1800)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define Base for ORM models
Base = declarative_base()

# Define the Question model
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    original = Column(Text)
    category = Column(String)
    subcategory = Column(String)
    tournament = Column(String)
