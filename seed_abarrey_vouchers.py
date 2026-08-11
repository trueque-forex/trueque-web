import uuid
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres')
with engine.begin() as conn:
    for i in range(50):
        barcode = str(uuid.uuid4()).replace('-', '')[:15].upper()
        conn.execute(text("""
            INSERT INTO inventory_vouchers 
            (id, retailer_id, value_amount, currency, barcode_data, is_allocated, is_voided) 
            VALUES (gen_random_uuid(), 'abarrey', 100.00, 'USD', :barcode, false, false)
        """), {'barcode': barcode})
    print('Inserted 50 vouchers for Abarrey')
