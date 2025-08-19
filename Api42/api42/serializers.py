from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import User, Friendship, MatchHistory
import os
import shutil
from django.conf import settings


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "fullname",
            "profile_picture",
            "ft_api_registered",
            "online_status",
            "favourite_language",
            "wins",
            "losses",
            "otp_secret",
            "is_2fa_enabled",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "otp_secret": {"read_only": True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        usrname = validated_data["username"]
        shutil.copy(os.path.join(settings.MEDIA_ROOT, "avatars", "default_picture.png"), os.path.join(settings.MEDIA_ROOT, "avatars", f"{usrname}_avatar.jpg"))
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            fullname=validated_data["fullname"],
            profile_picture=validated_data.get("profile_picture", os.path.join(settings.MEDIA_ROOT, "avatars", f"{usrname}_avatar.jpg")),
            ft_api_registered=validated_data.get("ft_api_registered", False),
            online_status=validated_data.get("online_status", False),
            favourite_language=validated_data.get("favourite_language", "en"),
            wins=validated_data.get("wins", 0),
            losses=validated_data.get("losses", 0),
        )
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "fullname",
            "profile_picture",
            "password",
            "favourite_language",
            "otp_secret",
            "is_2fa_enabled",
        )
        extra_kwargs = {
            "username": {"required": False},
            "password": {"required": False},
            "fullname": {"required": False},
            "email": {"required": False},
            "profile_picture": {"required": False},
            "ft_api_registered": {"required": False},
            "favourite_language": {"required": False},
            "otp_secret": {"read_only": True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.get("password")
        if password is not None:
            validated_data["password"] = make_password(password)
        user = User.objects.create_user(**validated_data)
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.get("password")
        if password:
            validated_data["password"] = make_password(password)

        return super().update(instance, validated_data)


# ============================= FRIENDSHIP SERIALIZERS =============================


class FriendshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = "__all__"


class AddFriendSerializer(serializers.Serializer):
    friend_username = serializers.CharField()


class CheckFriendshipSerializer(serializers.Serializer):
    friend_username = serializers.CharField()


class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "fullname",
            "profile_picture",
            "ft_api_registered",
            "online_status",
            "otp_secret",
            "is_2fa_enabled",

        )


class MatchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchHistory
        fields = ['user', 'opponent', 'result', 'user_score', 'opponent_score', 'date']

########## OTP #####################
class Activate2FASerializer(serializers.Serializer):
    otp_secret = serializers.CharField(max_length=32, read_only=True)
    is_2fa_enabled = serializers.BooleanField(read_only=True)

class Verify2FASerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6)

