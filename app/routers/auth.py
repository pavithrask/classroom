"""Authentication endpoints."""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from ..database import get_session
from ..models import User
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)) -> dict[str, str]:
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = create_access_token({"sub": str(user.id)}, expires_delta=timedelta(minutes=60))
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: dict[str, str], session: Session = Depends(get_session)) -> dict[str, str]:
    required = {"email", "password", "full_name"}
    if not required.issubset(payload):
        missing = required - payload.keys()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Missing fields: {', '.join(missing)}")
    if session.exec(select(User).where(User.email == payload["email"])).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=payload["email"], full_name=payload["full_name"], hashed_password=hash_password(payload["password"]))
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name}
