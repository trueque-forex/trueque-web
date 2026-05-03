from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base

# --- DATABASE REGISTRY ---
# We must import the models here so SQLAlchemy "sees" the columns 
# before Base.metadata.create_all is called.
from backend.models.user import User
from backend.models.transaction import Transaction

# --- TRIGGER DATABASE CREATION ---
# This ensures trueque.db is born with the correct tables and columns.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Symmetri API")

# --- MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CORE ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Welcome to Symmetri (Trueque) Backend"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# --- ROUTER REGISTRATION ---
# We removed the prefix here because it is already defined 
# inside each individual router file (like transactions.py).
from backend.routes import quotes, history, offers, trades, transactions, kyc, compliance, admin

app.include_router(quotes.router)
app.include_router(history.router)
app.include_router(offers.router)
app.include_router(trades.router)
app.include_router(transactions.router)
app.include_router(kyc.router)
app.include_router(compliance.router)
app.include_router(admin.router)