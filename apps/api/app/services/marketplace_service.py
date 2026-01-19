from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from ..database.models import (
    DBMarketplaceItem, DBAnimationProject, DBPurchase, DBUser,
    MarketplaceStatusEnum
)
import uuid


class MarketplaceService:
    """Service for managing animation marketplace"""
    
    def create_listing(
        self,
        db: Session,
        project_id: str,
        creator_id: str,
        title: str,
        description: str,
        category: str,
        price: float,
        tags: List[str] = None
    ) -> DBMarketplaceItem:
        """Create a new marketplace listing"""
        # Check if project exists and belongs to user
        project = db.query(DBAnimationProject).filter(
            DBAnimationProject.id == project_id,
            DBAnimationProject.user_id == creator_id
        ).first()
        
        if not project:
            raise ValueError("Project not found or unauthorized")
        
        # Check if already listed
        existing = db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.project_id == project_id
        ).first()
        
        if existing:
            raise ValueError("Project already listed in marketplace")
        
        # Create listing
        item = DBMarketplaceItem(
            id=str(uuid.uuid4()),
            project_id=project_id,
            creator_id=creator_id,
            title=title,
            description=description,
            category=category,
            price=price,
            tags=tags or [],
            status=MarketplaceStatusEnum.PENDING
        )
        
        db.add(item)
        db.commit()
        db.refresh(item)
        
        return item
    
    def get_listings(
        self,
        db: Session,
        category: Optional[str] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        featured_only: bool = False,
        status: MarketplaceStatusEnum = MarketplaceStatusEnum.APPROVED,
        limit: int = 20,
        offset: int = 0
    ) -> List[DBMarketplaceItem]:
        """Get marketplace listings with filters"""
        query = db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.status == status
        )
        
        if category:
            query = query.filter(DBMarketplaceItem.category == category)
        
        if search:
            query = query.filter(
                DBMarketplaceItem.title.ilike(f"%{search}%") |
                DBMarketplaceItem.description.ilike(f"%{search}%")
            )
        
        if min_price is not None:
            query = query.filter(DBMarketplaceItem.price >= min_price)
        
        if max_price is not None:
            query = query.filter(DBMarketplaceItem.price <= max_price)
        
        if featured_only:
            query = query.filter(DBMarketplaceItem.featured == True)
        
        # Order by featured first, then by sales
        query = query.order_by(
            desc(DBMarketplaceItem.featured),
            desc(DBMarketplaceItem.sales_count)
        )
        
        return query.limit(limit).offset(offset).all()
    
    def get_listing(self, db: Session, item_id: str) -> Optional[DBMarketplaceItem]:
        """Get a single listing by ID"""
        return db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.id == item_id
        ).first()
    
    def purchase_item(
        self,
        db: Session,
        buyer_id: str,
        item_id: str,
        payment_intent_id: str
    ) -> DBPurchase:
        """Record a marketplace purchase"""
        item = self.get_listing(db, item_id)
        if not item:
            raise ValueError("Item not found")
        
        # Check if already purchased
        existing = db.query(DBPurchase).filter(
            DBPurchase.buyer_id == buyer_id,
            DBPurchase.item_id == item_id
        ).first()
        
        if existing:
            raise ValueError("Already purchased")
        
        # Create purchase record
        purchase = DBPurchase(
            id=str(uuid.uuid4()),
            buyer_id=buyer_id,
            item_id=item_id,
            price_paid=item.price,
            stripe_payment_intent=payment_intent_id
        )
        
        # Update item stats
        item.sales_count += 1
        item.revenue += item.price
        
        db.add(purchase)
        db.commit()
        db.refresh(purchase)
        
        return purchase
    
    def get_user_purchases(
        self,
        db: Session,
        user_id: str
    ) -> List[DBPurchase]:
        """Get all purchases by a user"""
        return db.query(DBPurchase).filter(
            DBPurchase.buyer_id == user_id
        ).all()
    
    def get_creator_sales(
        self,
        db: Session,
        creator_id: str
    ) -> List[DBMarketplaceItem]:
        """Get all items sold by a creator"""
        return db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.creator_id == creator_id,
            DBMarketplaceItem.sales_count > 0
        ).all()
    
    def get_creator_revenue(self, db: Session, creator_id: str) -> float:
        """Get total revenue for a creator"""
        result = db.query(
            func.sum(DBMarketplaceItem.revenue)
        ).filter(
            DBMarketplaceItem.creator_id == creator_id
        ).scalar()
        
        return result or 0.0
    
    def update_listing(
        self,
        db: Session,
        item_id: str,
        creator_id: str,
        **updates
    ) -> DBMarketplaceItem:
        """Update a marketplace listing"""
        item = db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.id == item_id,
            DBMarketplaceItem.creator_id == creator_id
        ).first()
        
        if not item:
            raise ValueError("Item not found or unauthorized")
        
        # Update allowed fields
        allowed_fields = ["title", "description", "price", "tags"]
        for field, value in updates.items():
            if field in allowed_fields and value is not None:
                setattr(item, field, value)
        
        db.commit()
        db.refresh(item)
        
        return item
    
    def delete_listing(
        self,
        db: Session,
        item_id: str,
        creator_id: str
    ) -> bool:
        """Delete a marketplace listing"""
        item = db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.id == item_id,
            DBMarketplaceItem.creator_id == creator_id
        ).first()
        
        if not item:
            raise ValueError("Item not found or unauthorized")
        
        # Can't delete if there are purchases
        if item.sales_count > 0:
            raise ValueError("Cannot delete item with existing purchases")
        
        db.delete(item)
        db.commit()
        
        return True
    
    def get_trending(self, db: Session, limit: int = 10) -> List[DBMarketplaceItem]:
        """Get trending items (most sales in last 30 days)"""
        # For simplicity, just return top sellers
        # In production, filter by date
        return db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.status == MarketplaceStatusEnum.APPROVED
        ).order_by(
            desc(DBMarketplaceItem.sales_count)
        ).limit(limit).all()
    
    def get_featured(self, db: Session, limit: int = 5) -> List[DBMarketplaceItem]:
        """Get featured items"""
        return db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.status == MarketplaceStatusEnum.APPROVED,
            DBMarketplaceItem.featured == True
        ).limit(limit).all()
    
    def approve_listing(self, db: Session, item_id: str) -> DBMarketplaceItem:
        """Approve a pending listing (admin only)"""
        item = db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.id == item_id
        ).first()
        
        if not item:
            raise ValueError("Item not found")
        
        item.status = MarketplaceStatusEnum.APPROVED
        db.commit()
        db.refresh(item)
        
        return item
    
    def reject_listing(self, db: Session, item_id: str) -> DBMarketplaceItem:
        """Reject a pending listing (admin only)"""
        item = db.query(DBMarketplaceItem).filter(
            DBMarketplaceItem.id == item_id
        ).first()
        
        if not item:
            raise ValueError("Item not found")
        
        item.status = MarketplaceStatusEnum.REJECTED
        db.commit()
        db.refresh(item)
        
        return item