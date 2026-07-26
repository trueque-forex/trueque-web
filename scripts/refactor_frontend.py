import os
import glob
import re
import shutil

src_dir = os.path.join(os.path.dirname(__file__), "..", "src")

# 1. Rename files safely
def safe_rename(old, new):
    old_path = os.path.join(src_dir, old)
    new_path = os.path.join(src_dir, new)
    if os.path.exists(old_path):
        if os.path.exists(new_path):
            os.remove(new_path)
        os.rename(old_path, new_path)

safe_rename("lib/truequeId.ts", "lib/symmetriId.ts")
safe_rename("lib/truequeId.test.ts", "lib/symmetriId.test.ts")
safe_rename("lib/truequeId.checksum.test.ts", "lib/symmetriId.checksum.test.ts")
safe_rename("server/kyc/issueTruequeId.ts", "server/kyc/issueSymmetriId.ts")
safe_rename("server/kyc/generateTruequeId.ts", "server/kyc/generateSymmetriId.ts")

# 2. Safely regex replace files in src
files = glob.glob(os.path.join(src_dir, "**", "*.ts"), recursive=True) + \
        glob.glob(os.path.join(src_dir, "**", "*.tsx"), recursive=True)

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    new_content = re.sub(r'\btid\b', 'symmetriId', new_content)
    new_content = re.sub(r'\btruequeId\b', 'symmetriId', new_content)
    new_content = re.sub(r'\btrueque_id\b', 'symmetri_id', new_content)
    new_content = new_content.replace('issueTruequeId', 'issueSymmetriId')
    new_content = new_content.replace('generateTruequeId', 'generateSymmetriId')

    if new_content != content:
        # Save to temp file and rename to avoid truncation bugs
        tmp_path = file_path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        shutil.move(tmp_path, file_path)

# Also fix the backend
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
b_files = glob.glob(os.path.join(backend_dir, "**", "*.py"), recursive=True)
for file_path in b_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    new_content = re.sub(r'\btid\b', 'symmetri_id', new_content)
    new_content = re.sub(r'\btrueque_id\b', 'symmetri_id', new_content)
    new_content = re.sub(r'\btruequeId\b', 'symmetriId', new_content)

    if new_content != content:
        tmp_path = file_path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        shutil.move(tmp_path, file_path)

print("Refactor complete.")
