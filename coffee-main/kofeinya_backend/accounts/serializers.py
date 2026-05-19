from django.contrib.auth import password_validation
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile


class UserPublicSerializer(serializers.ModelSerializer):
    phone_verified = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "is_staff", "phone_verified", "phone")

    def get_phone_verified(self, obj: User) -> bool:
        profile = getattr(obj, "profile", None)
        if profile and isinstance(profile, UserProfile):
            return profile.is_phone_verified
        return False

    def get_phone(self, obj: User) -> str:
        profile = getattr(obj, "profile", None)
        if profile and isinstance(profile, UserProfile):
            return profile.phone or ""
        return ""


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже зарегистрирован.")
        return value.lower()

    def validate_password(self, value: str) -> str:
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=validated_data.get("first_name") or "",
            is_active=False,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class VerifyEmailSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)

    class Meta:
        model = User
        fields = ("first_name", "phone")

    def update(self, instance, validated_data):
        phone = validated_data.pop("phone", None)
        instance = super().update(instance, validated_data)
        if phone is not None:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            profile.phone = phone
            profile.save(update_fields=["phone"])
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        user = self.context["request"].user
        password_validation.validate_password(attrs["new_password"], user)
        return attrs
