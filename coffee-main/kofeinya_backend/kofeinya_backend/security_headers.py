from __future__ import annotations

from typing import Callable

from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Дополнительные заголовки безопасности, которых нет/недостаточно в стандартных настройках.
    Не заменяет HTTPS, но снижает риск XSS/утечек и укрепляет изоляцию.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Ограничим доступ к APIs и ресурсам по умолчанию.
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

        # CORP: в dev и при разделённых доменах (API отдельно от фронта) это легко ломает загрузку
        # картинок / медиа. Поэтому включаем только если явно задано в настройках.
        if getattr(settings, "ENABLE_CORP_HEADER", False):
            policy = getattr(settings, "CROSS_ORIGIN_RESOURCE_POLICY", "same-origin")
            response.headers.setdefault("Cross-Origin-Resource-Policy", policy)

        # Защита от утечки через MIME sniffing уже включена SECURE_CONTENT_TYPE_NOSNIFF,
        # но оставим на всякий случай (не переопределяем, если уже задано).
        response.headers.setdefault("X-Content-Type-Options", "nosniff")

        return response

