from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings

# This is for password hashing, good practice for the future.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This tells FastAPI where to look for the token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=60) # Default to 60 minutes
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def get_current_admin_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency to validate token and ensure user is an admin.
    This will be used to protect our endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: Optional[str] = payload.get("sub")
        role: Optional[str] = payload.get("role")
        if email is None or role is None:
            raise credentials_exception
        if role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    except JWTError:
        raise credentials_exception
    
    # In a real app, i would fetch from the DB but since it's only a Demo valid admin token is enough
    return {"email": email, "role": role}