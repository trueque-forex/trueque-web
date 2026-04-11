
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from backend.models.transaction import Transaction
from backend.models.offer_model import Offer

class RiskDecision:
    def __init__(self, action: str, reason: str = None, status: str = None):
        self.action = action # 'approve', 'review', 'reject'
        self.reason = reason
        self.status = status # Optional override status

class RiskEngine:
    @staticmethod
    def check_velocity(user_id: str, amount: float, db: Session) -> RiskDecision:
        """
        Checks velocity rules:
        1. 2nd Transaction in 24h -> STATUS_AUDIT_PENDING.
        2. Single transaction > $1000 -> Review.
        """
        # 1. Single Transaction Cap
        if amount > 1000:
            return RiskDecision("review", "High Value Transaction (> 1000)")

        # 2. Velocity (Count in last 24h)
        now = datetime.now(timezone.utc)
        start_monitor = now - timedelta(hours=24)
        
        count = db.query(func.count(Offer.id)).filter(
            Offer.user_id == user_id,
            Offer.timestamp >= start_monitor
        ).scalar() or 0
        
        # If user has 1 previous transaction (count >= 1), this is the 2nd.
        if count >= 1:
            return RiskDecision("review", f"Velocity Trigger: 2nd Transaction in 24h", status="STATUS_AUDIT_PENDING")
            
        return RiskDecision("approve")

    @staticmethod
    def check_weekly_shield(user_id: str, amount: float, db: Session) -> RiskDecision:
        """
        Weekly Guard (Remitter Shield):
        1. Max 5 transactions in previous 7 days (Rolling).
        2. Max $1000 cumulative volume in previous 7 days.
        """
        now = datetime.now(timezone.utc)
        start_monitor = now - timedelta(days=7)
        
        # 1. Count
        count = db.query(func.count(Offer.id)).filter(
            Offer.user_id == user_id,
            Offer.timestamp >= start_monitor
        ).scalar() or 0
        
        if count >= 5:
             return RiskDecision("review", f"Weekly Velocity Exceeded ({count} in 7 days)")

        # 2. Cumulative Volume (including current amount)
        # Note: We should sum 'amount' from Offers.
        total_vol = db.query(func.sum(Offer.amount)).filter(
            Offer.user_id == user_id,
            Offer.timestamp >= start_monitor
        ).scalar() or 0.0
        
        # Add current transaction to see if it breaches
        if (float(total_vol) + amount) > 1000:
             return RiskDecision("review", f"Weekly Volume Exceeded (> $1000)")
             
        return RiskDecision("approve")

    @staticmethod
    def check_ip_risk(user_country: str, ip_address: str) -> RiskDecision:
        """
        Checks if IP Geolocation matches User's Registered Country.
        """
        if not ip_address:
            return RiskDecision("approve", "No IP provided")
            
        # Mock GeoIP Lookup
        # In prod: geoip2.database.Reader('GeoLite2-Country.mmdb').country(ip_address).country.iso_code
        # For MVP/Sim: We assume if IP starts with certain prefixes it belongs to certain countries, or we trust for now.
        # Let's Implement a Mock for known test IPs.
        
        mock_ip_map = {
            "127.0.0.1": user_country, # Localhost matches everything
            "192.168.1.1": user_country,
            "10.0.0.1": "US",
            "8.8.8.8": "US"
        }
        
        ip_country = mock_ip_map.get(ip_address)
        
        # If we can't look it up, maybe we approve or flag warning?
        if not ip_country:
             return RiskDecision("approve", "IP Lookup Failed (Open)")
             
        if ip_country != user_country:
            return RiskDecision("review", f"GeoIP Mismatch: IP({ip_country}) != User({user_country})")
            
        return RiskDecision("approve")
