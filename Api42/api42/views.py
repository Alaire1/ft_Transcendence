import time
import os
import requests
import subprocess
import secrets
import string
import random
import shutil
from django.core.mail import send_mail
from django.core.files import File
from django.shortcuts import redirect
from urllib.parse import urlencode
from datetime import datetime
from django.core.files.temp import NamedTemporaryFile
from django.core.files import File
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from .models import BlacklistedToken, Friendship, MatchHistory, PlayerProfile
from .serializers import UserSerializer, UserUpdateSerializer, MatchHistorySerializer
from rest_framework.authtoken.models import Token
from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model
from twilio.rest import Client
import pyotp
import qrcode
from io import BytesIO
from django.http import HttpResponse, JsonResponse
from .serializers import Activate2FASerializer, Verify2FASerializer
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

User = get_user_model()

import os
import logging
# from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

#env variables that were in the settings.py file 
UID = os.getenv("INTRA_UID_42")
SECRET = os.getenv("INTRA_SECRET_42")
REDIRECT_URI = os.getenv("REDIRECT_URI")

logger.debug(f"UID: {UID}")
logger.debug(f"SECRET: {SECRET}")
logger.debug(f"REDIRECT_URI: {REDIRECT_URI}")
# 42 INTRA auth URL
API_42_AUTH_URL = 'https://api.intra.42.fr/oauth/authorize'
# 42 Intra access token endpoint
API_42_ACCESS_TOKEN_ENDPOINT = 'https://api.intra.42.fr/oauth/token'
# 42 Intra entrypoint URL
API_42_INTRA_ENTRYPOINT_URL = 'https://api.intra.42.fr/v2/me'
# 42 Intra frontend callback URL
API_42_FRONTEND_CALLBACK_URL = f'https://{settings.HOST_IP}/profile'
# one-time code lifetime in seconds
EXCHANGE_CODE_TIMEOUT = 30


def blacklist_token(token):
    if not BlacklistedToken.objects.filter(token=token).exists():
        blacklisted_token = BlacklistedToken(token=token)
        blacklisted_token.save()

def save_avatar_locally(avatar_url, player_profile, user):
    # Construct the expected avatar name based on the username
    expected_avatar_name = f"{user.username}_avatar.jpg"
    
    # Check if the avatar is already set and matches the expected avatar name
    if player_profile.avatar and player_profile.avatar.name == "./{expected_avatar_name}":
        # Avatar already exists, skip downloading
        return

    # If no avatar or it's a different one, download and save the new avatar
    response = requests.get(avatar_url)
    if response.status_code == 200:
        img_temp = NamedTemporaryFile(delete=True)
        img_temp.write(response.content)
        img_temp.flush()
        
        # Save the avatar in the 'avatars' folder with the correct filename
        player_profile.avatar.save(f"./{expected_avatar_name}", File(img_temp), save=True)
        
        logger.debug(f"Saved avatar for user {user.username}")
        logger.debug(f"Avatar URL: {avatar_url}")


############### 42 LOGIN WORKFLOW ######################
# New function (Anita)
class OAuth42LoginView(APIView):
    permission_classes = [AllowAny] 

    def get(self, request):
        """ Redirect user to 42 API for authorization """
        characters = string.ascii_letters + string.digits
        state = ''.join(secrets.choice(characters) for _ in range(30))
        request.session['oauth_state'] = state
        logger.debug(f"In OAuth42LoginView, state: {state}")
        logger.debug(f"Generated state: {state}")
        auth_url = (
            f"{API_42_AUTH_URL}"
            f"?client_id={UID}"
            f"&redirect_uri={REDIRECT_URI}"
            f"&scope=public"
            f"&response_type=code"
            f"&state={state}"
        )

        logger.debug(f"Constructed auth URL: {auth_url}")

        return redirect(auth_url)

# New function (Anita)
class OAuth42CallbackView(APIView):
    permission_classes = [AllowAny]
    logger.debug("In OAuth42CallbackView")
    def get(self, request):
        """ Handle the callback from 42 API after user authorization """
        # Retrieve the code and state from query parameters
        code = request.query_params.get('code')
        state = request.query_params.get('state')

        # Get the state from the session
        saved_state = request.session.get('oauth_state')

        if not code or not state or saved_state != state:
            return Response(
                {"success": False, "message": "Missing or invalid code/state."},
                status=status.HTTP_400_BAD_REQUEST
            )
        logger.debug(f"Received code: {code}")
        # Exchange the code for an access token
        token_response = requests.post(
            API_42_ACCESS_TOKEN_ENDPOINT,
            data={
                'grant_type': 'authorization_code',
                'client_id': UID,
                'client_secret': SECRET,
                'code': code,
                'redirect_uri': REDIRECT_URI,
            }
        )

        if token_response.status_code != 200:
            return Response(
                {"success": False, "message": "Failed to obtain access token."},
                status=status.HTTP_400_BAD_REQUEST
            )

        token_data = token_response.json()
        access_token = token_data.get('access_token')
        logger.debug(f"Received access token: {access_token}")
        # Use the access token to get user info
        user_info_response = requests.get(
            API_42_INTRA_ENTRYPOINT_URL,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        if user_info_response.status_code != 200:
            return Response(
                {"success": False, "message": "Failed to obtain user information."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_info = user_info_response.json()

        email = user_info.get("email")
        username = user_info.get("login")
        first_name = user_info.get("first_name")
        last_name = user_info.get("last_name")
        avatar_url = user_info.get("image", {}).get("versions", {}).get("medium")
        provider = "42api"

        # Create or get the user object
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
               # 'auth_provider': provider,
            }
        )

        # Create or get the player profile
        player_profile, profile_created = PlayerProfile.objects.get_or_create(
            user=user,
            defaults={
                'username': username,
            }
        )

        # Save the avatar if URL is available
        if avatar_url:
            save_avatar_locally(avatar_url, player_profile, user)

        # Create or update refresh token for the user
        refresh = RefreshToken.for_user(user)
        tokens = {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
        ##possible fix for redirect

        #  host = request.get_host()
        # scheme = request.scheme

        # # Construct the dynamic redirect URL
        # redirect_url = f"{scheme}://{host}/login#access_token={tokens['access']}&refresh_token={tokens['refresh']}"

        # return redirect(redirect_url)
        return redirect(f"https://{settings.HOST_IP}/login#access_token={tokens['access']}&refresh_token={tokens['refresh']}")

        #return Response({"success": True, "token": tokens}, status=status.HTTP_200_OK)



# =========================== AUTHENTICATION APIs ===========================

class UserRegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "User registration successful"}, status=status.HTTP_201_CREATED)
        return Response({"success": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class AllUsersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        print("HELP")
        users = User.objects.all()
        for user in users:
            print(f"Username: {user.username}, Online Status: {user.online_status}")
        user_data = [{"username": user.username, "online_status": user.online_status} for user in users]
        return Response({"success": True, "users": user_data})

class UserLoginView(APIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        logger.debug(f"Received username: {username}")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            logger.debug(f"Authenticated user: {user.username}")
            refresh = RefreshToken.for_user(user)
            return Response({"success": True, "token": {"refresh": str(refresh), "access": str(refresh.access_token)}}, status=status.HTTP_200_OK)
        else:
            logger.debug("Invalid credentials")
            logger.debug(f"User: {user}")
            logger.debug(f"Username: {username}")
            logger.debug(f"Password: {password}")
        return Response({"success": False, "message": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class UserInfoQuery(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = User.objects.get(username=request.user.username)
        logger.debug(user.profile_picture)
        if user is not None:
            logger.debug(user.profile_picture)
            path = str(user.profile_picture)
            data = {
                "username": user.username,
                "email": user.email,
                "profile_picture": path,
                "favourite_language": user.favourite_language,
                "otp_secret": user.otp_secret,
                "is_2fa_enabled": user.is_2fa_enabled,
            }
            return Response(
                {"success": True, "message": "User information retrieved", "data": data},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"success": False, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

# class UserUpdateView(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]

#     def put(self, request):
#         user = request.user
#         data = request.data.copy()
#         logger.debug(data)

#         if "username" in data:
#             new_username = data["username"].strip()
#             if new_username == user.username or User.objects.filter(username=new_username).exists():
#                 return Response(
#                     {"success": False, "message": "Username is already taken"},
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#         if 'profile_picture' in request.FILES:
#             if user.profile_picture:  
#                 old_path = user.profile_picture.path  
#                 if os.path.exists(old_path):
#                     os.remove(old_path)

#             new_avatar_filename = f"{user.username}_avatar.jpg"
#             new_avatar_path = os.path.join(settings.MEDIA_ROOT, "avatars", new_avatar_filename)

#             with open(new_avatar_path, 'wb+') as destination:
#                 for chunk in request.FILES['profile_picture'].chunks():
#                     destination.write(chunk)

#             user.profile_picture.name = f"avatars/{new_avatar_filename}"  
#             user.save(update_fields=["profile_picture"])  

#         if "password" in data:
#             user.set_password(data["password"])
#             user.save(update_fields=["password"])

#         # Update user data
#         serializer = UserUpdateSerializer(user, data=data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             logger.debug(user.favourite_language)
#             return Response({"success": True, "message": "User profile updated"}, status=status.HTTP_200_OK)

#         return Response({"success": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)



class UserUpdateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data.copy()
        logger.debug(data)

        new_avatar_filename = None  # Initialize the variable

        if "username" in data:
            new_username = data["username"].strip()
            if new_username == user.username or User.objects.filter(username=new_username).exists():
                return Response(
                    {"success": False, "message": "Username is already taken"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if user.profile_picture:
                old_path = user.profile_picture.path
                logger.debug(f"Old path: {old_path}") 
                if os.path.exists(old_path):
                    new_avatar_filename = f"{new_username}_avatar.jpg"
                    new_avatar_path = os.path.join(settings.MEDIA_ROOT, "avatars", new_avatar_filename)
                    os.rename(old_path, new_avatar_path)

        if new_avatar_filename:
            # Update the user profile picture field
            user.profile_picture.name = f"avatars/{new_avatar_filename}"
            user.save(update_fields=["profile_picture"])

        if 'profile_picture' in request.FILES:
            if user.profile_picture:  
                old_path = user.profile_picture.path  
                if os.path.exists(old_path):
                    os.remove(old_path)

            new_avatar_filename = f"{user.username}_avatar.jpg"
            new_avatar_path = os.path.join(settings.MEDIA_ROOT, "avatars", new_avatar_filename)

            with open(new_avatar_path, 'wb+') as destination:
                for chunk in request.FILES['profile_picture'].chunks():
                    destination.write(chunk)

            user.profile_picture.name = f"avatars/{new_avatar_filename}"  
            user.save(update_fields=["profile_picture"])  

        if "password" in data:
            user.set_password(data["password"])
            user.save(update_fields=["password"])

        # Update user data
        serializer = UserUpdateSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "User profile updated"}, status=status.HTTP_200_OK)

        return Response({"success": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
class UserLogoutAPIView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            user.online_status = False
            user.save()

            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                blacklist_token(refresh_token)

            return Response(
                {"success": True, "message": "Logout successful"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": "An error occurred while logging out."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class OnlineUsersView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.online_status = request.data.get("status")
        user.save(update_fields=["online_status"])
        print(f"User {user.username} online status updated to {user.online_status}")
        return Response({"success": True, "message": "User online status updated"}, status=status.HTTP_200_OK)

class UserCheckAPIView(APIView):

    def to_integer(self, dt_time):
        return 10000 * dt_time.year + 100 * dt_time.month + dt_time.day

    def post(self, request):
        if not request.auth:
            return Response(
                {"success": False, "message": "JWT token not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        token = request.auth
        token_str = str(token)

        if not BlacklistedToken.objects.filter(token=token_str).exists() and token["exp"] > self.to_integer(datetime.now()):
            return Response(
                {"success": True, "message": "Token is valid."},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"success": False, "message": "Token is blacklisted or expired."},
                status=status.HTTP_404_NOT_FOUND,
            )
            
class UserDeleteView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Delete the user's profile picture if it exists
        if user.profile_picture:
            profile_picture_path = user.profile_picture.path
            if os.path.exists(profile_picture_path):
                os.remove(profile_picture_path)

        user.delete()
        return Response({"success": True, "message": "User deleted"}, status=status.HTTP_200_OK)
# =========================== FRIENDSHIP APIs ===========================

class AddFriendAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user  # The one ACCEPTING the friend request
        friend_username = request.data.get("friend_username")

        try:
            friend = User.objects.get(username=friend_username)

            # Check if friendship already exists
            if Friendship.objects.filter(user1=user, user2=friend).exists() or \
               Friendship.objects.filter(user1=friend, user2=user).exists():
                return Response({"success": False, "message": "You are already friends"}, status=status.HTTP_400_BAD_REQUEST)

            # Create friendship
            Friendship.objects.create(user1=user, user2=friend)

            # Remove request from user who accepted
            if friend_username in user.friend_requests_received:
                user.friend_requests_received.remove(friend_username)
                user.save(update_fields=["friend_requests_received"])

            # Remove request from sender
            if user.username in friend.friend_requests_sent:
                friend.friend_requests_sent.remove(user.username)
                friend.save(update_fields=["friend_requests_sent"])

            return Response({"success": True, "message": "Friendship added"}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class RemoveFriendAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user  # The one initiating the unfriend action
        friend_username = request.data.get("friend_username")

        try:
            friend = User.objects.get(username=friend_username)

            # Check if friendship exists
            friendship = Friendship.objects.filter(
                (Q(user1=user, user2=friend) | Q(user1=friend, user2=user))
            ).first()

            if not friendship:
                return Response({"success": False, "message": "Friendship does not exist"}, status=status.HTTP_400_BAD_REQUEST)

            # Delete the friendship
            friendship.delete()

            return Response({"success": True, "message": "Friend removed successfully"}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class UserSearchAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get("query")
        if query:
            users = User.objects.filter(username__icontains=query).exclude(username=request.user.username)
            response_data = [{
                "username": user.username,
                "email": user.email,
                "profile_picture": user.profile_picture,
                "online_status": user.online_status,
            } for user in users]
            return Response({"success": True, "message": "Search successful", "data": response_data}, status=status.HTTP_200_OK)
        return Response({"success": False, "message": "Query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

class CheckFriendshipAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, friend_username):
        try:
            friend = User.objects.get(username=friend_username)
            is_friends = Friendship.objects.filter(
                (Q(user1=request.user, user2=friend) | Q(user1=friend, user2=request.user))
            ).exists()
            return Response({"success": True, "data": {"is_friends": is_friends}}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class FriendListAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        friendships = Friendship.objects.filter(Q(user1=user) | Q(user2=user))
        friend_list = []

        for friendship in friendships:
            friend = friendship.user2 if friendship.user1 == user else friendship.user1
            friend_list.append({
                "username": friend.username,
                "profile_picture": str(friend.profile_picture),
                "online_status": friend.online_status,
            })
        return Response({"success": True, "data": friend_list, "message": "Friend List retrieved successfully"}, status=status.HTTP_200_OK)

class FriendRequestAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        friend_username = request.data.get("friend_username")

        # Ensure username is provided
        if not friend_username:
            return Response(
                {"success": False, "message": "Friend username is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            friend = User.objects.get(username=friend_username)

            # Check if the friend request already exists
            if user.username in friend.friend_requests_received:
                return Response(
                    {"success": False, "message": "Friend request already sent"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if user.username in friend.friend_requests_sent:
                return Response(
                    {"success": False, "message": "Friend request already sent"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Add the request to both users
            user.friend_requests_sent.append(friend_username)
            friend.friend_requests_received.append(user.username)

            # Save the updated fields
            user.save(update_fields=["friend_requests_sent"])
            friend.save(update_fields=["friend_requests_received"])

            return Response(
                {"success": True, "message": "Friend request sent"},
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"success": False, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def get(self, request):
        user = request.user
        return Response(
            {
                "success": True,
                "data": {
                    "friend_requests_sent": user.friend_requests_sent,
                    "friend_requests_received": user.friend_requests_received,
                },
                "message": "Friend requests retrieved successfully",
            },
            status=status.HTTP_200_OK,
        )

class MatchHistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.query_params.get("user")  # Get username from URL like ?user=Tony
        if username:
            user = User.objects.filter(username=username).first()
            if not user:
                return Response({"success": False, "message": "User not found."}, status=404)
        else:
            user = request.user
        
        match_history = MatchHistory.objects.filter(user=user)
    
        wins = match_history.filter(result="win").count()
        losses = match_history.filter(result="loss").count()

        serializer = MatchHistorySerializer(match_history, many=True)
        return Response({
            "success": True, 
            "wins": wins,
            "losses": losses,
            "matches": serializer.data}, status=status.HTTP_200_OK)
    
    def post(self, request):
        player1 = User.objects.filter(username=request.data["player1"]).first()
        player2 = User.objects.filter(username=request.data["player2"]).first()
        p1_s = request.data["p1Score"]
        p2_s = request.data["p2Score"]
        p1_score = int(request.data["p1Score"])
        p2_score = int(request.data["p2Score"])

        print(type(p1_s))
        print(type(p2_s))
        print(type(p1_score))
        print(type(p2_score))


        if not player1 or not player2:
            return Response({"success": False, "message": "One or both users not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Copy data and create two match history entries
        data1 = request.data.copy()
        data1["user"] = player1.id
        data1["opponent"] = request.data["player2"]
        data1["user_score"] = p1_score
        data1["opponent_score"] = p2_score

        data2 = request.data.copy()
        data2["user"] = player2.id
        data2["opponent"] = request.data["player1"]
        data2["user_score"] = p2_score
        data2["opponent_score"] = p1_score

        if p1_score > p2_score: 
            data1["result"] = "win"
            data2["result"] = "loss"
        elif p1_score < p2_score:   
            data1["result"] = "loss"
            data2["result"] = "win"
        else:
            data1["result"] = "draw"
            data2["result"] = "draw"

        print("DATA1")
        print(data1)
        print("DATA2")
        print(data2)

        serializer1 = MatchHistorySerializer(data=data1)
        serializer2 = MatchHistorySerializer(data=data2)

        if serializer1.is_valid() and serializer2.is_valid():
            serializer1.save()
            serializer2.save()
            return Response({"success": True, "message": "Added match to database for both players."}, status=status.HTTP_201_CREATED)

        return Response({"success": False, "message": serializer1.errors or serializer2.errors}, status=status.HTTP_400_BAD_REQUEST)
    
class MatchHistorySimpleView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.query_params.get("user")
        user = None
        if username:
            user = User.objects.filter(username=username).first()
            if not user:
                return Response({"success": False, "message": "User not found."}, status=404)
        else:
            return Response({"success": False, "message": "No username provided."}, status=404)

        match_history = MatchHistory.objects.filter(user=user)
    
        wins = match_history.filter(result="win").count()
        losses = match_history.filter(result="loss").count()

        return Response({
            "success": True, 
            "wins": wins,
            "losses": losses}, status=status.HTTP_200_OK)

class BlockedUserListAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        blocked_users = user.blocked_users
        return Response({"success": True, "data": blocked_users, "message": "Blocked List retrieved successfully"}, status=status.HTTP_200_OK)

class BlockUserAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        username = request.data.get("username")
        if not username:
            return Response({"error": "No user specified"}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure blocked_users is a list
        if not isinstance(user.blocked_users, list):
            user.blocked_users = []

        if username not in user.blocked_users:
            user.blocked_users.append(username)
            user.save(update_fields=["blocked_users"])

        return Response({"success": True, "message": "User blocked successfully"}, status=status.HTTP_200_OK)

class UnblockUserAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        username = request.data.get("username")
        if not username:
            return Response({"error": "No user specified"}, status=status.HTTP_400_BAD_REQUEST)

        if username in user.blocked_users:
            user.blocked_users.remove(username)
            user.save(update_fields=["blocked_users"])

        return Response({"success": True, "message": "User unblocked successfully"}, status=status.HTTP_200_OK)

# ================================== 2FA ============================================= #
class Generate2FAQRCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_2fa_enabled:
            return Response({"success": False, "message": "2FA is already enabled. Cannot generate another QR code."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a base32 secret key
        secret = pyotp.random_base32()
        user.otp_secret = secret
        user.save()

        # Generate the OTP URI
        otp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="ft_Transcendence")

        # Generate the QR code
        qr = qrcode.make(otp_uri)
        buffer = BytesIO()
        qr.save(buffer, format="PNG")
        buffer.seek(0)

        # Return the QR code image in the response
        return HttpResponse(buffer, content_type="image/png")

class Verify2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = Verify2FASerializer(data=request.data)
        if serializer.is_valid():
            otp = serializer.validated_data['otp']
            totp = pyotp.TOTP(user.otp_secret)
            if totp.verify(otp):
                user.is_2fa_enabled = True
                user.save()
                return Response({"success": True, "message": "OTP verified successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"success": False, "message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"success": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class Disable2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.otp_secret = None
        user.is_2fa_enabled = False
        user.save()
        return Response({"success": True, "message": "2FA disabled successfully."}, status=status.HTTP_200_OK)

class Confirm2FAEnabledView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_2fa_enabled:
            return Response({"success": True, "message": "2FA is already enabled."}, status=status.HTTP_200_OK)
        else:
            user.is_2fa_enabled = True
            user.save()
            return Response({"success": True, "message": "2FA enabled successfully."}, status=status.HTTP_200_OK)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        if user.is_2fa_enabled:
            # Remove access and refresh tokens if 2FA is enabled
            data.pop('access', None)
            data.pop('refresh', None)
            data['2fa_required'] = True

        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class Verify2FALoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        otp = request.data.get('otp')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        totp = pyotp.TOTP(user.otp_secret)
        if totp.verify(otp):
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'success': True,
                'message': "OTP verified successfully."
            }, status=status.HTTP_200_OK)
        else:
            return Response({"success": False, "message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

# #### REFRESH TOKEN ####
# class RefreshTokenView(APIView):
  
#     def post(self, request, *args, **kwargs):
#         logger.debug("In RefreshTokenView")
#         # Get the refresh token from the request data
#         refresh_token = request.data.get('refresh')
#         logger.debug(f"Received refresh token: {refresh_token}")
#         if not refresh_token:
#             return Response(
#                 {"error": "Refresh token is required"},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         try:
#             # Attempt to refresh the access token
#             refresh = RefreshToken(refresh_token)
#             new_access_token = str(refresh.access_token)

#             # Optionally, you can blacklist the old refresh token
#             # refresh.blacklist()

#             # Return the new access token
#             return Response(
#                 {"access": new_access_token},
#                 status=status.HTTP_200_OK,
#             )
#         except TokenError as e:
#             # Handle invalid or expired refresh tokens
#             return Response(
#                 {"error": str(e)},
#                 status=status.HTTP_401_UNAUTHORIZED,
#             )

