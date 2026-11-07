"""Single-user Profile REST API. No authentication or tenancy in v0.1."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_database_session
from app.models import Profile
from app.profile_schemas import ProfileRead, ProfileWrite

router = APIRouter(prefix="/profile", tags=["Profile"])
SINGLE_PROFILE_ID = 1


def to_read(profile: Profile) -> ProfileRead:
    return ProfileRead(
        fullName=profile.full_name,
        headline=profile.headline,
        professionalSummary=profile.professional_summary,
        location=profile.location,
        email=profile.email,
        phone=profile.phone,
        websiteUrl=profile.website_url,
        githubUrl=profile.github_url,
        linkedinUrl=profile.linkedin_url,
        targetRoles=profile.target_roles,
        availableFrom=profile.available_from,
        createdAt=profile.created_at,
        updatedAt=profile.updated_at,
    )


def assign_fields(record: Profile, payload: ProfileWrite) -> None:
    record.full_name = payload.fullName
    record.headline = payload.headline
    record.professional_summary = payload.professionalSummary
    record.location = payload.location
    record.email = payload.email
    record.phone = payload.phone
    record.website_url = str(payload.websiteUrl) if payload.websiteUrl else None
    record.github_url = str(payload.githubUrl) if payload.githubUrl else None
    record.linkedin_url = str(payload.linkedinUrl) if payload.linkedinUrl else None
    record.target_roles = list(payload.targetRoles)
    record.available_from = payload.availableFrom


@router.get("", response_model=ProfileRead)
def get_profile(session: Session = Depends(get_database_session)) -> ProfileRead:
    record = session.get(Profile, SINGLE_PROFILE_ID)
    if record is None:
        raise HTTPException(status_code=404, detail="Profile has not been configured.")
    return to_read(record)


@router.put("", response_model=ProfileRead)
def save_profile(
    payload: ProfileWrite,
    session: Session = Depends(get_database_session),
) -> ProfileRead:
    record = session.get(Profile, SINGLE_PROFILE_ID)
    if record is None:
        record = Profile(id=SINGLE_PROFILE_ID, full_name=payload.fullName)
        session.add(record)
    assign_fields(record, payload)
    try:
        session.commit()
    except IntegrityError:
        # A racing first write must not break the singleton invariant.
        session.rollback()
        raise HTTPException(status_code=409, detail="Concurrent profile update; retry.") from None
    session.refresh(record)
    return to_read(record)
