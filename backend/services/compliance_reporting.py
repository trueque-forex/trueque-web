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

    def generate_impact_report(self) -> str:
        """
        Generates a 'Social Good' Impact Report proving micro-remittance focus.
        Columns: Destination Country, Transaction Count, Avg Amount (USD), Social Risk Score (1-10)
        """
        # Aggregate by Country
        # We need to query Transactions and group by Destination (or Receiver Country)
        # SQLite Group By might be tricky with ORM, let's pull all and aggregate in python for MVP simplicity or use functional query.
        
        from sqlalchemy import func
        # Assuming Transaction.to_currency maps to country roughly (EUR->ARS = ARS = Argentina)
        # OR better: join Sender or Receiver country.
        # Let's use currency as proxy for Corridor.
        
        stats = self.db.query(
            Transaction.currency_to,
            func.count(Transaction.id),
            func.avg(Transaction.amount)
        ).group_by(Transaction.currency_to).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Corridor", "Count", "Avg Amount (USD)", "Social Risk Score (10=Low Risk)"])
        
        for currency, count, avg_amt in stats:
            # Convert Avg to Float
            avg_val = float(avg_amt) if avg_amt else 0.0
            
            # Simple USD Norm (Rough)
            usd_avg = avg_val
            if currency == 'ARS': usd_avg = avg_val / 1000 # Rough FX
            elif currency == 'MXN': usd_avg = avg_val / 20
            elif currency == 'EUR': usd_avg = avg_val * 1.08
            
            # Score Logic:
            # Micro (< $200) -> 10/10 (Safe/Social)
            # Med (< $1000) -> 7/10
            # High (> $1000) -> 2/10 (Institutional Risk)
            
            score = 10
            if usd_avg > 200: score = 7
            if usd_avg > 1000: score = 2
            
            writer.writerow([
                currency,
                count,
                f"${usd_avg:.2f}",
                score
            ])
            
        return output.getvalue()
        
    def generate_purpose_report(self) -> str:
        """
        Breakdown of Volume by Remittance Purpose to prove Good Faith.
        """
        from sqlalchemy import func
        
        stats = self.db.query(
            Transaction.remittance_purpose,
            func.count(Transaction.id),
            func.sum(Transaction.amount)
        ).group_by(Transaction.remittance_purpose).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Purpose", "Count", "Total Volume (EUR Base)", "Share of Wallet"])
        
        # Calculate Total for % share
        total_vol = sum([float(s[2] or 0) for s in stats])
        
        for purpose, count, vol in stats:
            vol_f = float(vol or 0)
            share = (vol_f / total_vol * 100) if total_vol > 0 else 0
            writer.writerow([
                purpose or "Unspecified",
                count,
                f"€{vol_f:.2f}",
                f"{share:.1f}%"
            ])
            
        return output.getvalue()

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
