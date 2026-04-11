# backend/services/file_upload_service.py
from fastapi import UploadFile
import os
import uuid
from datetime import datetime

class FileUploadService:
    """
    Service for securely uploading and storing KYC documents
    In production, use AWS S3, Google Cloud Storage, or similar
    """
    
    def __init__(self):
        self.base_path = os.getenv('KYC_STORAGE_PATH', './kyc_documents')
        os.makedirs(self.base_path, exist_ok=True)
    
    async def upload_kyc_document(
        self, 
        user_id: int, 
        document_type: str, 
        file: UploadFile
    ) -> str:
        """
        Upload KYC document to secure storage
        Returns the storage URL/path
        """
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        unique_filename = f"{user_id}_{document_type}_{uuid.uuid4()}.{file_extension}"
        
        # Create user-specific directory
        user_dir = os.path.join(self.base_path, str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        
        file_path = os.path.join(user_dir, unique_filename)
        
        # Save file
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        # In production, encrypt the file and return cloud storage URL
        # For now, return relative path
        return f"/kyc_documents/{user_id}/{unique_filename}"