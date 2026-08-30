from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

from sqlalchemy import event

import os

# If utilizing SQLite for lightweight test runs, ensure check_same_thread is false
connect_args = {}
db_url = settings.DATABASE_URL

# On Vercel / Serverless execution, only /tmp is writable
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    if db_url.startswith("sqlite") and not db_url.startswith("sqlite:////tmp"):
        db_url = "sqlite:////tmp/resqnet_cloud_vault.db"

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

if db_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
