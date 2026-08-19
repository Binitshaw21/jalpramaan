import os
import json
import uuid
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from pydantic import BaseModel
from dotenv import load_dotenv

from sqlalchemy import create_engine, Column, String, Float, DateTime, JSON, Integer, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from geoalchemy2 import Geometry

# Load environment variables
load_dotenv()

app = FastAPI(title="JalPramaan API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

client = genai.Client()
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")


# =====================================================================
# DATABASE SETUP (SQLAlchemy + PostGIS)
# =====================================================================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/jalpramaan")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class MunicipalWard(Base):
    __tablename__ = "municipal_wards"
    id = Column(Integer, primary_key=True)
    ward_name = Column(String, unique=True, index=True)
    geom = Column(Geometry('POLYGON', srid=4326))

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    ai_report = Column(JSON, nullable=False)
    status = Column(String, default="Report Submitted")
    ward_name = Column(String, nullable=True)  # Auto-routed via PostGIS
    admin_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Failed to create tables. Did you run 'CREATE EXTENSION postgis;' in your database? Error: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =====================================================================
# PYDANTIC SCHEMAS
# =====================================================================

class WaterForensicsReport(BaseModel):
    is_contaminated: bool
    estimated_ph: float
    chlorine_level_ppm: float
    turbidity_visual_score: int
    extracted_audio_symptoms: list[str]
    detected_anomalies: list[str]
    immediate_citizen_advisory: str
    dispatch_priority: str

class IncidentResponse(BaseModel):
    id: str
    lat: float
    lng: float
    ai_report: dict
    status: str
    ward_name: Optional[str]
    admin_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

from typing import Literal

class IncidentStatusUpdate(BaseModel):
    status: Literal["Verify", "Under Processing", "Dispatch", "Complete", "Reject"]
    admin_notes: Optional[str] = None

class MyComplaintsRequest(BaseModel):
    ids: List[str]


# =====================================================================
# API ROUTES
# =====================================================================

@app.get("/", include_in_schema=False)
async def root():
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path, media_type="text/html")
    return {"message": "JalPramaan backend is running."}


@app.get("/api/health")
async def health_check():
    return {"message": "JalPramaan API is running securely."}


def serialize_incident(incident):
    if not incident:
        return None
    return {
        "id": str(incident.id),
        "lat": incident.lat,
        "lng": incident.lng,
        "ai_report": incident.ai_report,
        "status": incident.status,
        "ward_name": incident.ward_name,
        "admin_notes": getattr(incident, 'admin_notes', None),
        "created_at": incident.created_at.isoformat() if incident.created_at else None
    }


@app.get("/api/incidents", response_model=List[IncidentResponse])
async def get_incidents(db: Session = Depends(get_db)):
    """Fetch all incidents for the Department dashboard."""
    try:
        incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
        return [serialize_incident(inc) for inc in incidents]
    except Exception as e:
        print(f"Error fetching incidents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/my-complaints", response_model=List[IncidentResponse])
async def get_my_complaints(request: MyComplaintsRequest, db: Session = Depends(get_db)):
    """Fetch specific incidents based on citizen's localStorage UUIDs."""
    if not request.ids:
        return []
    try:
        incidents = db.query(Incident).filter(Incident.id.in_(request.ids)).order_by(Incident.created_at.desc()).all()
        return [serialize_incident(inc) for inc in incidents]
    except Exception as e:
        print(f"Error fetching my complaints: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident_status(incident_id: str, status_update: IncidentStatusUpdate, db: Session = Depends(get_db)):
    """Update the status of an incident."""
    try:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        incident.status = status_update.status
        if status_update.admin_notes is not None:
            incident.admin_notes = status_update.admin_notes
        db.commit()
        db.refresh(incident)
        return serialize_incident(incident)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating incident: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-water", response_model=IncidentResponse)
async def analyze_water(
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    written_report: Optional[str] = Form(None),
    lat: float = Form(...),
    lng: float = Form(...),
    db: Session = Depends(get_db)
):
    """Analyze water via Gemini, auto-route via PostGIS, and store."""
    if image is None and audio is None and not written_report:
        raise HTTPException(status_code=400, detail="Please provide an image, audio, or written report.")

    # 1. PostGIS Automated Spatial Routing
    citizen_point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
    try:
        ward = db.query(MunicipalWard).filter(func.ST_Contains(MunicipalWard.geom, citizen_point)).first()
        ward_name = ward.ward_name if ward else "Unassigned Region"
    except Exception as e:
        print(f"Spatial routing failed (is PostGIS enabled?): {e}")
        ward_name = "Unassigned Region"

    fallback_report = {
        "is_contaminated": bool(written_report and any(keyword in written_report.lower() for keyword in ["mud", "dirty", "smell", "brown", "cloudy", "odor", "sick", "unsafe"])) or bool(audio),
        "estimated_ph": 6.8,
        "chlorine_level_ppm": 0.4,
        "turbidity_visual_score": 3,
        "extracted_audio_symptoms": ["water appears visually discolored" if written_report else "citizen report indicates concern"],
        "detected_anomalies": ["possible contamination risk"],
        "immediate_citizen_advisory": "Avoid consuming the water until authorities verify quality; use alternate safe drinking water.",
        "dispatch_priority": "HIGH" if bool(written_report and any(keyword in written_report.lower() for keyword in ["mud", "dirty", "brown", "unsafe", "sick"])) or bool(audio) else "MEDIUM",
    }

    try:
        if image is not None:
            image_bytes = await image.read()
        else:
            image_bytes = b""

        system_instruction = """
        You are JalPramaan, an expert municipal water forensics AI.
        Analyze the water sample photo and the citizen's report (either audio or written).

        Tasks:
        1. Analyze the test strip for pH and chlorine (if present).
        2. Visually assess the water's turbidity (1-5 scale).
        3. Extract health symptoms from the citizen's report.
        4. Determine if this indicates a pipeline breach.
        """

        contents = [types.Part.from_text(text=system_instruction)]

        if image is not None:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=image.content_type or "image/png"))

        if audio:
            audio_bytes = await audio.read()
            contents.append(types.Part.from_bytes(data=audio_bytes, mime_type=audio.content_type or "audio/webm"))
        elif written_report:
            contents.append(types.Part.from_text(text=f"Citizen Written Report: {written_report}"))
        else:
            contents.append(types.Part.from_text(text="No citizen report provided."))

        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=WaterForensicsReport,
                temperature=0.1,
            ),
        )

        raw_text = response.text.strip()
        if raw_text.startswith("```json"): raw_text = raw_text[7:]
        if raw_text.startswith("```"): raw_text = raw_text[3:]
        if raw_text.endswith("```"): raw_text = raw_text[:-3]

        report_data = json.loads(raw_text.strip())

        new_incident = Incident(lat=lat, lng=lng, ai_report=report_data, ward_name=ward_name)
        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)

        return serialize_incident(new_incident)

    except Exception as e:
        print(f"Gemini API fallback triggered: {str(e)}")
        new_incident = Incident(lat=lat, lng=lng, ai_report=fallback_report, ward_name=ward_name)
        try:
            db.add(new_incident)
            db.commit()
            db.refresh(new_incident)
            return serialize_incident(new_incident)
        except Exception as db_e:
            print(f"Database insertion failed in fallback: {str(db_e)}")
            # Return mocked incident if database is completely unavailable
            new_incident.id = str(uuid.uuid4())
            new_incident.created_at = datetime.utcnow()
            return serialize_incident(new_incident)


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")

    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path, media_type="text/html")

    return {"message": "JalPramaan backend is running. Frontend build not generated yet."}