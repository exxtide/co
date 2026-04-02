"""Назначить пользователя администратором (is_staff + is_superuser)."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "Назначает staff/superuser по email. Пример: promote_staff --email user@mail.ru"

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, required=True)

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        try:
            user = User.objects.get(username__iexact=email)
        except User.DoesNotExist as exc:
            raise CommandError(f"Пользователь {email} не найден.") from exc
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save(update_fields=["is_staff", "is_superuser", "is_active"])
        self.stdout.write(self.style.SUCCESS(f"{email} теперь администратор. Вход в /admin/ с этим email и паролем."))
