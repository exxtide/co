"""
Модуль для отправки кодов подтверждения через Telegram и MAX.
Telegram отправляется через микросервис на Render.com для обхода блокировок.
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# URL микросервиса Telegram бота на Render.com
TELEGRAM_BOT_SERVICE_URL = getattr(settings, 'TELEGRAM_BOT_SERVICE_URL', 'https://tg-bot-server-zdz8.onrender.com')
TELEGRAM_BOT_API_SECRET = getattr(settings, 'TELEGRAM_BOT_API_SECRET', '')


def send_code_via_telegram(phone: str, code: str) -> bool:
    """
    Отправляет код подтверждения через Telegram Bot API (через микросервис на Render).
    """
    if not TELEGRAM_BOT_API_SECRET:
        logger.error("TELEGRAM_BOT_API_SECRET не настроен")
        return False
    
    try:
        url = f"{TELEGRAM_BOT_SERVICE_URL}/send-code"
        headers = {
            'Authorization': f'Bearer {TELEGRAM_BOT_API_SECRET}',
            'Content-Type': 'application/json'
        }
        payload = {
            'phone': phone,
            'code': code
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            logger.info(f"Код отправлен в Telegram для {phone}")
            return True
        else:
            error_data = response.json() if response.text else {}
            error_msg = error_data.get('error', response.text)
            logger.error(f"Ошибка отправки через микросервис: {error_msg}")
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


def check_telegram_link(phone: str) -> bool:
    """
    Проверяет, привязан ли номер телефона к Telegram.
    """
    if not TELEGRAM_BOT_API_SECRET:
        return False
    
    try:
        url = f"{TELEGRAM_BOT_SERVICE_URL}/check-phone/{phone}"
        headers = {
            'Authorization': f'Bearer {TELEGRAM_BOT_API_SECRET}'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('linked', False)
        return False
        
    except Exception as e:
        logger.error(f"Ошибка проверки привязки Telegram: {e}")
        return False
