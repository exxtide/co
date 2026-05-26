from django.urls import path

from . import views

urlpatterns = [
    # Регистрация и вход
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login, name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/me/", views.me, name="me"),
    path("auth/profile/", views.update_profile, name="update_profile"),

    # Telegram регистрация
    path("auth/telegram/initiate-registration/", views.telegram_initiate_registration, name="telegram_initiate_registration"),
    path("auth/telegram/check-registration/<str:token>/", views.telegram_check_registration, name="telegram_check_registration"),
    path("auth/telegram/complete-registration/", views.telegram_complete_registration, name="telegram_complete_registration"),

    # Восстановление пароля
    path("auth/password-reset/initiate/", views.password_reset_initiate, name="password_reset_initiate"),
    path("auth/password-reset/verify/", views.password_reset_verify, name="password_reset_verify"),
    path("auth/password-reset/complete/", views.password_reset_complete, name="password_reset_complete"),

    # Рассылки
    path("admin/broadcasts/", views.broadcast_list, name="broadcast_list"),
    path("admin/broadcasts/create/", views.broadcast_create, name="broadcast_create"),
    path("admin/broadcasts/<int:broadcast_id>/send/", views.broadcast_send, name="broadcast_send"),
    path("admin/broadcasts/<int:broadcast_id>/", views.broadcast_detail, name="broadcast_detail"),
    path("admin/broadcasts/<int:broadcast_id>/delete/", views.broadcast_delete, name="broadcast_delete"),

    # Синхронизация chat_id (для бота)
    path("accounts/sync-chat-id/", views.sync_chat_id, name="sync_chat_id"),
    path("accounts/chat-ids/", views.get_all_chat_ids, name="get_all_chat_ids"),
]
