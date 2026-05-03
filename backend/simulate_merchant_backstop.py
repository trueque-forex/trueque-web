import logging
import sys
import os
from decimal import Decimal
from datetime import datetime, timedelta, timezone

# Fix imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend.models.user_model import User
from backend.models.internal_wallet_model import InternalWallet
from backend.models.transaction import Transaction
from backend.services.match_service import MatchService
from backend.services.compliance_reporting import ComplianceReportingService

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def run_simulation():
    # 1. Setup In-Memory DB
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    logger.info("Initializing Simulation...")

    # 2. Create Users
    joao = User(
        email="joao@test.com", 
        full_name="Joao Sender", 
        country="ES", 
        user_type="PEER", 
        kyc_tier=1,
        kyc_status="APPROVED"
    )
    oxxo = User(
        email="oxxo@official.mx", 
        full_name="OXXO Official", 
        country="MX", 
        user_type="MERCHANT", 
        kyc_tier=2,
        kyc_status="APPROVED"
    )
    db.add(joao)
    db.add(oxxo)
    db.commit()
    
    # 3. Create OXXO Wallet
    oxxo_wallet = InternalWallet(user_id=oxxo.id, currency="MXN", balance=0)
    db.add(oxxo_wallet)
    db.commit()
    
    logger.info(f"Users Created: Joao (ID={joao.id}), OXXO (ID={oxxo.id})")

    # 4. Initiate Match (ES -> MX)
    match_service = MatchService()
    amount_eur = 154.27
    match_id = "MATCH-SIM-001"
    
    # Manually create match with OLD timestamp to force timeout
    match_service.matches[match_id] = {
        "id": match_id,
        "created_at": datetime.now(timezone.utc) - timedelta(minutes=3), # > 2 min
        "status": "PENDING",
        "user_a": {"id": joao.id, "status": "PENDING_FUNDING"},
        "user_b": {"id": "WAITING", "status": "PENDING_FUNDING"}, # No Peer found
        "amount": amount_eur,
        "currency": "EUR",
        "payouts_triggered": False
    }
    
    logger.info(f"Match {match_id} created with T-3 minutes.")

    # 5. Check Backstop (Simulate Timer)
    match = match_service.check_and_convert_to_merchant(match_id)
    if match and match["status"] == "MERCHANT_BACKSTOP":
        logger.info("TIMEOUT SUCCESS: Match converted to MERCHANT_BACKSTOP.")
        logger.info(f"Merchant Options: {match.get('merchant_options')}")
    else:
        logger.error("TIMEOUT FAILED: Match did not convert.")
        sys.exit(1)

    # 6. Fulfill Voucher (Handshake)
    logger.info("Simulating Voucher Redemption...")
    try:
        match_service.fulfill_merchant_voucher(match_id, oxxo.id, db)
    except Exception as e:
        logger.exception("Fulfillment Failed")
        sys.exit(1)
    
    # 7. Verify Ledger (Wallet)
    db.refresh(oxxo_wallet)
    expected_mxn = (154.27 - 2.50) * 21.00 # 3187.17
    # Note: match_service logic used 2.50 EUR fee and 21.00 rate in my implementation
    
    logger.info(f"OXXO Wallet Balance: {oxxo_wallet.balance} MXN")
    
    if abs(float(oxxo_wallet.balance) - expected_mxn) < 0.01:
        logger.info("LEDGER CHECK: SUCCESS (Balance matches expectation)")
    else:
        logger.error(f"LEDGER CHECK: FAILED. Expected {expected_mxn}, Got {oxxo_wallet.balance}")

    # 8. Verify Transaction Record
    txn = db.query(Transaction).filter_by(beneficiary_id=oxxo.id).first()
    if txn:
        calc_received = float(txn.amount) * float(txn.rate)
        logger.info(f"Transaction Found: {txn.amount} EUR -> {calc_received} {txn.to_currency}")
    else:
        logger.error("Transaction Record NOT found.")

    # 9. Generate Compliance Report
    logger.info("Generating Compliance Report...")
    reporting = ComplianceReportingService(db)
    csv_output = reporting.generate_csv_report()
    
    logger.info("--- CSV OUTPUT ---")
    logger.info(csv_output.strip())
    logger.info("------------------")

    # 10. Verify CSV Content
    if "OXXO Official" in csv_output:
        logger.info("REPORT CHECK: SUCCESS (Merchant Name found)")
    else:
        logger.error("REPORT CHECK: FAILED (Merchant Name MISSING)")
        
    if "127.0.0.1" in csv_output:
         logger.info("REPORT CHECK: SUCCESS (IP Address found)")
         
    if "FAMILY_SUPPORT" in csv_output:
         logger.info("REPORT CHECK: SUCCESS (Remittance Purpose found)")

if __name__ == "__main__":
    run_simulation()
