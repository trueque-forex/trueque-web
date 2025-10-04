import json
import os

AUDIT_FILE = "audit_log.json"

def load_audit_log(path):
    if not os.path.exists(path):
        print(f"❌ Audit log not found: {path}")
        return None
    with open(path, "r") as f:
        return json.load(f)

def print_audit_summary(data):
    print("🧾 Audit Summary:")
    print("----------------")
    print(f"Transaction ID:      {data.get('transaction_id')}")
    print(f"Timestamp:           {data.get('timestamp')}")
    print(f"Corridor:            {data.get('corridor')}")
    print(f"SLA Breach:          {data.get('sla_breach')}")
    print(f"Fee Exceeded:        {data.get('fee_exceeded')}")
    print(f"Fallback Triggered:  {data.get('fallback_triggered')}")
    print(f"Dignity Preserved:   {data.get('user_dignity_preserved')}")
    print(f"Notes:               {data.get('notes')}")

if __name__ == "__main__":
    audit_data = load_audit_log(AUDIT_FILE)
    if audit_data:
        print_audit_summary(audit_data)