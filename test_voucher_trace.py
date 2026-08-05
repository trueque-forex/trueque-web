
from backend.database import SessionLocal
from backend.controllers.transaction_controller import TransactionController
from decimal import Decimal
import uuid

db = SessionLocal()
tc = TransactionController()

try:
    tc.create_retail_voucher(
        db=db,
        sender_id='9613090e-556d-4d15-8304-7ec99c8e8055',
        origin_market='US',
        origin_currency='USD',
        destination_market='MX',
        destination_currency='MXN',
        amount_origin=Decimal('20.0'),
        retailer_id='walmart_mx',
        payment_success_token='tok_test_' + str(uuid.uuid4())
    )
except Exception as e:
    import traceback
    traceback.print_exc()

