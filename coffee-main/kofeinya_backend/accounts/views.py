import hashlib
import hmac
import logging
import re
import time
import secrets
import requests
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
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

# Telegram Bot Service API
TELEGRAM_BOT_API_URL = getattr(settings, 'TELEGRAM_BOT_SERVICE_URL', 'http://localhost:5000')
TELEGRAM_BOT_API_SECRET = getattr(settings, 'TELEGRAM_BOT_API_SECRET', 'your-secret-key-here')


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
def register(request):
    """
    Регистрация нового пользователя.
    Принимает: first_name, phone, password, password_confirm
    """
    first_name = request.data.get('first_name', '').strip()
    phone = request.data.get('phone', '').strip()
    password = request.data.get('password', '')
    password_confirm = request.data.get('password_confirm', '')
    
    # Валидация
    if not first_name:
        return Response(
            {"detail": "Укажите имя."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not phone:
        return Response(
            {"detail": "Укажите номер телефона."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    phone = normalize_phone(phone)
    
    # Проверяем что номер не занят
    if User.objects.filter(username=phone).exists():
        return Response(
            {"detail": "Пользователь с таким номером уже зарегистрирован."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(password) < 8:
        return Response(
            {"detail": "Пароль должен быть не менее 8 символов."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if password != password_confirm:
        return Response(
            {"detail": "Пароли не совпадают."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Создаём пользователя
    user = User.objects.create_user(
        username=phone,
        email='',  # Email пустой, используем телефон
        password=password,
        first_name=first_name,
        is_active=True
    )
    
    # Создаём профиль
    UserProfile.objects.create(
        user=user,
        phone=phone,
        is_phone_verified=True
    )
    
    # Создаём токен
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        "token": token.key,
        "user": UserPublicSerializer(user).data
    })


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def login(request):
    """
    Вход по номеру телефона и паролю.
    Принимает: phone, password
    Возвращает: token, user
    """
    phone = request.data.get('phone', '').strip()
    password = request.data.get('password', '')
    
    if not phone or not password:
        return Response(
            {"detail": "Укажите номер телефона и пароль."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    phone = normalize_phone(phone)
    
    # Аутентификация
    user = authenticate(username=phone, password=password)
    
    if not user:
        return Response(
            {"detail": "Неверный номер телефона или пароль."},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {"detail": "Аккаунт деактивирован."},
            status=status.HTTP_403_FORBIDDEN
        )
    
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


# ==================== Telegram Регистрация ====================

def telegram_bot_api_request(endpoint: str, method: str = 'GET', data: dict = None) -> dict:
    """Вспомогательная функция для запросов к Telegram Bot Service"""
    url = f"{TELEGRAM_BOT_API_URL}/api/{endpoint}"
    headers = {'Authorization': f'Bearer {TELEGRAM_BOT_API_SECRET}'}

    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        else:
            response = requests.post(url, json=data, headers=headers, timeout=10)

        if response.status_code in [200, 201]:
            return {'success': True, 'data': response.json()}
        else:
            return {'success': False, 'status': response.status_code, 'error': response.text}
    except requests.exceptions.ConnectionError:
        logger.error(f"Telegram Bot Service unavailable at {TELEGRAM_BOT_API_URL}")
        return {'success': False, 'error': 'Telegram Bot Service unavailable', 'connection_error': True}
    except Exception as e:
        logger.error(f"Telegram Bot API error: {e}")
        return {'success': False, 'error': str(e)}


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def telegram_initiate_registration(request):
    """
    Инициирует регистрацию через Telegram.
    Возвращает ссылку для открытия бота.
    """
    phone = request.data.get('phone', '').strip()
    
    if not phone:
        return Response(
            {"detail": "Укажите номер телефона."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    phone = normalize_phone(phone)
    
    # Проверяем, не занят ли номер
    if User.objects.filter(username=phone).exists():
        return Response(
            {"detail": "Пользователь с таким номером уже зарегистрирован."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Запрашиваем ссылку у Telegram Bot Service
    result = telegram_bot_api_request('initiate-registration', 'POST', {'phone': phone})
    
    if not result['success']:
        if result.get('status') == 409:
            return Response(
                {"detail": "Этот номер уже привязан к Telegram."},
                status=status.HTTP_409_CONFLICT
            )
        return Response(
            {"detail": "Ошибка при инициализации регистрации."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    data = result['data']
    return Response({
        'telegram_link': data['telegram_link'],
        'token': data['token'],
        'expires_in': data['expires_in']
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def telegram_check_registration(request, token):
    """
    Проверяет статус регистрации по токену.
    """
    result = telegram_bot_api_request(f'check-registration/{token}', 'GET')
    
    if not result['success']:
        if result.get('status') == 404:
            return Response(
                {"detail": "Токен не найден или истёк.", "status": "expired"},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(
            {"detail": "Ошибка при проверке статуса."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    data = result['data']
    return Response(data)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def telegram_complete_registration(request):
    """
    Завершает регистрацию через Telegram.
    Принимает: token, password, password_confirm
    """
    token = request.data.get('token', '').strip()
    password = request.data.get('password', '')
    password_confirm = request.data.get('password_confirm', '')
    
    if not token:
        return Response(
            {"detail": "Токен обязателен."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Проверяем статус регистрации
    result = telegram_bot_api_request(f'check-registration/{token}', 'GET')
    
    if not result['success']:
        return Response(
            {"detail": "Токен не найден или истёк."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    reg_data = result['data']
    if reg_data.get('status') != 'completed':
        return Response(
            {"detail": "Регистрация не завершена. Подтвердите номер в Telegram."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    phone = reg_data['phone']
    first_name = reg_data.get('first_name', '')
    chat_id = reg_data.get('chat_id')
    
    # Проверяем пароль
    if len(password) < 8:
        return Response(
            {"detail": "Пароль должен быть не менее 8 символов."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if password != password_confirm:
        return Response(
            {"detail": "Пароли не совпадают."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Проверяем ещё раз, что номер не занят
    if User.objects.filter(username=phone).exists():
        return Response(
            {"detail": "Пользователь с таким номером уже зарегистрирован."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Создаём пользователя
    user = User.objects.create_user(
        username=phone,
        email='',
        password=password,
        first_name=first_name or 'Пользователь',
        is_active=True
    )
    
    # Создаём/обновляем профиль
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.phone = phone
    profile.is_phone_verified = True
    profile.telegram_chat_id = chat_id
    profile.save()
    
    # Создаём токен
    auth_token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': auth_token.key,
        'user': UserPublicSerializer(user).data
    })


# ==================== Восстановление пароля ====================

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def password_reset_initiate(request):
    """
    Инициирует восстановление пароля.
    Принимает: phone
    Возвращает: telegram_link (если нужно открыть бот)
    """
    phone = request.data.get('phone', '').strip()
    
    if not phone:
        return Response(
            {"detail": "Укажите номер телефона."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    phone = normalize_phone(phone)
    
    # Проверяем, существует ли пользователь
    try:
        user = User.objects.get(username=phone)
    except User.DoesNotExist:
        # Не раскрываем, существует ли пользователь
        return Response(
            {"detail": "Если пользователь с таким номером существует, инструкции отправлены."}
        )
    
    # Запрашиваем у Telegram Bot Service
    result = telegram_bot_api_request('initiate-password-reset', 'POST', {'phone': phone})

    if not result['success']:
        # Если сервис недоступен - используем fallback (генерируем код локально)
        if result.get('connection_error'):
            from .models import UserProfile
            import random

            # Генерируем код локально
            code = ''.join(random.choices('0123456789', k=6))

            # Получаем или создаём профиль
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.generate_code()
            profile.verification_code = code
            from django.utils import timezone
            from datetime import timedelta
            profile.code_expires_at = timezone.now() + timedelta(minutes=10)
            profile.save()

            # TODO: Отправить код через SMS или другой канал
            # Пока просто возвращаем код в ответе (только для разработки!)
            logger.warning(f"Password reset code for {phone}: {code} (Telegram Bot unavailable)")

            return Response({
                'telegram_link': None,
                'token': f'local_{profile.user_id}_{code}',
                'code_sent_directly': True,
                'expires_in': 600,
                'message': f'Код восстановления: {code} (Telegram Bot временно недоступен)',
                'fallback': True
            })

        return Response(
            {"detail": "Ошибка при инициализации восстановления пароля."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    data = result['data']
    return Response({
        'telegram_link': data.get('telegram_link'),
        'token': data['token'],
        'code_sent_directly': data.get('code_sent_directly', False),
        'expires_in': data['expires_in'],
        'message': 'Перейдите в Telegram для получения кода восстановления.'
    })


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def password_reset_verify(request):
    """
    Проверяет код восстановления пароля.
    Принимает: token, code
    Возвращает: temp_token для смены пароля
    """
    token = request.data.get('token', '').strip()
    code = request.data.get('code', '').strip()

    if not token or not code:
        return Response(
            {"detail": "Укажите токен и код."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Проверяем fallback-режим (локальный токен)
    if token.startswith('local_'):
        parts = token.split('_')
        if len(parts) >= 3:
            user_id = parts[1]
            expected_code = parts[2]
            if code == expected_code:
                try:
                    user = User.objects.get(id=user_id)
                    # Генерируем temp_token
                    temp_token = f"temp_{user_id}_{secrets.token_urlsafe(16)}"
                    return Response({
                        'temp_token': temp_token,
                        'phone': user.username
                    })
                except User.DoesNotExist:
                    pass
        return Response(
            {"detail": "Неверный код."},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = telegram_bot_api_request('verify-reset-code', 'POST', {
        'token': token,
        'code': code
    })

    if not result['success']:
        error_msg = "Неверный или истёкший код."
        if result.get('status') == 410:
            error_msg = "Код истёк. Запросите новый."
        return Response(
            {"detail": error_msg},
            status=status.HTTP_400_BAD_REQUEST
        )

    data = result['data']
    return Response({
        'temp_token': data['temp_token'],
        'phone': data['phone']
    })


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def password_reset_complete(request):
    """
    Завершает смену пароля.
    Принимает: temp_token, new_password
    """
    temp_token = request.data.get('temp_token', '').strip()
    new_password = request.data.get('new_password', '')
    
    if not temp_token or not new_password:
        return Response(
            {"detail": "Укажите токен и новый пароль."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {"detail": "Пароль должен быть не менее 8 символов."},
            status=status.HTTP_400_BAD_REQUEST
        )

    phone = request.data.get('phone', '').strip()
    if not phone:
        return Response(
            {"detail": "Укажите номер телефона."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Проверяем fallback temp_token
    if temp_token.startswith('temp_'):
        parts = temp_token.split('_')
        if len(parts) >= 2:
            user_id = parts[1]
            try:
                user = User.objects.get(id=user_id, username=normalize_phone(phone))
                # Меняем пароль
                user.set_password(new_password)
                user.save()

                # Удаляем старые токены
                Token.objects.filter(user=user).delete()

                # Создаём новый токен
                auth_token, _ = Token.objects.get_or_create(user=user)

                return Response({
                    'token': auth_token.key,
                    'user': UserPublicSerializer(user).data,
                    'message': 'Пароль успешно изменён.'
                })
            except User.DoesNotExist:
                return Response(
                    {"detail": "Пользователь не найден."},
                    status=status.HTTP_404_NOT_FOUND
                )
    else:
        # Обычный temp_token - проверяем через Bot Service
        result = telegram_bot_api_request('verify-reset-code', 'POST', {
            'token': temp_token,
            'code': 'VERIFIED'
        })

        if not result['success']:
            return Response(
                {"detail": "Неверный или истёкший токен."},
                status=status.HTTP_400_BAD_REQUEST
            )

        phone = normalize_phone(phone)

        try:
            user = User.objects.get(username=phone)
        except User.DoesNotExist:
            return Response(
                {"detail": "Пользователь не найден."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Меняем пароль
        user.set_password(new_password)
        user.save()

        # Удаляем старые токены
        Token.objects.filter(user=user).delete()

        # Создаём новый токен
        auth_token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': auth_token.key,
            'user': UserPublicSerializer(user).data,
            'message': 'Пароль успешно изменён.'
        })


# ==================== Рассылки в Telegram ====================

from .models import Broadcast, UserProfile


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def broadcast_list(request):
    """Список всех рассылок"""
    if not request.user.is_staff:
        return Response({"detail": "Доступ запрещен"}, status=status.HTTP_403_FORBIDDEN)

    broadcasts = Broadcast.objects.all()
    data = [{
        'id': b.id,
        'title': b.title,
        'text': b.text[:100] + '...' if len(b.text) > 100 else b.text,
        'has_image': bool(b.image),
        'created_at': b.created_at.isoformat(),
        'sent_at': b.sent_at.isoformat() if b.sent_at else None,
        'sent_count': b.sent_count,
        'is_sent': b.is_sent,
    } for b in broadcasts]

    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def broadcast_create(request):
    """Создание новой рассылки"""
    if not request.user.is_staff:
        return Response({"detail": "Доступ запрещен"}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title', '')
    title_style = request.data.get('title_style', 'bold')
    text = request.data.get('text', '')

    broadcast = Broadcast.objects.create(
        title=title,
        title_style=title_style,
        text=text,
    )

    # Если есть изображение в запросе
    if 'image' in request.FILES:
        broadcast.image = request.FILES['image']
        broadcast.save()

    return Response({
        'id': broadcast.id,
        'title': broadcast.title,
        'text': broadcast.text,
        'has_image': bool(broadcast.image),
        'created_at': broadcast.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def broadcast_detail(request, broadcast_id):
    """Детали рассылки"""
    if not request.user.is_staff:
        return Response({"detail": "Доступ запрещен"}, status=status.HTTP_403_FORBIDDEN)

    try:
        broadcast = Broadcast.objects.get(id=broadcast_id)
    except Broadcast.DoesNotExist:
        return Response({"detail": "Рассылка не найдена"}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': broadcast.id,
        'title': broadcast.title,
        'title_style': broadcast.title_style,
        'text': broadcast.text,
        'image_url': request.build_absolute_uri(broadcast.image.url) if broadcast.image else None,
        'created_at': broadcast.created_at.isoformat(),
        'sent_at': broadcast.sent_at.isoformat() if broadcast.sent_at else None,
        'sent_count': broadcast.sent_count,
        'is_sent': broadcast.is_sent,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def broadcast_send(request, broadcast_id):
    """Отправка рассылки в Telegram"""
    if not request.user.is_staff:
        return Response({"detail": "Доступ запрещен"}, status=status.HTTP_403_FORBIDDEN)

    try:
        broadcast = Broadcast.objects.get(id=broadcast_id)
    except Broadcast.DoesNotExist:
        return Response({"detail": "Рассылка не найдена"}, status=status.HTTP_404_NOT_FOUND)

    if broadcast.is_sent:
        return Response({"detail": "Рассылка уже отправлена"}, status=status.HTTP_400_BAD_REQUEST)

    # Получаем всех пользователей с telegram_chat_id
    profiles = UserProfile.objects.exclude(telegram_chat_id__isnull=True)

    if not profiles.exists():
        return Response({"detail": "Нет пользователей с привязанным Telegram"}, status=status.HTTP_400_BAD_REQUEST)

    # Формируем сообщение
    message_text = format_broadcast_message(broadcast)

    # Отправляем через Telegram Bot Service
    sent_count = 0
    failed_count = 0

    for profile in profiles:
        result = send_broadcast_message(
            profile.telegram_chat_id,
            message_text,
            broadcast.image.path if broadcast.image else None
        )
        if result['success']:
            sent_count += 1
        else:
            failed_count += 1

    # Обновляем статус рассылки
    broadcast.is_sent = True
    broadcast.sent_at = timezone.now()
    broadcast.sent_count = sent_count
    broadcast.save()

    return Response({
        'success': True,
        'sent_count': sent_count,
        'failed_count': failed_count,
        'total': profiles.count(),
    })


def format_broadcast_message(broadcast: Broadcast) -> str:
    """Форматирует сообщение рассылки с учетом стиля заголовка"""
    if not broadcast.title:
        return broadcast.text

    # HTML теги для разных стилей
    style_tags = {
        'bold': ('<b>', '</b>'),
        'italic': ('<i>', '</i>'),
        'underline': ('<u>', '</u>'),
        'strikethrough': ('<s>', '</s>'),
        'code': ('<code>', '</code>'),
        'spoiler': ('<span class="tg-spoiler">', '</span>'),
    }

    open_tag, close_tag = style_tags.get(broadcast.title_style, ('<b>', '</b>'))
    formatted_title = f"{open_tag}{broadcast.title}{close_tag}"

    if broadcast.text:
        return f"{formatted_title}\n\n{broadcast.text}"
    return formatted_title


def send_broadcast_message(chat_id: int, text: str, image_path: str = None) -> dict:
    """Отправляет сообщение рассылки через Telegram Bot Service"""
    url = f"{TELEGRAM_BOT_API_URL}/send-broadcast"
    headers = {'Authorization': f'Bearer {TELEGRAM_BOT_API_SECRET}'}

    try:
        if image_path:
            # Отправка фото с подписью
            with open(image_path, 'rb') as photo:
                files = {'photo': photo}
                data = {'chat_id': chat_id, 'caption': text, 'parse_mode': 'HTML'}
                response = requests.post(url, headers=headers, data=data, files=files, timeout=30)
        else:
            # Отправка только текста
            payload = {
                'chat_id': chat_id,
                'text': text,
                'parse_mode': 'HTML'
            }
            response = requests.post(url, json=payload, headers=headers, timeout=10)

        return {'success': response.status_code == 200}
    except Exception as e:
        logger.error(f"Error sending broadcast: {e}")
        return {'success': False, 'error': str(e)}


@api_view(["POST"])
@permission_classes([AllowAny])
def sync_chat_id(request):
    """Синхронизирует chat_id от бота с Django (вызывается ботом)"""
    # Проверяем API ключ
    api_key = request.headers.get('X-API-Key', '')
    expected_key = getattr(settings, 'BOT_API_KEY', 'your-django-api-key')
    if api_key != expected_key:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    phone = request.data.get('phone', '').strip()
    chat_id = request.data.get('chat_id')

    if not phone or not chat_id:
        return Response({'error': 'Phone and chat_id required'}, status=status.HTTP_400_BAD_REQUEST)

    # Нормализуем номер
    phone = normalize_phone(phone)

    # Находим пользователя и обновляем chat_id
    try:
        user = User.objects.get(username=phone)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.telegram_chat_id = chat_id
        profile.save()
        return Response({'success': True})
    except User.DoesNotExist:
        # Пользователь еще не зарегистрирован - сохраним для будущего
        return Response({'success': True, 'message': 'User not found, will sync on registration'})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_chat_ids(request):
    """Получает все chat_id для рассылки (вызывается ботом)"""
    if not request.user.is_staff:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    profiles = UserProfile.objects.exclude(telegram_chat_id__isnull=True)
    data = [{'phone': p.phone, 'chat_id': p.telegram_chat_id} for p in profiles]
    return Response({'chat_ids': data})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def broadcast_delete(request, broadcast_id):
    """Удаление рассылки"""
    if not request.user.is_staff:
        return Response({"detail": "Доступ запрещен"}, status=status.HTTP_403_FORBIDDEN)

    try:
        broadcast = Broadcast.objects.get(id=broadcast_id)
    except Broadcast.DoesNotExist:
        return Response({"detail": "Рассылка не найдена"}, status=status.HTTP_404_NOT_FOUND)

    # Удаляем изображение если есть
    if broadcast.image:
        broadcast.image.delete(save=False)

    broadcast.delete()
    return Response({'success': True, 'message': 'Рассылка удалена'})

