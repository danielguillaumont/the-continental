from fastapi import Depends, FastAPI, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.models import Evidence
from app.schemas import (
    EvidenceCreate,
    EvidenceRead,
    EvidenceSource,
    EvidenceValidationResponse,
)


APP_NAME = "The Continental API"
APP_VERSION = "0.1.0"


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend API for The Continental career intelligence platform.",
)


def evidence_to_response(record: Evidence) -> EvidenceRead:
    source: EvidenceSource | None = None

    if record.source_label is not None:
        source = EvidenceSource(
            label=record.source_label,
            url=record.source_url,
        )

    return EvidenceRead(
        id=record.id,
        kind=record.kind,
        title=record.title,
        description=record.description,
        skills=record.skills,
        status=record.status,
        source=source,
        occurredAt=record.occurred_at,
        createdAt=record.created_at,
        updatedAt=record.updated_at,
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


@app.post(
    "/evidence",
    response_model=EvidenceRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Evidence"],
)
def create_evidence(
    evidence: EvidenceCreate,
    session: Session = Depends(get_database_session),
) -> EvidenceRead:
    record = Evidence(
        kind=evidence.kind,
        title=evidence.title,
        description=evidence.description,
        skills=evidence.skills,
        status=evidence.status,
        source_label=evidence.source.label if evidence.source else None,
        source_url=str(evidence.source.url)
        if evidence.source and evidence.source.url
        else None,
        occurred_at=evidence.occurredAt,
    )

    session.add(record)
    session.commit()
    session.refresh(record)

    return evidence_to_response(record)


@app.get(
    "/evidence",
    response_model=list[EvidenceRead],
    tags=["Evidence"],
)
def list_evidence(
    session: Session = Depends(get_database_session),
) -> list[EvidenceRead]:
    statement = select(Evidence).order_by(Evidence.created_at.desc())
    records = session.scalars(statement).all()

    return [
        evidence_to_response(record)
        for record in records
    ]