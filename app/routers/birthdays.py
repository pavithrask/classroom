"""Endpoints related to birthday greetings automation."""

from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select

from ..dependencies import get_current_user, get_db
from ..models import EmailJob, Setting, SettingBase, SettingRead
from ..services.birthdays import get_template, schedule_birthday_emails

router = APIRouter(prefix="/api/v1/birthdays", tags=["birthdays"])


@router.post("/run", response_model=list[EmailJob], status_code=status.HTTP_201_CREATED)
def run_birthday_job(
    session: Session = Depends(get_db), user=Depends(get_current_user)
) -> list[EmailJob]:
    teacher_name = user.full_name
    return schedule_birthday_emails(session, teacher_name)


@router.get("/jobs", response_model=list[EmailJob])
def list_email_jobs(session: Session = Depends(get_db), user=Depends(get_current_user)) -> list[EmailJob]:
    del user
    return session.exec(select(EmailJob).order_by(EmailJob.scheduled_for.desc())).all()


@router.get("/settings/template")
def get_birthday_template(session: Session = Depends(get_db), user=Depends(get_current_user)) -> dict[str, str]:
    """Return the active birthday template, falling back to the default copy."""

    del user
    subject, body = get_template(session)
    return {"subject": subject, "body": body}


@router.post("/settings", response_model=SettingRead, status_code=status.HTTP_201_CREATED)
def upsert_setting(setting: SettingBase, session: Session = Depends(get_db), user=Depends(get_current_user)) -> Setting:
    del user
    existing = session.exec(select(Setting).where(Setting.key == setting.key)).first()
    if existing:
        existing.value = setting.value
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    new_setting = Setting(**setting.dict())
    session.add(new_setting)
    session.commit()
    session.refresh(new_setting)
    return new_setting
