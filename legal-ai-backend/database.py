import os
import socket
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

def is_postgres_available(host="localhost", port=5432, timeout=1.0):
    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.close()
        return True
    except Exception:
        return False

POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@localhost:5432/legal_ai_db")
SQLITE_URL = "sqlite:///./legal_ai_db.sqlite3"

if is_postgres_available():
    try:
        engine = create_engine(POSTGRES_URL)
        conn = engine.connect()
        conn.close()
        print("Connected to PostgreSQL Database.")
    except Exception:
        print("PostgreSQL socket open but connection failed. Using SQLite fallback.")
        engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
else:
    print("PostgreSQL server not detected at localhost:5432. Using SQLite database.")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from models import User, Appointment, FIR, Case, Document, AuditLog, Hearing

Base.metadata.create_all(bind=engine)