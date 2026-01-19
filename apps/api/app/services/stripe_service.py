import stripe
from typing import Optional, Dict
from datetime import datetime
from ..config import get_settings
from ..database.models import DBUser, UserTierEnum

settings = get_settings()
stripe.api_key = settings.STRIPE_SECRET_KEY


# Pricing (in cents)
PRICING = {
    "pro_monthly": {
        "amount": 1999,  # $19.99
        "currency": "usd",
        "interval": "month",
        "tier": UserTierEnum.PRO,
        "credits": 100
    },
    "pro_yearly": {
        "amount": 19999,  # $199.99 (save ~17%)
        "currency": "usd",
        "interval": "year",
        "tier": UserTierEnum.PRO,
        "credits": 100
    },
    "enterprise_monthly": {
        "amount": 9999,  # $99.99
        "currency": "usd",
        "interval": "month",
        "tier": UserTierEnum.ENTERPRISE,
        "credits": 1000
    }
}


class StripeService:
    """Service for handling Stripe payments and subscriptions"""
    
    def __init__(self):
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    def create_customer(self, user: DBUser) -> str:
        """Create a Stripe customer for a user"""
        try:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={
                    "user_id": user.id,
                    "username": user.username
                }
            )
            return customer.id
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to create Stripe customer: {str(e)}")
    
    def create_checkout_session(
        self,
        user: DBUser,
        plan: str,
        success_url: str,
        cancel_url: str
    ) -> Dict:
        """Create a Stripe Checkout session for subscription"""
        if plan not in PRICING:
            raise ValueError(f"Invalid plan: {plan}")
        
        pricing = PRICING[plan]
        
        # Ensure user has a Stripe customer ID
        if not user.stripe_customer_id:
            user.stripe_customer_id = self.create_customer(user)
        
        try:
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": pricing["currency"],
                        "product_data": {
                            "name": f"Animation Studio {pricing['tier'].value.capitalize()} Plan",
                            "description": f"{pricing['credits']} credits per {pricing['interval']}"
                        },
                        "unit_amount": pricing["amount"],
                        "recurring": {
                            "interval": pricing["interval"]
                        }
                    },
                    "quantity": 1
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": user.id,
                    "plan": plan
                }
            )
            
            return {
                "session_id": session.id,
                "url": session.url
            }
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to create checkout session: {str(e)}")
    
    def create_marketplace_checkout(
        self,
        user: DBUser,
        item_price: float,
        item_title: str,
        item_id: str,
        success_url: str,
        cancel_url: str
    ) -> Dict:
        """Create a one-time payment for marketplace item"""
        # Ensure user has a Stripe customer ID
        if not user.stripe_customer_id:
            user.stripe_customer_id = self.create_customer(user)
        
        try:
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": item_title,
                            "description": "Animation Template"
                        },
                        "unit_amount": int(item_price * 100)  # Convert to cents
                    },
                    "quantity": 1
                }],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": user.id,
                    "item_id": item_id,
                    "type": "marketplace_purchase"
                }
            )
            
            return {
                "session_id": session.id,
                "url": session.url
            }
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to create marketplace checkout: {str(e)}")
    
    def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a subscription at period end"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return subscription.cancel_at_period_end
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to cancel subscription: {str(e)}")
    
    def resume_subscription(self, subscription_id: str) -> bool:
        """Resume a canceled subscription"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
            return not subscription.cancel_at_period_end
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to resume subscription: {str(e)}")
    
    def get_subscription(self, subscription_id: str) -> Optional[Dict]:
        """Get subscription details"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "id": subscription.id,
                "status": subscription.status,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
        except stripe.error.StripeError:
            return None
    
    def construct_webhook_event(self, payload: bytes, sig_header: str):
        """Verify and construct webhook event"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return event
        except ValueError as e:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise ValueError("Invalid signature")
    
    def handle_subscription_created(self, subscription: Dict) -> Dict:
        """Handle subscription.created webhook"""
        return {
            "user_id": subscription.get("metadata", {}).get("user_id"),
            "subscription_id": subscription.get("id"),
            "customer_id": subscription.get("customer"),
            "status": subscription.get("status"),
            "current_period_start": datetime.fromtimestamp(subscription.get("current_period_start")),
            "current_period_end": datetime.fromtimestamp(subscription.get("current_period_end"))
        }
    
    def handle_subscription_updated(self, subscription: Dict) -> Dict:
        """Handle subscription.updated webhook"""
        return self.handle_subscription_created(subscription)
    
    def handle_subscription_deleted(self, subscription: Dict) -> Dict:
        """Handle subscription.deleted webhook"""
        return {
            "user_id": subscription.get("metadata", {}).get("user_id"),
            "subscription_id": subscription.get("id"),
            "status": "canceled"
        }
    
    def handle_payment_succeeded(self, payment_intent: Dict) -> Dict:
        """Handle payment_intent.succeeded webhook"""
        return {
            "payment_intent_id": payment_intent.get("id"),
            "amount": payment_intent.get("amount"),
            "customer_id": payment_intent.get("customer"),
            "metadata": payment_intent.get("metadata", {})
        }