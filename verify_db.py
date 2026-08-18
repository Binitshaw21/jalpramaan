import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing. Add it to the .env file in the project root.")

try:
    from main import Incident, Base, engine
except Exception as exc:  # pragma: no cover - useful for upfront import diagnosis
    print("❌ Failed to import the SQLAlchemy models from main.py.")
    print("Check that main.py is present and has no import-time database or dependency errors.")
    print(f"Original error: {type(exc).__name__}: {exc}")
    sys.exit(1)


def sanitize_url(url: str) -> str:
    if not url:
        return "<empty>"
    try:
        prefix, rest = url.split("@", 1)
        userinfo, hostinfo = prefix.split("://", 1)
        if ":" in userinfo:
            user = userinfo.split(":", 1)[0]
            masked = f"{userinfo.split(':', 1)[0]}:***"
            return url.replace(f"{userinfo}@", f"{masked}@", 1)
        return url
    except Exception:
        return "<redacted connection string>"


def print_troubleshooting(exc: Exception) -> None:
    print("\nDatabase verification failed.")
    print("\nTroubleshooting checklist:")
    print("1. Confirm the DATABASE_URL in .env is correct and not expired.")
    print(f"   Current value: {sanitize_url(DATABASE_URL)}")
    print("2. Check that your Supabase/PostgreSQL server is running and not paused.")
    print("3. Confirm the host and port are reachable from this machine.")
    print("4. Ensure the database allows TCP/IP connections and the IP is allowlisted in Supabase.")
    print("5. Verify the DB user has INSERT, SELECT, and DELETE permissions on the incidents table.")
    print("6. If the database is remote, test connectivity with the Supabase connection details and firewall/VPN settings.")
    print("7. Ensure the schema exists and the model matches the database table definition.")
    print(f"\nOriginal exception: {type(exc).__name__}: {exc}\n")


def main() -> None:
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = None

    try:
        print("Starting SQLAlchemy database verification...\n")
        print(f"Database URL: {sanitize_url(DATABASE_URL)}")

        # 1) Liveness check: SELECT 1
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            print(f"✅ Liveness check passed: SELECT 1 returned {result}")

        # 2) Ensure table exists for the model
        Base.metadata.create_all(bind=engine)
        print("✅ ORM metadata verified: table definitions available.")

        # 3) Write test: insert a mock incident
        session = session_factory()
        test_id = f"verify-{uuid.uuid4().hex[:12]}"
        mock_report = {
            "is_contaminated": True,
            "estimated_ph": 6.7,
            "chlorine_level_ppm": 0.4,
            "turbidity_visual_score": 3,
            "extracted_audio_symptoms": ["db verification test"],
            "detected_anomalies": ["database connectivity test"],
            "immediate_citizen_advisory": "This is a test record inserted by verify_db.py.",
            "dispatch_priority": "LOW",
        }

        mock_incident = Incident(
            id=test_id,
            lat=28.6139,
            lng=77.2090,
            ai_report=mock_report,
            status="DB_VERIFY",
        )

        session.add(mock_incident)
        session.commit()
        print(f"✅ Write test passed: inserted mock incident with id {test_id}")

        # 4) Read test: fetch the same mock record back
        stored = session.query(Incident).filter(Incident.id == test_id).one()
        print(
            "✅ Read test passed: fetched mock incident "
            f"{stored.id} at lat={stored.lat}, lng={stored.lng}, status={stored.status}"
        )

        # 5) Cleanup: remove the test record so it doesn't remain in production
        session.delete(stored)
        session.commit()
        print(f"✅ Cleanup passed: deleted mock incident {test_id}")

        print("\nDatabase verification completed successfully.")

    except Exception as exc:
        print(f"❌ Database verification failed: {type(exc).__name__}: {exc}")
        print_troubleshooting(exc)
        sys.exit(1)

    finally:
        if session is not None:
            session.close()


if __name__ == "__main__":
    main()
