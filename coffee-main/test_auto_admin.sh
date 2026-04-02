#!/usr/bin/env bash
# Скрипт для тестирования автоматического создания администратора локально

echo "🧪 Тестирование автоматического создания администратора"
echo "=========================================================="
echo ""

# Переход в директорию backend
cd kofeinya_backend || exit 1

# Установка тестовых переменных окружения
export DJANGO_ADMIN_EMAIL="test@example.com"
export DJANGO_ADMIN_PASSWORD="TestPassword123!"
export DJANGO_ADMIN_NAME="Test Admin"

echo "📋 Установлены тестовые переменные:"
echo "   DJANGO_ADMIN_EMAIL=$DJANGO_ADMIN_EMAIL"
echo "   DJANGO_ADMIN_PASSWORD=***"
echo "   DJANGO_ADMIN_NAME=$DJANGO_ADMIN_NAME"
echo ""

echo "🗄️  Применение миграций..."
python manage.py migrate --noinput
echo ""

echo "👤 Создание администратора..."
python manage.py create_default_admin
echo ""

echo "✅ Проверка создания администратора..."
python manage.py shell << EOF
from django.contrib.auth.models import User
try:
    user = User.objects.get(email='$DJANGO_ADMIN_EMAIL')
    print(f"✅ Администратор найден:")
    print(f"   Email: {user.email}")
    print(f"   Username: {user.username}")
    print(f"   Имя: {user.first_name}")
    print(f"   Суперпользователь: {user.is_superuser}")
    print(f"   Активен: {user.is_active}")
    print(f"   Staff: {user.is_staff}")
except User.DoesNotExist:
    print("❌ Администратор не найден!")
EOF

echo ""
echo "🧹 Очистка (удаление тестового администратора)..."
python manage.py shell << EOF
from django.contrib.auth.models import User
try:
    user = User.objects.get(email='$DJANGO_ADMIN_EMAIL')
    user.delete()
    print("✅ Тестовый администратор удален")
except User.DoesNotExist:
    print("⚠️  Администратор не найден")
EOF

echo ""
echo "=========================================================="
echo "✅ Тестирование завершено!"
echo ""
echo "Для использования на Render.com:"
echo "1. Установите переменные DJANGO_ADMIN_EMAIL и DJANGO_ADMIN_PASSWORD"
echo "2. Деплойте приложение"
echo "3. Администратор будет создан автоматически"
