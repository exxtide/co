#!/usr/bin/env bash
# exit on error
set -o errexit

# Установка зависимостей
pip install -r requirements.txt

# Сбор статических файлов
python manage.py collectstatic --no-input

# Применение миграций
python manage.py migrate

# Создание суперпользователя (опционально, если нужно)
# python manage.py createsuperuser --noinput --email admin@example.com || true
