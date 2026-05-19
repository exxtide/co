import hashlib
import hmac
import logging
import re
import time

from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import UserProfile
from .phone_auth import send_verification_code
from .serializers import UserPublicSerializer
from .throttling import AuthEndpointThrottle

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    """Нормализует номер телефона к формату +7XXXXXXXXXX"""
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return '+7' + digits
    elif len(digits) == 11 and digits.startswith('8'):
        return '+7' + digits[1:]
    elif len(digits) == 11 and digits.startswith('7'):
        return '+' + digits
    elif len(digits) == 12 and digits.startswith('+7'):
        return digits
    return '+' + digits


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def send_code(request):
    """
    Отправляет код подтверждения на указанный номер телефона.
    Принимает: phone, method (telegram/max)
    """
    phone = request.data.get('phone', '').strip()
    method = request.data.get('method', '').strip().lower()
    
    if not phone:
        return Response(
            {"detail": "Укажите номер телефона."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if method not in ['telegram', 'max']:
        return Response(
            {"detail": "Выберите способ получения кода: telegram или max."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    phone = normalize_phone(phone)
    
    # Ищем или создаём пользователя
    user = User.objects.filter(username=phone).first()
    if not user:
        # Создаём нового пользователя
        user = User.objects.create_user(
            username=phone,
            email='',  # Email пустой, используем телефон
            password=None,  # Пароль не нужен, вход по коду
            is_active=False  # Активируем после подтверждения
        )
    
    # Получаем или создаём профиль
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    # Генерируем новый код
    code = profile.generate_code()
    profile.verification_method = method
    profile.phone = phone
    profile.save()
    
    # Отправляем код (в реальном проекте)
    # Пока возвращаем код в ответе для тестирования
    if settings.DEBUG:
        return Response({
            "detail": "Код отправлен (режим отладки).",
            "phone": phone,
            "method": method,
            "code": code,  # Только для отладки!
        })
    
    # В production отправляем через выбранный сервис
    success = send_verification_code(phone, code, method)
    if not success:
        return Response(
            {"detail": "Не удалось отправить код. Попробуйте другой способ или позже."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    return Response({
        "detail": f"Код отправлен через {method}.",
        "phone": phone,
        "method": method,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def verify_code_and_login(request):
    """
    Проверяет код и выполняет вход/регистрацию.
    Принимает: phone, code
    Возвращает: token, user
    """
    phone = request.data.get('phone', '').strip()
    code = request.data.get('code', '').strip()
    
    if not phone or not code:
        return Response(
            {"detail": "Укажите номер телефона и код."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    phone = normalize_phone(phone)
    
    # Ищем пользователя
    user = User.objects.filter(username=phone).first()
    if not user:
        return Response(
            {"detail": "Пользователь не найден. Запросите код сначала."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Проверяем код
    profile = getattr(user, 'profile', None)
    if not profile:
        return Response(
            {"detail": "Профиль не найден."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not profile.is_code_valid(code):
        return Response(
            {"detail": "Неверный или устаревший код."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Код верный - активируем пользователя и очищаем код
    user.is_active = True
    user.save()
    profile.is_phone_verified = True
    profile.clear_code()
    profile.save()
    
    # Создаём или получаем токен
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        "token": token.key,
        "user": UserPublicSerializer(user).data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Выход - удаляет токен"""
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Информация о текущем пользователе"""
    return Response(UserPublicSerializer(request.user).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Обновление профиля (имя)"""
    first_name = request.data.get('first_name', '').strip()
    if first_name:
        request.user.first_name = first_name
        request.user.save()
    return Response(UserPublicSerializer(request.user).data)


def verify_telegram_auth(data: dict) -> bool:
    """Проверяет подпись данных от Telegram Login Widget"""
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    if not bot_token:
        return False
    
    # Создаём secret key из токена бота
    secret = hashlib.sha256(bot_token.encode()).digest()
    
    # Получаем hash из данных
    check_hash = data.pop('hash', None)
    if not check_hash:
        return False
    
    # Проверяем срок действия auth_date (не старше 24 часов)
    auth_date = int(data.get('auth_date', 0))
    if time.time() - auth_date > 86400:
        return False
    
    # Сортируем данные и создаём строку для проверки
    data_check_string = '\n'.join([f"{k}={v}" for k, v in sorted(data.items())])
    
    # Вычисляем hash
    hmac_hash = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    return hmac_hash == check_hash


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def telegram_login(request):
    """
    Авторизация через Telegram Login Widget.
    Принимает данные от Telegram: id, first_name, last_name, username, photo_url, auth_date, hash
    """
    # Копируем данные для проверки
    data = request.data.copy()
    
    # Проверяем подпись
    if not verify_telegram_auth(data):
        return Response(
            {"detail": "Неверная подпись данных Telegram."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    telegram_id = str(data.get('id'))
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    username = data.get('username', '')
    
    # Ищем пользователя по telegram_id в username
    user = User.objects.filter(username=f"tg_{telegram_id}").first()
    
    if not user:
        # Создаём нового пользователя
        user = User.objects.create_user(
            username=f"tg_{telegram_id}",
            email=f"{telegram_id}@telegram.user" if not username else f"{username}@telegram.user",
            password=None,
            first_name=first_name,
            last_name=last_name,
            is_active=True
        )
        # Создаём профиль
        profile = UserProfile.objects.create(
            user=user,
            phone='',
            is_phone_verified=True  # Через Telegram считаем верифицированным
        )
    else:
        # Обновляем имя если изменилось
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            user.save()
    
    # Создаём или получаем токен
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        "token": token.key,
        "user": UserPublicSerializer(user).data
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def telegram_webhook(request):
    """
    Webhook для получения сообщений от Telegram Bot.
    Сохраняет chat_id пользователей для отправки кодов.
    """
    data = request.data
    
    # Проверяем что это сообщение
    message = data.get('message')
    if not message:
        return Response({"ok": True})
    
    chat_id = message.get('chat', {}).get('id')
    text = message.get('text', '')
    
    if not chat_id:
        return Response({"ok": True})
    
    # Обработка команды /start
    if text.startswith('/start'):
        # Извлекаем номер телефона из команды /start +79991234567
        parts = text.split()
        if len(parts) > 1:
            phone = normalize_phone(parts[1])
            
            # Ищем пользователя по телефону
            user = User.objects.filter(username=phone).first()
            if user:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.telegram_chat_id = chat_id
                profile.save()
                
                # Отправляем подтверждение
                send_telegram_message(chat_id, f"✅ Номер {phone} привязан! Теперь вы будете получать коды подтверждения здесь.")
            else:
                send_telegram_message(chat_id, "❌ Пользователь с таким номером не найден. Сначала запросите код на сайте.")
        else:
            send_telegram_message(
                chat_id,
                "👋 Привет! Я бот для отправки кодов подтверждения.\n\n"
                "Чтобы привязать номер:\n"
                "1. Зайдите на сайт и запросите код\n"
                "2. Отправьте мне команду: /start +79991234567\n\n"
                "(замените +79991234567 на ваш номер)"
            )
    
    return Response({"ok": True})


def send_telegram_message(chat_id: int, text: str) -> bool:
    """Отправляет сообщение через Telegram Bot API"""
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    if not bot_token:
        logger.error("TELEGRAM_BOT_TOKEN не настроен")
        return False
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    try:
        import requests
        response = requests.post(url, json=payload, timeout=10)
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Ошибка отправки сообщения в Telegram: {e}")
        return False
