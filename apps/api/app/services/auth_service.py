from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from ..models import User, UserCreate, UserTier, Token
from ..config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

USERS_DB: dict[str, User] = {}
USER_CREDENTIALS: dict[str, str] = {}  


class AuthService:
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60 * 24 * 7  
    
    def hash_password(self, password: str) -> str:
        """Hash a password"""
        if len(password) > 256:
            raise ValueError("Password must be 256 characters or fewer")
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
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None
    
    def register_user(self, user_data: UserCreate) -> Token:
        if user_data.email in USER_CREDENTIALS:
            raise ValueError("User already exists")
        
        user = User(
            email=user_data.email,
            username=user_data.username,
            tier=UserTier.FREE,
            credits_remaining=10
        )
        
        USERS_DB[user.id] = user
        USER_CREDENTIALS[user_data.email] = self.hash_password(user_data.password)

        access_token = self.create_access_token(user.id, user.email)
        
        return Token(access_token=access_token, user=user)
    
    def login_user(self, email: str, password: str) -> Token:
        if email not in USER_CREDENTIALS:
            raise ValueError("Invalid credentials")
        
        if not self.verify_password(password, USER_CREDENTIALS[email]):
            raise ValueError("Invalid credentials")
        
        user = next((u for u in USERS_DB.values() if u.email == email), None)
        if not user:
            raise ValueError("User not found")
        
        user.last_login = datetime.utcnow()
        
        access_token = self.create_access_token(user.id, user.email)
        
        return Token(access_token=access_token, user=user)
    
    def get_current_user(self, token: str) -> Optional[User]:
        """Get user from token"""
        payload = self.verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        return USERS_DB.get(user_id)
    
    def check_credits(self, user: User) -> bool:
        """Check if user has credits remaining"""
        return user.credits_remaining > 0
    
    def deduct_credit(self, user: User) -> None:
        """Deduct one credit from user"""
        if user.credits_remaining > 0:
            user.credits_remaining -= 1
            user.credits_used += 1
            user.animations_created += 1
    
    def add_credits(self, user: User, amount: int) -> None:
        """Add credits to user (for upgrades/purchases)"""
        user.credits_remaining += amount