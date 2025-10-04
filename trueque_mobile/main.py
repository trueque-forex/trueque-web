from fastapi import FastAPI
from backend.routes.recipients import router as recipients_router

app = FastAPI(
    title="Trueque API",
    description="Orchestration-grade backend for global remittance",
    version="1.0.0"
)

# Include core routes
app.include_router(recipients_router, prefix="/api", tags=["Recipients"])