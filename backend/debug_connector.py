
import sys
import os
import json

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.connectors.factory import ConnectorFactory

def run_debug():
    factory = ConnectorFactory()
    print("Factory config keys:", factory.full_config.get("countries", {}).keys())
    
    es = factory.get_connector("ES")
    print("ES Config Keys:", es.config.keys())
    print("ES Settlement Days Map:", es.config.get("settlement_days"))
    
    days_t1 = es.get_settlement_days("T1")
    days_t3 = es.get_settlement_days("T3")
    
    print(f"Days T1: {days_t1}")
    print(f"Days T3: {days_t3}")

if __name__ == "__main__":
    run_debug()
