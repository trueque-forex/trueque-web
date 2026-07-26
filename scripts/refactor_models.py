import os
import glob

models_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "models")
files = glob.glob(os.path.join(models_dir, "*.py"))

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    new_content = content.replace("user_id = Column", "owner_id = Column")
    new_content = new_content.replace("original_user_id = Column", "original_owner_id = Column")
    new_content = new_content.replace("trueque_id = Column", "symmetri_id = Column")
    
    if new_content != content:
        with open(file_path, "w") as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(file_path)}")

# Fix transaction_controller.py
ctrl_path = os.path.join(os.path.dirname(__file__), "..", "backend", "controllers", "transaction_controller.py")
with open(ctrl_path, "r") as f:
    ctrl_content = f.read()
new_ctrl = ctrl_content.replace("user_id=sender_id", "owner_id=sender_id")
if new_ctrl != ctrl_content:
    with open(ctrl_path, "w") as f:
        f.write(new_ctrl)
    print("Updated transaction_controller.py")
