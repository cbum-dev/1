from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class UserTierEnum(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class MarketplaceStatusEnum(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DBUser(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    tier = Column(Enum(UserTierEnum), default=UserTierEnum.FREE)
    credits_remaining = Column(Integer, default=10)
    credits_used = Column(Integer, default=0)
    animations_created = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Stripe fields
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    subscription_status = Column(String, nullable=True)  # active, canceled, past_due
    subscription_end_date = Column(DateTime, nullable=True)
    
    # Relationships
    projects = relationship("DBAnimationProject", back_populates="owner")
    marketplace_items = relationship("DBMarketplaceItem", back_populates="creator")
    purchases = relationship("DBPurchase", back_populates="buyer")


class DBAnimationProject(Base):
    __tablename__ = "animation_projects"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    animation_ir = Column(JSON, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    fork_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("DBUser", back_populates="projects")
    marketplace_item = relationship("DBMarketplaceItem", back_populates="project", uselist=False)


class DBMarketplaceItem(Base):
    __tablename__ = "marketplace_items"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("animation_projects.id"), nullable=False, unique=True)
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Listing info
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # logo, social, educational, etc.
    tags = Column(JSON, default=[])
    price = Column(Float, default=0.0)  # 0 = free
    
    # Stats
    sales_count = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    rating_sum = Column(Integer, default=0)
    rating_count = Column(Integer, default=0)
    
    # Status
    status = Column(Enum(MarketplaceStatusEnum), default=MarketplaceStatusEnum.PENDING)
    featured = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("DBAnimationProject", back_populates="marketplace_item")
    creator = relationship("DBUser", back_populates="marketplace_items")
    purchases = relationship("DBPurchase", back_populates="item")


class DBPurchase(Base):
    __tablename__ = "purchases"
    
    id = Column(String, primary_key=True)
    buyer_id = Column(String, ForeignKey("users.id"), nullable=False)
    item_id = Column(String, ForeignKey("marketplace_items.id"), nullable=False)
    price_paid = Column(Float, nullable=False)
    stripe_payment_intent = Column(String, nullable=True)
    purchased_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    buyer = relationship("DBUser", back_populates="purchases")
    item = relationship("DBMarketplaceItem", back_populates="purchases")


class DBSubscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    stripe_subscription_id = Column(String, unique=True, nullable=False)
    stripe_customer_id = Column(String, nullable=False)
    plan = Column(String, nullable=False)  # pro_monthly, pro_yearly, enterprise_monthly
    status = Column(String, nullable=False)  # active, canceled, past_due, trialing
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)