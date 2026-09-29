from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.models import Evidence
from app.schemas import (
    EvidenceCreate,
    EvidenceRead,
    EvidenceSource,
    EvidenceUpdate,
    EvidenceValidationResponse,
)


APP_NAME = "The Continental API"
APP_VERSION = "0.1.0"


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend API for The Continental career intelligence platform.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
    "/evidence/{evidence_id}",
    response_model=EvidenceRead,
    tags=["Evidence"],
)
def get_evidence(
    evidence_id: UUID,
    session: Session = Depends(get_database_session),
) -> EvidenceRead:
    record = session.get(Evidence, evidence_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence record not found.",
        )

    return evidence_to_response(record)


@app.put(
    "/evidence/{evidence_id}",
    response_model=EvidenceRead,
    tags=["Evidence"],
)
def update_evidence(
    evidence_id: UUID,
    evidence: EvidenceUpdate,
    session: Session = Depends(get_database_session),
) -> EvidenceRead:
    record = session.get(Evidence, evidence_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence record not found.",
        )

    record.kind = evidence.kind
    record.title = evidence.title
    record.description = evidence.description
    record.skills = evidence.skills
    record.status = evidence.status
    record.source_label = (
        evidence.source.label
        if evidence.source
        else None
    )
    record.source_url = (
        str(evidence.source.url)
        if evidence.source and evidence.source.url
        else None
    )
    record.occurred_at = evidence.occurredAt

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