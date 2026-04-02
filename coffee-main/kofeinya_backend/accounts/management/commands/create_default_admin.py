"""
Management command для создания администратора по умолчанию при деплое.
Использует переменные окружения для безопасности.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Создает администратора по умолчанию из переменных окружения'

    def handle(self, *args, **options):
        # Получаем данные из переменных окружения
        admin_email = os.environ.get('DJANGO_ADMIN_EMAIL', '').strip()
        admin_password = os.environ.get('DJANGO_ADMIN_PASSWORD', '').strip()
        admin_name = os.environ.get('DJANGO_ADMIN_NAME', 'Admin').strip()

        # Проверяем наличие обязательных переменных
        if not admin_email:
            self.stdout.write(
                self.style.WARNING(
                    'DJANGO_ADMIN_EMAIL не установлен. Пропускаем создание администратора.'
                )
            )
            return

        if not admin_password:
            self.stdout.write(
                self.style.WARNING(
                    'DJANGO_ADMIN_PASSWORD не установлен. Пропускаем создание администратора.'
                )
            )
            return

        # Проверяем, существует ли уже пользователь с таким email
        if User.objects.filter(email=admin_email).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'Пользователь с email {admin_email} уже существует. Пропускаем создание.'
                )
            )
            return

        # Проверяем, существует ли уже пользователь с username = email
        if User.objects.filter(username=admin_email).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'Пользователь с username {admin_email} уже существует. Пропускаем создание.'
                )
            )
            return

        # Создаем суперпользователя
        try:
            user = User.objects.create_superuser(
                username=admin_email,
                email=admin_email,
                password=admin_password,
                first_name=admin_name,
            )
            user.is_staff = True
            user.is_active = True
            user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Администратор успешно создан: {admin_email}'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'   Имя: {admin_name}'
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    '⚠️  ВАЖНО: Смените пароль после первого входа!'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Ошибка при создании администратора: {str(e)}'
                )
            )
            raise
