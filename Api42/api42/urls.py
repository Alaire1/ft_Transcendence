from django.urls import path
from .views import *


urlpatterns = [
    # OAuth 42 API
    path('42-login/', OAuth42LoginView.as_view(), name='42-login'),
    path('42-callback/', OAuth42CallbackView.as_view(), name='42-callback'),

    # User registration and login
    path('register/', UserRegisterView.as_view(), name='user_register'),
    path('login/', UserLoginView.as_view(), name='user_login'),
    path('logout/', UserLogoutAPIView.as_view(), name='user_logout'),
    path('auth/check/', UserCheckAPIView.as_view(), name='user_check'),

    # Deleting User
    path('delete/', UserDeleteView.as_view(), name='user_delete'),

    # User information
    path('users/', AllUsersView.as_view(), name='all_users'),
    path('users/me/', UserInfoQuery.as_view(), name='user_info'),
    path('users/update/', UserUpdateView.as_view(), name='user_update'),

    path('online_status/', OnlineUsersView.as_view(), name='online_users'),

    # Friendship management
    path('friends/add/', AddFriendAPIView.as_view(), name='add_friend'),
    path('friends/request/', FriendRequestAPIView.as_view(), name='friend_request'),
    path('friends/remove/', RemoveFriendAPIView.as_view(), name='remove_friend'),
    path('friends/search/', UserSearchAPIView.as_view(), name='user_search'),
    path('friends/check/<str:friend_user_name>/', CheckFriendshipAPIView.as_view(), name='check_friendship'),
    path('friends/list/', FriendListAPIView.as_view(), name='friend_list'),

    # Block user
    path('blocked/list/', BlockedUserListAPIView.as_view(), name='blocked_users_list'),
    path('blocked/add/', BlockUserAPIView.as_view(), name='block_user'),
    path('blocked/remove/', UnblockUserAPIView.as_view(), name='unblock_user'),

    # Match history
    path('matches/history/', MatchHistoryView.as_view(), name='match_history'),
    path('matches/history/simple', MatchHistorySimpleView.as_view(), name='match_history_simple'),


]