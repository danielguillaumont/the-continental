"""Independent certification records and non-owning links to Skills and Evidence."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.certification_schemas import (
    CertificationEvidenceRead,
    CertificationRead,
    CertificationSkillRead,
    CertificationWrite,
)
from app.database import get_database_session
from app.models import Certification, Evidence, Skill

router = APIRouter(prefix="/certifications", tags=["Certifications"])


def to_read(record: Certification) -> CertificationRead:
    return CertificationRead(
        id=record.id,
        name=record.name,
        issuer=record.issuer,
        credentialId=record.credential_id,
        credentialUrl=record.credential_url,
        issuedAt=record.issued_at,
        expiresAt=record.expires_at,
        description=record.description,
        skills=[CertificationSkillRead(id=skill.id, name=skill.name) for skill in record.skills],
        evidence=[
            CertificationEvidenceRead(
                id=item.id, title=item.title, kind=item.kind, status=item.status,
            ) for item in record.evidence_items
        ],
        createdAt=record.created_at,
        updatedAt=record.updated_at,
    )


def get_or_404(session: Session, certification_id: UUID) -> Certification:
    record = session.get(Certification, certification_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Certification not found.")
    return record


def update_fields(record: Certification, payload: CertificationWrite) -> None:
    record.name = payload.name
    record.issuer = payload.issuer
    record.credential_id = payload.credentialId
    record.credential_url = str(payload.credentialUrl) if payload.credentialUrl else None
    record.issued_at = payload.issuedAt
    record.expires_at = payload.expiresAt
    record.description = payload.description


@router.get("", response_model=list[CertificationRead])
def list_certifications(
    session: Session = Depends(get_database_session),
) -> list[CertificationRead]:
    records = session.scalars(
        select(Certification).order_by(Certification.created_at.desc(), Certification.id)
    ).all()
    return [to_read(item) for item in records]


@router.post("", response_model=CertificationRead, status_code=status.HTTP_201_CREATED)
def create_certification(
    payload: CertificationWrite,
    session: Session = Depends(get_database_session),
) -> CertificationRead:
    record = Certification(name=payload.name, issuer=payload.issuer)
    update_fields(record, payload)
    session.add(record)
    session.commit()
    session.refresh(record)
    return to_read(record)


@router.get("/{certification_id}", response_model=CertificationRead)
def get_certification(
    certification_id: UUID,
    session: Session = Depends(get_database_session),
) -> CertificationRead:
    return to_read(get_or_404(session, certification_id))


@router.put("/{certification_id}", response_model=CertificationRead)
def update_certification(
    certification_id: UUID,
    payload: CertificationWrite,
    session: Session = Depends(get_database_session),
) -> CertificationRead:
    record = get_or_404(session, certification_id)
    update_fields(record, payload)
    session.commit()
    session.refresh(record)
    return to_read(record)


@router.delete("/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    certification_id: UUID,
    session: Session = Depends(get_database_session),
) -> Response:
    session.delete(get_or_404(session, certification_id))
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{certification_id}/skills/{skill_id}", response_model=CertificationRead)
def attach_skill(
    certification_id: UUID,
    skill_id: UUID,
    session: Session = Depends(get_database_session),
) -> CertificationRead:
    record = get_or_404(session, certification_id)
    skill = session.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Skill not found.")
    if skill not in record.skills:
        record.skills.append(skill)
        session.commit()
        session.refresh(record)
    return to_read(record)


@router.delete("/{certification_id}/skills/{skill_id}", response_model=CertificationRead)
def detach_skill(
    certification_id: UUID,
    skill_id: UUID,
    session: Session = Depends(get_database_session),
) -> CertificationRead:
    record = get_or_404(session, certification_id)
    skill = session.get(Skill, skill_id)
    if skill is None or skill not in record.skills:
        raise HTTPException(status_code=404, detail="Skill is not linked to this certification.")
    record.skills.remove(skill)
    session.commit()
    session.refresh(record)
    return to_read(record)


@router.post("/{certification_id}/evidence/{evidence_id}", response_model=CertificationRead)
def attach_evidence(
    certification_id: UUID,
    evidence_id: UUID,
    session: Session = Depends(get_database_session),
) -> CertificationRead:
    record = get_or_404(session, certification_id)
    evidence = session.get(Evidence, evidence_id)
    if evidence is None:
        raise HTTPException(status_code=404, detail="Evidence record not found.")
    if evidence not in record.evidence_items:
        record.evidence_items.append(evidence)
        session.commit()
        session.refresh(record)
    return to_read(record)


@router.delete("/{certification_id}/evidence/{evidence_id}", response_model=CertificationRead)
def detach_evidence(
    certification_id: UUID,
    evidence_id: UUID,
    session: Session = Depends(get_database_session),
) -> CertificationRead:
    record = get_or_404(session, certification_id)
    evidence = session.get(Evidence, evidence_id)
    if evidence is None or evidence not in record.evidence_items:
        raise HTTPException(status_code=404, detail="Evidence is not linked to this certification.")
    record.evidence_items.remove(evidence)
    session.commit()
    session.refresh(record)
    return to_read(record)
