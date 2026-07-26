import csv
import os
import sys

# Ensure the backend module can be found if running from the root or scripts directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models.inventory_model import InventoryVoucher

# Ensure tables exist before trying to insert into them
Base.metadata.create_all(bind=engine)

# Define the path to your secure CSV file
CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), "barcodes.csv")

def seed_inventory_vault():
    db: Session = SessionLocal()
    
    try:
        with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            added_count = 0
            skipped_count = 0
            
            for row in reader:
                # 1. Check for duplicates to prevent double-spending risks
                existing_voucher = db.query(InventoryVoucher).filter(
                    InventoryVoucher.barcode_data == row['barcode_data']
                ).first()
                
                if existing_voucher:
                    skipped_count += 1
                    continue
                
                # 2. Stage the new inventory
                new_voucher = InventoryVoucher(
                    retailer_id=row['retailer_id'],      # e.g., 'BODEGA_AURRERA_MX'
                    value_amount=row['value_amount'],    # e.g., 100.00
                    currency=row['currency'],            # e.g., 'USD'
                    barcode_data=row['barcode_data']     # e.g., '123456789012345'
                )
                db.add(new_voucher)
                added_count += 1
                
            # 3. Commit the vault transaction
            db.commit()
            print(f"SUCCESS: Vault seeded. Added {added_count} new vouchers. Skipped {skipped_count} duplicates.")
            
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to seed vault. Transaction rolled back. Details: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_inventory_vault()
