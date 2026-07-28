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
