"""Database engine and session utilities."""

from contextlib import contextmanager
from time import sleep
from typing import Any, Iterator

from sqlalchemy.exc import OperationalError
from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings


settings = get_settings()


def _build_connect_args() -> dict[str, Any]:
    """Construct engine connection arguments based on the configured backend."""

    if settings.database_url.startswith("sqlite"):
        return {"check_same_thread": False}

    if settings.database_sslmode:
        return {"sslmode": settings.database_sslmode}

    return {}


connect_args = _build_connect_args()
engine_kwargs: dict[str, Any] = {
    "echo": False,
    "pool_pre_ping": True,
}

if connect_args:
    engine_kwargs["connect_args"] = connect_args

engine = create_engine(
    settings.database_url,
    **engine_kwargs,
)


def init_db() -> None:
    """Create database tables with retry support for managed services."""

    attempts = 0
    while True:
        try:
            SQLModel.metadata.create_all(engine)
            break
        except OperationalError:
            attempts += 1
            if attempts > settings.database_init_max_retries:
                raise
            sleep(settings.database_init_retry_interval)


@contextmanager
def get_session() -> Iterator[Session]:
    """Provide a transactional scope around a series of operations."""

    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
