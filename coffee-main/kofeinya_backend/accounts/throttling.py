from rest_framework.throttling import AnonRateThrottle


class AuthEndpointThrottle(AnonRateThrottle):
    """Логин и регистрация — по IP."""

    rate = "20/minute"


class ResendVerificationThrottle(AnonRateThrottle):
    """Повторная отправка письма подтверждения — строже."""

    rate = "5/hour"
