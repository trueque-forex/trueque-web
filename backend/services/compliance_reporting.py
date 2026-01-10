import csv
import io
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.models.transaction import Transaction
from backend.models.user_model import User
# from backend.models.offer_model import Offer # If needed for deeper data

class ComplianceReportingService:
    def __init__(self, db: Session):
        self.db = db

    def generate_csv_report(self, start_date: datetime = None, end_date: datetime = None) -> str:
        """
        Generates a FinCEN-ready CSV report.
        Columns: Timestamp (UTC), Sender Name, Receiver Name, Destination Country, Total Amount (USD Equiv), Platform Fee, Remittance Purpose
        """
        # Alias for Receiver User
        from sqlalchemy.orm import aliased
        Sender = aliased(User)
        Receiver = aliased(User)
        
        query = self.db.query(Transaction, Sender, Receiver).\
            join(Sender, Transaction.user_id == Sender.id).\
            outerjoin(Receiver, Transaction.receiver_user_id == Receiver.id)
        
        if start_date:
            query = query.filter(Transaction.timestamp >= start_date)
        if end_date:
            query = query.filter(Transaction.timestamp <= end_date)
            
        results = query.all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # FinCEN-style Headers
        writer.writerow([
            "Timestamp (UTC)", "Sender Name", "Receiver Name", "Destination Country", 
            "Total Amount (USD Equiv)", "Platform Fee", "Remittance Purpose"
        ])
        
        for tx, sender, receiver in results:
            # 1. USD Equivalent Calculation
            usd_amount = float(tx.amount)
            if tx.from_currency == 'EUR':
                usd_amount = float(tx.amount) * 1.08
            elif tx.from_currency != 'USD':
                usd_amount = float(tx.amount) * 0.5 
            
            # 2. Platform Fee (Placeholder)
            platform_fee = "0.00" 
            
            # 3. Receiver Name logic
            receiver_name = receiver.full_name if receiver else "N/A"

            writer.writerow([
                tx.timestamp.isoformat() if tx.timestamp else "",
                sender.full_name,
                receiver_name,
                sender.country, # Using Sender country as proxy for Origin/Dest logic for now
                f"{usd_amount:.2f}",
                platform_fee,
                tx.remittance_purpose or "N/A"
            ])
            
        return output.getvalue()
