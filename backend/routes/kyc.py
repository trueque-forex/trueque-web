# backend/routes/kyc.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
import json

from ..models.user_kyc import UserKYC, Transaction
from ..models.user import User
from ..database import get_db
from ..services.kyc_service import KYCService
from ..services.file_upload_service import FileUploadService

router = APIRouter(prefix="/api/kyc", tags=["KYC"])

@router.post("/check")
async def check_kyc_requirement(
    user_id: int,
    transaction_amount_usd: float,
    db: Session = Depends(get_db)
):
    """
    Check if user needs to complete KYC before proceeding with transaction
    
    Rules:
    - KYC required after 3 transactions (regardless of amount)
    - KYC required immediately for any transaction >= $150 USD
    """
    try:
        kyc_record = db.query(UserKYC).filter(UserKYC.user_id == user_id).first()
        
        if not kyc_record:
            # Create initial KYC record
            kyc_record = UserKYC(
                user_id=user_id,
                trueque_id=get_user_trueque_id(user_id, db),
                kyc_status='not_required',
                transaction_count=0,
                total_transaction_value_usd=0
            )
            db.add(kyc_record)
            db.commit()
        
        # Check if already approved
        if kyc_record.kyc_status == 'approved':
            return {
                "kyc_required": False,
                "kyc_status": "approved",
                "reason": "KYC already approved"
            }
        
        # Check if transaction >= $150
        if transaction_amount_usd >= 150:
            if kyc_record.kyc_status not in ['approved', 'pending']:
                kyc_record.kyc_status = 'required'
                db.commit()
            
            return {
                "kyc_required": True,
                "kyc_status": kyc_record.kyc_status,
                "reason": "Transaction amount >= $150 USD",
                "transaction_count": kyc_record.transaction_count,
                "transaction_amount": transaction_amount_usd
            }
        
        # Check if 3+ transactions
        if kyc_record.transaction_count >= 3:
            if kyc_record.kyc_status not in ['approved', 'pending']:
                kyc_record.kyc_status = 'required'
                db.commit()
            
            return {
                "kyc_required": True,
                "kyc_status": kyc_record.kyc_status,
                "reason": "Completed 3 or more transactions",
                "transaction_count": kyc_record.transaction_count
            }
        
        return {
            "kyc_required": False,
            "kyc_status": kyc_record.kyc_status,
            "transaction_count": kyc_record.transaction_count,
            "remaining_transactions": 3 - kyc_record.transaction_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking KYC: {str(e)}")


@router.post("/submit")
async def submit_kyc(
    kyc_data: str = Form(...),
    document_front: UploadFile = File(...),
    document_back: Optional[UploadFile] = File(None),
    selfie: UploadFile = File(...),
    proof_of_address: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Submit KYC information with document uploads
    """
    try:
        # Parse KYC data
        data = json.loads(kyc_data)
        user_id = data.get('user_id')
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Get or create KYC record
        kyc_record = db.query(UserKYC).filter(UserKYC.user_id == user_id).first()
        
        if not kyc_record:
            kyc_record = UserKYC(
                user_id=user_id,
                trueque_id=get_user_trueque_id(user_id, db)
            )
            db.add(kyc_record)
        
        # Upload documents to secure storage
        file_service = FileUploadService()
        
        document_front_url = await file_service.upload_kyc_document(
            user_id, 
            "document_front", 
            document_front
        )
        
        document_back_url = None
        if document_back:
            document_back_url = await file_service.upload_kyc_document(
                user_id, 
                "document_back", 
                document_back
            )
        
        selfie_url = await file_service.upload_kyc_document(
            user_id, 
            "selfie", 
            selfie
        )
        
        proof_of_address_url = await file_service.upload_kyc_document(
            user_id, 
            "proof_of_address", 
            proof_of_address
        )
        
        # Update KYC record
        kyc_record.full_legal_name = data.get('fullLegalName')
        kyc_record.date_of_birth = data.get('dateOfBirth')
        kyc_record.nationality = data.get('nationality')
        kyc_record.occupation = data.get('occupation')
        
        kyc_record.street = data.get('street')
        kyc_record.city = data.get('city')
        kyc_record.state = data.get('state')
        kyc_record.postal_code = data.get('postalCode')
        kyc_record.country = data.get('country')
        
        kyc_record.document_type = data.get('documentType')
        kyc_record.document_number = data.get('documentNumber')
        kyc_record.document_issue_date = data.get('documentIssueDate')
        kyc_record.document_expiry_date = data.get('documentExpiryDate')
        kyc_record.document_issuing_country = data.get('documentIssuingCountry')
        
        kyc_record.document_front_url = document_front_url
        kyc_record.document_back_url = document_back_url
        kyc_record.selfie_url = selfie_url
        kyc_record.proof_of_address_url = proof_of_address_url
        
        kyc_record.source_of_funds = data.get('sourceOfFunds')
        kyc_record.purpose_of_transaction = data.get('purposeOfTransaction')
        kyc_record.estimated_monthly_volume = data.get('estimatedMonthlyVolume')
        
        kyc_record.agreed_to_data_processing = data.get('agreedToDataProcessing', False)
        kyc_record.agreed_to_screening = data.get('agreedToScreening', False)
        
        kyc_record.kyc_status = 'pending'
        kyc_record.kyc_submitted_at = datetime.now(timezone.utc)
        
        db.commit()
        
        # Trigger KYC review process (background job)
        # await KYCService.initiate_review(kyc_record.id)
        
        return {
            "success": True,
            "message": "KYC submitted successfully",
            "kyc_status": "pending",
            "estimated_review_time": "24-48 hours"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting KYC: {str(e)}")


@router.get("/status/{user_id}")
async def get_kyc_status(user_id: int, db: Session = Depends(get_db)):
    """
    Get current KYC status for user
    """
    try:
        kyc_record = db.query(UserKYC).filter(UserKYC.user_id == user_id).first()
        
        if not kyc_record:
            return {
                "kyc_status": "not_required",
                "transaction_count": 0,
                "total_transaction_value_usd": 0
            }
        
        return {
            "kyc_status": kyc_record.kyc_status,
            "transaction_count": kyc_record.transaction_count,
            "total_transaction_value_usd": float(kyc_record.total_transaction_value_usd),
            "kyc_submitted_at": kyc_record.kyc_submitted_at.isoformat() if kyc_record.kyc_submitted_at else None,
            "kyc_approved_at": kyc_record.kyc_approved_at.isoformat() if kyc_record.kyc_approved_at else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting KYC status: {str(e)}")


@router.post("/update-transaction-count")
async def update_transaction_count(
    user_id: int,
    transaction_amount_usd: float,
    db: Session = Depends(get_db)
):
    """
    Update user's transaction count after successful transaction
    Called internally after transaction completion
    """
    try:
        kyc_record = db.query(UserKYC).filter(UserKYC.user_id == user_id).first()
        
        if not kyc_record:
            kyc_record = UserKYC(
                user_id=user_id,
                trueque_id=get_user_trueque_id(user_id, db),
                transaction_count=0,
                total_transaction_value_usd=0
            )
            db.add(kyc_record)
        
        kyc_record.transaction_count += 1
        kyc_record.total_transaction_value_usd += transaction_amount_usd
        kyc_record.last_transaction_date = datetime.now(timezone.utc)
        
        db.commit()
        
        return {
            "success": True,
            "transaction_count": kyc_record.transaction_count,
            "total_value": float(kyc_record.total_transaction_value_usd)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating transaction count: {str(e)}")


def get_user_trueque_id(user_id: int, db: Session) -> str:
    """Helper function to get user's Trueque ID"""
    user = db.query(User).filter(User.id == user_id).first()
    return user.trueque_id if user else ""