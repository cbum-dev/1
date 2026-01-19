from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..models import User, UserCreate, UserTier, Token
from ..database.models import DBUser, UserTierEnum
from ..config import get_settings
import uuid

settings = get_settings()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class AuthService:
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60 * 24 * 7  # 7 days
    
    def hash_password(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, user_id: str, email: str) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode = {
            "sub": user_id,
            "email": email,
            "exp": expire
        }
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return {"user_id": payload.get("sub"), "email": payload.get("email")}
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None
    
    def register_user(self, user_data: UserCreate, db: Session) -> Token:
        """Register a new user"""
        # Check if user exists
        existing = db.query(DBUser).filter(DBUser.email == user_data.email).first()
        if existing:
            raise ValueError("User already exists")
        
        # Create user
        db_user = DBUser(
            id=str(uuid.uuid4()),
            email=user_data.email,
            username=user_data.username,
            hashed_password=self.hash_password(user_data.password),
            tier=UserTierEnum.FREE,
            credits_remaining=10
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Generate token
        access_token = self.create_access_token(db_user.id, db_user.email)
        
        user = User(
            id=db_user.id,
            email=db_user.email,
            username=db_user.username,
            tier=db_user.tier,
            credits_remaining=db_user.credits_remaining,
            credits_used=db_user.credits_used,
            animations_created=db_user.animations_created,
            created_at=db_user.created_at.isoformat()
        )
        
        return Token(access_token=access_token, user=user)
    
    def login_user(self, email: str, password: str, db: Session) -> Token:
        """Login user and return token"""
        # Find user
        db_user = db.query(DBUser).filter(DBUser.email == email).first()
        
        if not db_user:
            raise ValueError("Invalid credentials")
        
        # Verify password
        if not self.verify_password(password, db_user.hashed_password):
            raise ValueError("Invalid credentials")
        
        # Update last login
        db_user.last_login = datetime.utcnow()
        db.commit()
        
        # Generate token
        access_token = self.create_access_token(db_user.id, db_user.email)
        
        user = User(
            id=db_user.id,
            email=db_user.email,
            username=db_user.username,
            tier=db_user.tier,
            credits_remaining=db_user.credits_remaining,
            credits_used=db_user.credits_used,
            animations_created=db_user.animations_created,
            created_at=db_user.created_at.isoformat()
        )
        
        return Token(access_token=access_token, user=user)
    
    def get_current_user(self, token: str) -> Optional[dict]:
        """Get user from token"""
        payload = self.verify_token(token)
        return payload
    
    def check_credits(self, user: User) -> bool:
        """Check if user has credits remaining"""
        return user.credits_remaining > 0
    
    def deduct_credit(self, user: DBUser, db: Session) -> None:
        """Deduct one credit from user"""
        if user.credits_remaining > 0:
            user.credits_remaining -= 1
            user.credits_used += 1
            user.animations_created += 1
            db.commit()
    
    def add_credits(self, user: DBUser, amount: int, db: Session) -> None:
        """Add credits to user (for upgrades/purchases)"""
        user.credits_remaining += amount
        db.commit()