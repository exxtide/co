#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🔧 Установка зависимостей..."
pip install -r requirements.txt

echo "📦 Сбор статических файлов..."
python manage.py collectstatic --no-input

echo "🗄️  Применение миграций..."
python manage.py migrate

echo "👤 Создание администратора по умолчанию..."
python manage.py create_default_admin || echo "⚠️  Администратор не создан (возможно, уже существует)"

echo "✅ Сборка завершена успешно!"l admin@example.com --psw 123 || true
