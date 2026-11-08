"""Raw opportunity registry for Dossier. Extraction is a separate future slice."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.models import Opportunity, OpportunityAttribution, Requirement
from app.opportunity_schemas import (
    OpportunityCreate,
    OpportunityAttributionRead,
    OpportunityRead,
    OpportunityWrite,
    RequirementRead,
    RequirementWrite,
)

router = APIRouter(prefix="/opportunities", tags=["Dossier / Opportunities"])


def get_or_404(session: Session, opportunity_id: UUID) -> Opportunity:
    record = session.get(Opportunity, opportunity_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    return record


def get_requirement_or_404(
    session: Session, opportunity_id: UUID, requirement_id: UUID,
) -> Requirement:
    record = session.scalar(
        select(Requirement).where(
            Requirement.id == requirement_id,
            Requirement.opportunity_id == opportunity_id,
        )
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Requirement not found in this opportunity.")
    return record


def assign_metadata(record: Opportunity, payload: OpportunityWrite) -> None:
    record.title = payload.title
    record.company = payload.company
    record.location = payload.location
    record.employment_type = payload.employmentType
    record.salary_text = payload.salaryText
    record.source_url = str(payload.sourceUrl) if payload.sourceUrl else None
    record.technologies = list(payload.technologies)


def requirement_to_read(record: Requirement) -> RequirementRead:
    return RequirementRead(
        id=record.id,
        text=record.text,
        kind=record.kind,
        sourceExcerpt=record.source_excerpt,
        position=record.position,
        createdAt=record.created_at,
        updatedAt=record.updated_at,
    )


def to_read(record: Opportunity) -> OpportunityRead:
    return OpportunityRead(
        id=record.id,
        title=record.title,
        company=record.company,
        location=record.location,
        employmentType=record.employment_type,
        salaryText=record.salary_text,
        sourceUrl=record.source_url,
        technologies=record.technologies,
        sourceText=record.source_text,
        extractionProvider=record.extraction_provider,
        extractionModel=record.extraction_model,
        extractionPromptVersion=record.extraction_prompt_version,
        extractionStatus=record.extraction_status,
        requirements=[requirement_to_read(item) for item in record.requirements],
        attributions=[
            OpportunityAttributionRead(
                id=item.id, kind=item.kind, field=item.field_name,
                value=item.value, sourceExcerpt=item.source_excerpt,
                sourceSha256=item.source_sha256, createdAt=item.created_at,
            )
            for item in record.attributions
        ],
        createdAt=record.created_at,
        updatedAt=record.updated_at,
    )


def ensure_excerpt_in_source(record: Opportunity, excerpt: str | None) -> None:
    if excerpt is not None and excerpt not in record.source_text:
        raise HTTPException(
            status_code=422,
            detail="sourceExcerpt must be an exact substring of the saved original job text.",
        )


@router.get("", response_model=list[OpportunityRead])
def list_opportunities(
    session: Session = Depends(get_database_session),
) -> list[OpportunityRead]:
    records = session.scalars(
        select(Opportunity).order_by(Opportunity.created_at.desc(), Opportunity.id)
    ).all()
    return [to_read(record) for record in records]


@router.post("", response_model=OpportunityRead, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    payload: OpportunityCreate,
    session: Session = Depends(get_database_session),
) -> OpportunityRead:
    record = Opportunity(source_text=payload.sourceText)
    assign_metadata(record, payload)
    session.add(record)
    session.commit()
    session.refresh(record)
    return to_read(record)


@router.get("/{opportunity_id}", response_model=OpportunityRead)
def get_opportunity(
    opportunity_id: UUID, session: Session = Depends(get_database_session),
) -> OpportunityRead:
    return to_read(get_or_404(session, opportunity_id))


@router.put("/{opportunity_id}", response_model=OpportunityRead)
def update_opportunity(
    opportunity_id: UUID, payload: OpportunityWrite,
    session: Session = Depends(get_database_session),
) -> OpportunityRead:
    record = get_or_404(session, opportunity_id)
    assign_metadata(record, payload)
    # Manual edits can supersede a previously approved value. Never leave a
    # source attribution attached to a different value after a manual PUT.
    metadata_columns = {
        "title": "title", "company": "company", "location": "location",
        "employmentType": "employment_type", "salaryText": "salary_text",
    }
    for citation in list(record.attributions):
        if citation.kind == "metadata":
            current = getattr(record, metadata_columns.get(citation.field_name, ""), None)
            if current != citation.value:
                session.delete(citation)
        elif citation.kind == "technology" and citation.value not in (record.technologies or []):
            session.delete(citation)
    session.commit()
    session.expire_all()
    fresh = get_or_404(session, opportunity_id)
    return to_read(fresh)


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: UUID, session: Session = Depends(get_database_session),
) -> Response:
    session.delete(get_or_404(session, opportunity_id))
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{opportunity_id}/requirements", response_model=RequirementRead,
    status_code=status.HTTP_201_CREATED,
)
def add_requirement(
    opportunity_id: UUID, payload: RequirementWrite,
    session: Session = Depends(get_database_session),
) -> RequirementRead:
    record = get_or_404(session, opportunity_id)
    ensure_excerpt_in_source(record, payload.sourceExcerpt)
    # Explicit numeric positions permit later drag-and-drop reordering without
    # changing the stable requirement ID.
    last_position = session.scalar(
        select(func.max(Requirement.position)).where(
            Requirement.opportunity_id == opportunity_id,
        )
    )
    requirement = Requirement(
        opportunity_id=opportunity_id,
        position=(last_position if last_position is not None else -1) + 1,
        text=payload.text,
        kind=payload.kind,
        source_excerpt=payload.sourceExcerpt,
    )
    session.add(requirement)
    session.commit()
    session.refresh(requirement)
    return requirement_to_read(requirement)


@router.put("/{opportunity_id}/requirements/{requirement_id}", response_model=RequirementRead)
def update_requirement(
    opportunity_id: UUID, requirement_id: UUID, payload: RequirementWrite,
    session: Session = Depends(get_database_session),
) -> RequirementRead:
    record = get_or_404(session, opportunity_id)
    item = get_requirement_or_404(session, opportunity_id, requirement_id)
    ensure_excerpt_in_source(record, payload.sourceExcerpt)
    item.text = payload.text
    item.kind = payload.kind
    item.source_excerpt = payload.sourceExcerpt
    session.commit()
    session.refresh(item)
    return requirement_to_read(item)


@router.delete(
    "/{opportunity_id}/requirements/{requirement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_requirement(
    opportunity_id: UUID, requirement_id: UUID,
    session: Session = Depends(get_database_session),
) -> Response:
    get_or_404(session, opportunity_id)
    item = get_requirement_or_404(session, opportunity_id, requirement_id)
    session.delete(item)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
