"""Отправка писем подтверждения регистрации."""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

User = get_user_model()


def build_email_verification_link(user) -> str:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    base = getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")
    return f"{base}/verify-email?uid={uid}&token={token}"


def send_verification_email(user) -> None:
    link = build_email_verification_link(user)
    subject = "Подтвердите регистрацию — Понятная еда"
    body = (
        "Здравствуйте!\n\n"
        "Для подтверждения email перейдите по ссылке:\n"
        f"{link}\n\n"
        "Если вы не регистрировались, проигнорируйте это письмо.\n"
    )
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
