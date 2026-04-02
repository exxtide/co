from django.urls import path

from . import views

urlpatterns = [
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login_view, name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/me/", views.me, name="me"),
    path("auth/verify-email/", views.verify_email, name="verify_email"),
    path("auth/resend-verification/", views.resend_verification, name="resend_verification"),
    path("auth/profile/", views.update_profile, name="update_profile"),
    path("auth/password/", views.change_password, name="change_password"),
]
