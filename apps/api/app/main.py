from fastapi import FastAPI

from app.schemas import EvidenceCreate, EvidenceValidationResponse


APP_NAME = "The Continental API"
APP_VERSION = "0.1.0"


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend API for The Continental career intelligence platform.",
)


@app.get(
    "/health",
    tags=["System"],
)
def health() -> dict[str, str]:
    return {
        "status": "ok",
    }


@app.get(
    "/version",
    tags=["System"],
)
def version() -> dict[str, str]:
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
    }


@app.post(
    "/evidence/validate",
    response_model=EvidenceValidationResponse,
    tags=["Evidence"],
)
def validate_evidence(
    evidence: EvidenceCreate,
) -> EvidenceValidationResponse:
    return EvidenceValidationResponse(
        evidence=evidence,
    )