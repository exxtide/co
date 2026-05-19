from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
import random
import string


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    phone = models.CharField(max_length=32, blank=True, default="", verbose_name="Телефон")
    verification_method = models.CharField(
        max_length=10,
        choices=[('telegram', 'Telegram'), ('max', 'MAX')],
        blank=True,
        default="",
        verbose_name="Способ подтверждения"
    )
    verification_code = models.CharField(max_length=6, blank=True, default="", verbose_name="Код подтверждения")
    code_expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Код действует до")
    is_phone_verified = models.BooleanField(default=False, verbose_name="Телефон подтверждён")
    telegram_chat_id = models.BigIntegerField(null=True, blank=True, verbose_name="Telegram Chat ID")

    class Meta:
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"

    def __str__(self) -> str:
        return f"Профиль {self.user_id} - {self.phone}"

    def generate_code(self):
        """Генерирует 6-значный код подтверждения"""
        self.verification_code = ''.join(random.choices(string.digits, k=6))
        from django.utils import timezone
        from datetime import timedelta
        self.code_expires_at = timezone.now() + timedelta(minutes=10)
        self.save()
        return self.verification_code

    def is_code_valid(self, code):
        """Проверяет код и срок его действия"""
        from django.utils import timezone
        if not self.code_expires_at or timezone.now() > self.code_expires_at:
            return False
        return self.verification_code == code

    def clear_code(self):
        """Очищает код после использования"""
        self.verification_code = ""
        self.code_expires_at = None
        self.save()


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def _ensure_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
