from uuid import UUID

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Response,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.models import Evidence, Project, Skill
from app.schemas import (
    EvidenceCreate,
    EvidenceRead,
    EvidenceSource,
    EvidenceUpdate,
    EvidenceValidationResponse,
    ProjectEvidenceRead,
    ProjectRead,
    ProjectWrite,
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


def resolve_skills(
    session: Session,
    skill_names: list[str],
) -> list[Skill]:
    normalized_names = [
        skill_name.strip().casefold()
        for skill_name in skill_names
    ]

    statement = select(Skill).where(
        Skill.normalized_name.in_(normalized_names)
    )

    existing_skills = session.scalars(statement).all()

    skills_by_normalized_name = {
        skill.normalized_name: skill
        for skill in existing_skills
    }

    resolved_skills: list[Skill] = []

    for skill_name in skill_names:
        display_name = skill_name.strip()
        normalized_name = display_name.casefold()

        skill = skills_by_normalized_name.get(
            normalized_name
        )

        if skill is None:
            skill = Skill(
                name=display_name,
                normalized_name=normalized_name,
            )

            session.add(skill)

            skills_by_normalized_name[
                normalized_name
            ] = skill

        resolved_skills.append(skill)

    return resolved_skills


def evidence_to_response(
    record: Evidence,
) -> EvidenceRead:
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
        skills=[
            skill.name
            for skill in record.skills
        ],
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
    session: Session = Depends(
        get_database_session
    ),
) -> EvidenceRead:
    record = Evidence(
        kind=evidence.kind,
        title=evidence.title,
        description=evidence.description,
        skills=resolve_skills(
            session,
            evidence.skills,
        ),
        status=evidence.status,
        source_label=(
            evidence.source.label
            if evidence.source
            else None
        ),
        source_url=(
            str(evidence.source.url)
            if evidence.source
            and evidence.source.url
            else None
        ),
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
    session: Session = Depends(
        get_database_session
    ),
) -> EvidenceRead:
    record = session.get(
        Evidence,
        evidence_id,
    )

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
    session: Session = Depends(
        get_database_session
    ),
) -> EvidenceRead:
    record = session.get(
        Evidence,
        evidence_id,
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence record not found.",
        )

    record.kind = evidence.kind
    record.title = evidence.title
    record.description = evidence.description
    record.skills = resolve_skills(
        session,
        evidence.skills,
    )
    record.status = evidence.status
    record.source_label = (
        evidence.source.label
        if evidence.source
        else None
    )
    record.source_url = (
        str(evidence.source.url)
        if evidence.source
        and evidence.source.url
        else None
    )
    record.occurred_at = evidence.occurredAt

    session.commit()
    session.refresh(record)

    return evidence_to_response(record)


@app.delete(
    "/evidence/{evidence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Evidence"],
)
def delete_evidence(
    evidence_id: UUID,
    session: Session = Depends(
        get_database_session
    ),
) -> Response:
    record = session.get(
        Evidence,
        evidence_id,
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence record not found.",
        )

    session.delete(record)
    session.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


@app.get(
    "/evidence",
    response_model=list[EvidenceRead],
    tags=["Evidence"],
)
def list_evidence(
    session: Session = Depends(
        get_database_session
    ),
) -> list[EvidenceRead]:
    statement = select(Evidence).order_by(
        Evidence.created_at.desc()
    )

    records = session.scalars(
        statement
    ).all()

    return [
        evidence_to_response(record)
        for record in records
    ]

# Projects group multiple independent evidence records. Deleting a project
# never removes its underlying evidence or skills.
def project_to_response(record: Project) -> ProjectRead:
    return ProjectRead(
        id=record.id,
        name=record.name,
        summary=record.summary,
        repositoryUrl=record.repository_url,
        status=record.status,
        evidence=[
            ProjectEvidenceRead(
                id=item.id,
                title=item.title,
                kind=item.kind,
                status=item.status,
            )
            for item in record.evidence_items
        ],
        createdAt=record.created_at,
        updatedAt=record.updated_at,
    )


def get_project_or_404(session: Session, project_id: UUID) -> Project:
    record = session.get(Project, project_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    return record


@app.get("/projects", response_model=list[ProjectRead], tags=["Projects"])
def list_projects(
    session: Session = Depends(get_database_session),
) -> list[ProjectRead]:
    records = session.scalars(
        select(Project).order_by(Project.created_at.desc(), Project.id)
    ).all()
    return [project_to_response(record) for record in records]


@app.post(
    "/projects",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Projects"],
)
def create_project(
    payload: ProjectWrite,
    session: Session = Depends(get_database_session),
) -> ProjectRead:
    record = Project(
        name=payload.name,
        summary=payload.summary,
        repository_url=str(payload.repositoryUrl) if payload.repositoryUrl else None,
        status=payload.status,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return project_to_response(record)


@app.get("/projects/{project_id}", response_model=ProjectRead, tags=["Projects"])
def get_project(
    project_id: UUID,
    session: Session = Depends(get_database_session),
) -> ProjectRead:
    return project_to_response(get_project_or_404(session, project_id))


@app.put("/projects/{project_id}", response_model=ProjectRead, tags=["Projects"])
def update_project(
    project_id: UUID,
    payload: ProjectWrite,
    session: Session = Depends(get_database_session),
) -> ProjectRead:
    record = get_project_or_404(session, project_id)
    record.name = payload.name
    record.summary = payload.summary
    record.repository_url = str(payload.repositoryUrl) if payload.repositoryUrl else None
    record.status = payload.status
    session.commit()
    session.refresh(record)
    return project_to_response(record)


@app.delete(
    "/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Projects"],
)
def delete_project(
    project_id: UUID,
    session: Session = Depends(get_database_session),
) -> Response:
    record = get_project_or_404(session, project_id)
    session.delete(record)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    "/projects/{project_id}/evidence/{evidence_id}",
    response_model=ProjectRead,
    tags=["Projects"],
)
def attach_project_evidence(
    project_id: UUID,
    evidence_id: UUID,
    session: Session = Depends(get_database_session),
) -> ProjectRead:
    record = get_project_or_404(session, project_id)
    evidence = session.get(Evidence, evidence_id)
    if evidence is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence record not found.",
        )
    if evidence not in record.evidence_items:
        record.evidence_items.append(evidence)
        session.commit()
        session.refresh(record)
    return project_to_response(record)


@app.delete(
    "/projects/{project_id}/evidence/{evidence_id}",
    response_model=ProjectRead,
    tags=["Projects"],
)
def detach_project_evidence(
    project_id: UUID,
    evidence_id: UUID,
    session: Session = Depends(get_database_session),
) -> ProjectRead:
    record = get_project_or_404(session, project_id)
    evidence = session.get(Evidence, evidence_id)
    if evidence is None or evidence not in record.evidence_items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence is not linked to this project.",
        )
    record.evidence_items.remove(evidence)
    session.commit()
    session.refresh(record)
    return project_to_response(record)
