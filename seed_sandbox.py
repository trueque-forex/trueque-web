import json
import uuid
from sqlalchemy import create_engine, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_URL = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
CONFIG_PATH = 'backend/config/corridor_config.json'

def seed_sandbox():
    logger.info("Starting Universal Sandbox Seeder...")
    
    # Load configuration
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        return

    # Extract all retailers across all countries
    retailers = []
    countries = config.get('countries', {})
    for country_code, country_data in countries.items():
        if 'retailers' in country_data:
            for r in country_data['retailers']:
                retailers.append({
                    'id': r['id'],
                    'name': r['name'],
                    'country': country_code
                })
    
    if not retailers:
        logger.warning("No retailers found in corridor_config.json")
        return

    logger.info(f"Found {len(retailers)} retailers to seed.")
    
    engine = create_engine(DB_URL)
    
    denominations = [20.00, 50.00, 100.00, 200.00]
    vouchers_per_denom = 50

    try:
        with engine.begin() as conn:
            for r in retailers:
                r_id = r['id']
                r_name = r['name']
                
                # 1. Upsert Retailer
                conn.execute(text("""
                    INSERT INTO retailers (id, name) 
                    VALUES (:id, :name)
                    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
                """), {"id": r_id, "name": r_name})
                
                # 2. Upsert Synthetic Liquidity
                conn.execute(text("""
                    INSERT INTO synthetic_liquidity (retailer_id, available_balance, currency)
                    VALUES (:id, 1000000.00, 'USD')
                    ON CONFLICT (retailer_id) DO UPDATE SET available_balance = 1000000.00
                """), {"id": r_id})
                
                # 3. Insert Vouchers
                for denom in denominations:
                    for _ in range(vouchers_per_denom):
                        barcode = str(uuid.uuid4()).replace('-', '')[:15].upper()
                        conn.execute(text("""
                            INSERT INTO inventory_vouchers 
                            (id, retailer_id, value_amount, currency, barcode_data, is_allocated, is_voided) 
                            VALUES (gen_random_uuid(), :id, :amount, 'USD', :barcode, false, false)
                        """), {"id": r_id, "amount": denom, "barcode": barcode})
                
                logger.info(f"Seeded retailer: {r_name} ({r_id}) - Liquidity & {len(denominations) * vouchers_per_denom} Vouchers")
                
        logger.info("Sandbox completely seeded successfully! Symmetri is ready for all Phase 1 demos.")
        
    except Exception as e:
        logger.error(f"Database seeding failed: {e}")

if __name__ == "__main__":
    seed_sandbox()
