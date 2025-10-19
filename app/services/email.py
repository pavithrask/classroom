"""Email utility for sending greetings via SMTP."""

import logging
import smtplib
from email.message import EmailMessage
from ..config import get_settings

logger = logging.getLogger(__name__)


def send_email(to_address: str, subject: str, body: str) -> None:
    settings = get_settings()
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to_address
    message["Subject"] = subject
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_username and settings.smtp_password:
                smtp.starttls()
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except Exception as exc:  # pragma: no cover - external dependency
        logger.exception("Failed to send email: %s", exc)
        raise
