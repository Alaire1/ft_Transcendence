import os
import socket
from pathlib import Path
import secrets
from dotenv import load_dotenv
from decouple import config
import environ

# Load environment variables from .env file
load_dotenv()

# Toggle debug mode based on environment
DEBUG = False

#HOST_IP = os.getenv("HOST_IP", socket.gethostbyname(socket.gethostname()))
HOST_IP = os.getenv("HOST_IP")

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'http')
SECURE_SSL_REDIRECT = False  # Ensures Django always uses HTTPS

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Generate a random secret key if not provided
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', secrets.token_urlsafe(50))

# Allowed hosts configuration
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Installed applications
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_extensions',
    'api42',
    'djoser',
]

# Middleware settings
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Root URL configuration
ROOT_URLCONF = 'ApiMain.urls'

# Template settings
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI application
WSGI_APPLICATION = 'ApiMain.wsgi.application'

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER_API'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST_API'),
        'PORT': os.getenv('DB_PORT_API'),
    }
}

# Django REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    #'ROTATE_REFRESH_TOKENS': False,
    #'BLACKLIST_AFTER_ROTATION': True,
    #'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.getenv("JWT_SIGNKEY"),
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
}

DJOSER = {
    "LOGIN_FIELD": "username",
    "SERIALIZERS": {
        "token_create": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    },
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization settings
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
USE_L10N = True

# Static files settings
STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

FORCE_SERVE_MEDIA = os.getenv('FORCE_SERVE_MEDIA', 'False') == 'True'

# Add media settings for profile picture uploads
MEDIA_URL = f"https://{HOST_IP}/media/"
MEDIA_ROOT = "/code/media"

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'api42.User'

USE_X_FORWARDED_HOST = True

CORS_ALLOWED_ORIGINS = [
     # Allow requests from the dynamic IP
    f"https://{HOST_IP}",
    "https://localhost", 
    "https://localhost:3000", 
    "https://localhost:8080",
]

ALLOWED_HOSTS = [
    HOST_IP,
    'localhost',
    '127.0.0.1',
    'frontend',
   
]
# ---------------- 42 INTRA 0AUTH SETTINGS ------------------------ #
# 42 API credentials
INTRA_UID_42 = os.getenv('INTRA_UID_42')
INTRA_SECRET_42 = os.getenv('INTRA_SECRET_42')
API_42_REDIRECT_URI = os.getenv('REDIRECT_URI')

# 42 INTRA auth URL
API_42_AUTH_URL = 'https://api.intra.42.fr/oauth/authorize'
# 42 Intra access token endpoint
API_42_ACCESS_TOKEN_ENDPOINT = 'https://api.intra.42.fr/oauth/token'
# 42 Intra entrypoint URL
API_42_INTRA_ENTRYPOINT_URL = 'https://api.intra.42.fr/v2/me'
# 42 Intra frontend callback URL
API_42_FRONTEND_CALLBACK_URL = f'http://{HOST_IP}/profile'
# one-time code lifetime in seconds
EXCHANGE_CODE_TIMEOUT = 30