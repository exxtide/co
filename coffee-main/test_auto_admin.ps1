# Скрипт для тестирования автоматического создания администратора локально (Windows)

Write-Host "🧪 Тестирование автоматического создания администратора" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Переход в директорию backend
Set-Location kofeinya_backend

# Установка тестовых переменных окружения
$env:DJANGO_ADMIN_EMAIL = "test@example.com"
$env:DJANGO_ADMIN_PASSWORD = "TestPassword123!"
$env:DJANGO_ADMIN_NAME = "Test Admin"

Write-Host "📋 Установлены тестовые переменные:" -ForegroundColor Yellow
Write-Host "   DJANGO_ADMIN_EMAIL=$env:DJANGO_ADMIN_EMAIL"
Write-Host "   DJANGO_ADMIN_PASSWORD=***"
Write-Host "   DJANGO_ADMIN_NAME=$env:DJANGO_ADMIN_NAME"
Write-Host ""

Write-Host "🗄️  Применение миграций..." -ForegroundColor Yellow
python manage.py migrate --noinput
Write-Host ""

Write-Host "👤 Создание администратора..." -ForegroundColor Yellow
python manage.py create_default_admin
Write-Host ""

Write-Host "✅ Проверка создания администратора..." -ForegroundColor Green
$checkScript = @"
from django.contrib.auth.models import User
try:
    user = User.objects.get(email='$env:DJANGO_ADMIN_EMAIL')
    print(f'✅ Администратор найден:')
    print(f'   Email: {user.email}')
    print(f'   Username: {user.username}')
    print(f'   Имя: {user.first_name}')
    print(f'   Суперпользователь: {user.is_superuser}')
    print(f'   Активен: {user.is_active}')
    print(f'   Staff: {user.is_staff}')
except User.DoesNotExist:
    print('❌ Администратор не найден!')
"@

$checkScript | python manage.py shell

Write-Host ""
Write-Host "🧹 Очистка (удаление тестового администратора)..." -ForegroundColor Yellow
$cleanupScript = @"
from django.contrib.auth.models import User
try:
    user = User.objects.get(email='$env:DJANGO_ADMIN_EMAIL')
    user.delete()
    print('✅ Тестовый администратор удален')
except User.DoesNotExist:
    print('⚠️  Администратор не найден')
"@

$cleanupScript | python manage.py shell

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✅ Тестирование завершено!" -ForegroundColor Green
Write-Host ""
Write-Host "Для использования на Render.com:" -ForegroundColor Yellow
Write-Host "1. Установите переменные DJANGO_ADMIN_EMAIL и DJANGO_ADMIN_PASSWORD"
Write-Host "2. Деплойте приложение"
Write-Host "3. Администратор будет создан автоматически"

# Возврат в корневую директорию
Set-Location ..
