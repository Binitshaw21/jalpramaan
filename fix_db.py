import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found in .env")
    exit(1)

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE incidents ADD COLUMN admin_notes VARCHAR;"))
        conn.commit()
    print("Successfully added admin_notes column to incidents table!")
except Exception as e:
    print(f"Error (column might already exist): {e}")
