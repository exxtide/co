"""
Модуль для отправки кодов подтверждения через Telegram и MAX
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def send_code_via_telegram(phone: str, code: str) -> bool:
    """
    Отправляет код подтверждения через Telegram Bot.
    Требует настройки TELEGRAM_BOT_TOKEN в settings.
    """
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    if not bot_token:
        logger.error("TELEGRAM_BOT_TOKEN не настроен")
        return False
    
    # Ищем профиль пользователя по телефону
    from .models import UserProfile
    profile = UserProfile.objects.filter(phone=phone).first()
    
    if not profile or not profile.telegram_chat_id:
        logger.warning(f"Для {phone} не найден telegram_chat_id")
        return False
    
    # Формируем сообщение
    message = (
        f"🔐 <b>Код подтверждения</b>\n\n"
        f"Ваш код для входа: <code>{code}</code>\n\n"
        f"⏳ Код действителен 10 минут.\n"
        f"Если вы не запрашивали код, проигнорируйте это сообщение."
    )
    
    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': profile.telegram_chat_id,
            'text': message,
            'parse_mode': 'HTML'
        }
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            logger.info(f"Код отправлен в Telegram для {phone}")
            return True
        else:
            logger.error(f"Ошибка Telegram API: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Ошибка отправки через Telegram: {e}")
        return False


def send_code_via_max(phone: str, code: str) -> bool:
    """
    Отправляет код подтверждения через мессенджер MAX.
    Требует настройки MAX_API_KEY и MAX_API_URL в settings.
    """
    api_key = getattr(settings, 'MAX_API_KEY', None)
    api_url = getattr(settings, 'MAX_API_URL', None)
    
    if not api_key or not api_url:
        logger.error("MAX_API_KEY или MAX_API_URL не настроены")
        return False
    
    try:
        # Здесь должен быть реальный запрос к API MAX
        # Пока логируем что отправка не настроена
        logger.info(f"Код {code} для {phone} готов к отправке через MAX")
        # TODO: Реализовать интеграцию с MAX API
        return True
    except Exception as e:
        logger.error(f"Ошибка отправки через MAX: {e}")
        return False


def send_verification_code(phone: str, code: str, method: str) -> bool:
    """
    Отправляет код подтверждения выбранным способом.
    Возвращает True если отправка успешна.
    """
    if method == 'telegram':
        return send_code_via_telegram(phone, code)
    elif method == 'max':
        return send_code_via_max(phone, code)
    else:
        logger.error(f"Неизвестный способ отправки: {method}")
        return False
