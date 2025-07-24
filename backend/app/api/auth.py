from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta

from app import security
from app.schemas.auth import TokenResponse, TokenRequest
from app.config import settings

router = APIRouter()

@router.post("/login/token", response_model=TokenResponse)
async def login_for_access_token(request: TokenRequest):
    if not request.email == settings.DEMO_ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not request.password == settings.DEMO_ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    access_token_expires = timedelta(hours=24)
    access_token = security.create_access_token(
        data={"sub": request.email, "role": "admin"},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}