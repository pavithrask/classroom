"""Database engine and session utilities."""

from contextlib import contextmanager
import logging
from time import sleep
from typing import Any, Iterator

from sqlalchemy.exc import OperationalError
from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings


logger = logging.getLogger(__name__)
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

    for attempt in range(1, settings.database_init_max_retries + 1):
        try:
            SQLModel.metadata.create_all(engine)
        except OperationalError as exc:  # pragma: no cover - requires unavailable DB
            wait = settings.database_init_retry_interval * (
                settings.database_init_backoff_factor ** (attempt - 1)
            )
            logger.warning(
                "Database initialization failed (attempt %s/%s): %s",  # pragma: no cover - logging side effect
                attempt,
                settings.database_init_max_retries,
                exc,
            )
            if attempt == settings.database_init_max_retries:
                raise
            sleep(wait)
        else:
            if attempt > 1:
                logger.info("Database initialization succeeded after %s attempts", attempt)
            break


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
