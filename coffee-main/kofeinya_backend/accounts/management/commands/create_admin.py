"""Создать администратора с email в качестве логина (удобно для входа в /admin/ и в API)."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Создаёт суперпользователя (username = email). Пример: create_admin --email a@b.c --password secret"

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, required=True)
        parser.add_argument("--password", type=str, required=True)

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        password = options["password"]
        if User.objects.filter(username__iexact=email).exists():
            self.stdout.write(self.style.WARNING(f"Пользователь {email} уже существует."))
            return
        User.objects.create_superuser(
            username=email,
            email=email,
            password=password,
            is_active=True,
        )
        self.stdout.write(self.style.SUCCESS(f"Администратор {email} создан. Вход в /admin/ — email и этот пароль."))
