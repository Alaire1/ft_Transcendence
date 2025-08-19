from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class User(AbstractUser):

    username = models.CharField(
        _("username"),
        max_length=150,
        unique=True,
        blank=False,
        help_text=_(
            "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
        ),
        error_messages={
            "unique": _("A user with that username already exists."),
        },
    )
    email = models.EmailField(
        _("email address"),
        unique=True,
        blank=False,
        error_messages={
            "unique": _("A user with that email already exists."),
        },
    )
    password = models.CharField(
        _("password"),
        max_length=128,
        blank=False,
    )
    fullname = models.CharField(
        _("fullname"),
        max_length=250,
        help_text=_(
            "Required. 250 characters or fewer. Letters, digits and @/./+/-/_ only."
        ),
    )
    profile_picture = models.ImageField(
        _("profile picture"),
        upload_to='avatars/',
        default='avatars/default.jpg'
    )
    ft_api_registered = models.BooleanField(
        _("ft_api_registered"),
        blank=False,
        default=False,
    )
    online_status = models.BooleanField(
        _("online_status"),
        blank=False,
        default=False,
    )
    blocked_users = models.JSONField(
        _("blocked_users"),
        default=list,
        blank=True,
    )
    friend_requests_sent = models.JSONField(
        _("friend_requests_sent"),
        default=list,
        blank=True,
    )
    friend_requests_received = models.JSONField(
        _("friend_requests_received"),
        default=list,
        blank=True,
    )
      
    favourite_language = models.CharField(
        _("favourite_language"),
        max_length=2,
        choices=[
            ("pl", "Polski"),
            ("en", "English"),
            ("de", "Deutsch"),
        ],
        default="en",
    )
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)

    ################# 2FA OTP Implementation ####################
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class Friendship(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends_of')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')  # Ensures unique friendships


class BlacklistedToken(models.Model):
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.token

# is it mine or not?
class MatchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='match_history')
    opponent = models.CharField(max_length=150)
    result = models.CharField(max_length=10)  # 'win' or 'loss'
    user_score = models.IntegerField(default=0)
    opponent_score = models.IntegerField(default=0)
    date = models.DateTimeField(auto_now_add=True)

class PlayerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    username = models.CharField(max_length=150, unique=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.jpg')