import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.all_schemas import UserRegisterRequest, UserResponse
from app.models.all_models import User, EmergencyProfile
from app.security.auth import create_access_token

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register mobile user profile and emergency medical vault records in PostgreSQL repository.
    """
    existing_user = db.query(User).filter((User.email == req.email) | (User.phone_number == req.phone_number)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email or phone number already exists.")
        
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    user = User(
        id=user_id,
        full_name=req.full_name,
        email=req.email,
        phone_number=req.phone_number
    )
    db.add(user)
    
    profile = EmergencyProfile(
        id=f"prof_{uuid.uuid4().hex[:10]}",
        user_id=user_id,
        age=req.age,
        blood_group=req.blood_group,
        medical_conditions=req.medical_conditions,
        allergies=req.allergies,
        emergency_contacts=[c.model_dump() for c in req.emergency_contacts]
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    db.refresh(profile)
    
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        blood_group=profile.blood_group,
        created_at=user.created_at.isoformat() + "Z"
    )

@router.get("/{id}", response_model=UserResponse)
def get_user_profile(id: str, db: Session = Depends(get_db)):
    """
    Retrieve verified responder user medical identity.
    """
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
        
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.user_id == user.id).first()
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        blood_group=profile.blood_group if profile else "Unknown",
        created_at=user.created_at.isoformat() + "Z"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Email-Linked Profile Persistence & Instant Auto-Login Retrieval
# ─────────────────────────────────────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CompleteProfilePayload(BaseModel):
    name: str
    email: str
    phoneNumber: Optional[str] = ""
    age: Optional[str] = ""
    gender: Optional[str] = "Male"
    height: Optional[str] = ""
    weight: Optional[str] = ""
    bloodGroup: Optional[str] = "O+"
    medicalConditions: Optional[str] = "None reported"
    allergies: Optional[str] = "None reported"
    currentMedications: Optional[str] = "None"
    emergencyContactName: Optional[str] = "Primary Contact"
    emergencyContactRelation: Optional[str] = "Family"
    emergencyContactPhone: Optional[str] = "112"
    emergencyContactEmail: Optional[str] = None


@router.get("/profile-by-email/{email}")
def get_profile_by_email(email: str, db: Session = Depends(get_db)):
    """
    Check if a completed profile exists for this Gmail / Email address.
    If found, returns the saved profile so the user does NOT have to re-enter it.
    """
    clean_email = email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if not user:
        return {
            "exists": False,
            "profileCompleted": False,
            "message": "No existing profile found for this email."
        }
        
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.user_id == user.id).first()
    
    return {
        "exists": True,
        "profileCompleted": True,
        "user": {
            "id": user.id,
            "fullName": user.full_name,
            "email": user.email,
            "phoneNumber": user.phone_number,
            "createdAt": user.created_at.isoformat() + "Z" if user.created_at else None,
        },
        "profile": {
            "age": profile.age if profile else "",
            "bloodGroup": profile.blood_group if profile else "O+",
            "medicalConditions": profile.medical_conditions if profile else "None reported",
            "allergies": profile.allergies if profile else "None reported",
            "emergencyContacts": profile.emergency_contacts if profile else [],
        }
    }


@router.post("/save-profile")
def save_user_profile(payload: CompleteProfilePayload, db: Session = Depends(get_db)):
    """
    Saves and permanently associates user and medical profile with their Gmail address.
    """
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if not user:
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        user = User(
            id=user_id,
            full_name=payload.name.strip(),
            email=clean_email,
            phone_number=payload.phoneNumber.strip() if payload.phoneNumber else f"+{user_id[:8]}"
        )
        db.add(user)
        db.flush()
    else:
        user.full_name = payload.name.strip()
        if payload.phoneNumber and payload.phoneNumber.strip():
            user.phone_number = payload.phoneNumber.strip()
            
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.user_id == user.id).first()
    
    emergency_contacts = [
        {
            "id": "c1",
            "name": payload.emergencyContactName or "Emergency Contact",
            "relationship": payload.emergencyContactRelation or "Family",
            "phoneNumber": payload.emergencyContactPhone or "112",
            "priorityOrder": 1
        }
    ]
    
    if not profile:
        profile = EmergencyProfile(
            id=f"prof_{uuid.uuid4().hex[:10]}",
            user_id=user.id,
            age=payload.age,
            blood_group=payload.bloodGroup or "O+",
            medical_conditions=payload.medicalConditions,
            allergies=payload.allergies,
            emergency_contacts=emergency_contacts
        )
        db.add(profile)
    else:
        profile.age = payload.age
        profile.blood_group = payload.bloodGroup or "O+"
        profile.medical_conditions = payload.medicalConditions
        profile.allergies = payload.allergies
        profile.emergency_contacts = emergency_contacts
        
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "message": f"Profile permanently saved for {clean_email}.",
        "userId": user.id,
        "email": clean_email,
        "profileCompleted": True
    }

