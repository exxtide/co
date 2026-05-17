import logging

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .email_utils import send_verification_email
from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    UserPublicSerializer,
    VerifyEmailSerializer,
)
from .throttling import AuthEndpointThrottle, ResendVerificationThrottle

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def register(request):
    ser = RegisterSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user = ser.save()
    try:
        send_verification_email(user)
    except Exception:
        logger.exception("Не удалось отправить письмо подтверждения")
        user.delete()
        return Response(
            {"detail": "Не удалось отправить письмо. Проверьте настройки почты сервера."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(
        {
            "detail": "На ваш email отправлена ссылка для подтверждения.",
            "email": user.email,
            "needs_verification": True,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def login_view(request):
    ser = LoginSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    email = ser.validated_data["email"].lower().strip()
    password = ser.validated_data["password"]
    # Ищем по username (для зарегистрированных через API) или по email (для суперпользователей)
    user = User.objects.filter(username__iexact=email).first()
    if user is None:
        user = User.objects.filter(email__iexact=email).first()
    if user is None:
        return Response(
            {"detail": "Неверный email или пароль."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not user.is_active:
        return Response(
            {
                "detail": "Подтвердите email — перейдите по ссылке из письма.",
                "code": "email_not_verified",
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    user = authenticate(request, username=user.username, password=password)
    if user is None:
        return Response(
            {"detail": "Неверный email или пароль."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserPublicSerializer(user).data})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def verify_email(request):
    ser = VerifyEmailSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    uidb64 = ser.validated_data["uid"]
    token = ser.validated_data["token"]
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response(
            {"detail": "Некорректная ссылка подтверждения."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if user.is_active:
        return Response({"detail": "Email уже подтверждён.", "already_verified": True})
    if not default_token_generator.check_token(user, token):
        return Response(
            {"detail": "Ссылка недействительна или устарела. Запросите новое письмо."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.is_active = True
    user.save(update_fields=["is_active"])
    return Response({"detail": "Email успешно подтверждён.", "verified": True})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ResendVerificationThrottle])
def resend_verification(request):
    ser = ResendVerificationSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    email = ser.validated_data["email"].lower().strip()
    user = User.objects.filter(username__iexact=email).first()
    msg = {"detail": "Если этот email зарегистрирован, мы отправили письмо."}
    if user is None or user.is_active:
        return Response(msg)
    try:
        send_verification_email(user)
    except Exception:
        logger.exception("Повторная отправка письма не удалась")
        return Response(
            {"detail": "Не удалось отправить письмо. Попробуйте позже."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(msg)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserPublicSerializer(request.user).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    ser = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(UserPublicSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    ser = PasswordChangeSerializer(data=request.data, context={"request": request})
    ser.is_valid(raise_exception=True)
    user = request.user
    if not user.check_password(ser.validated_data["old_password"]):
        return Response(
            {"old_password": ["Неверный текущий пароль."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.set_password(ser.validated_data["new_password"])
    user.save()
    Token.objects.filter(user=user).delete()
    return Response(
        {"detail": "Пароль изменён. Войдите снова с новым паролем."},
        status=status.HTTP_200_OK,
    )
