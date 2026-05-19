from django.urls import path

from . import views

urlpatterns = [
    # Новая авторизация по телефону
    path("auth/send-code/", views.send_code, name="send_code"),
    path("auth/verify-code/", views.verify_code_and_login, name="verify_code"),
    path("auth/telegram/", views.telegram_login, name="telegram_login"),
    path("auth/telegram/webhook/", views.telegram_webhook, name="telegram_webhook"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/me/", views.me, name="me"),
    path("auth/profile/", views.update_profile, name="update_profile"),
]
