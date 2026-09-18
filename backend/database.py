import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PASSWORD = os.getenv("DB_PASSWORD", "YOUR_PASSWORD")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://postgres:{quote_plus(DB_PASSWORD)}@localhost:5432/darukaa",
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
