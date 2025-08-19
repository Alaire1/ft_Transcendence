"""
<<<<<<<< HEAD:jopeters/Tony/chat_tutorial/mysite/mysite/wsgi.py
WSGI config for mysite project.
========
WSGI config for ApiMain project.
>>>>>>>> Backend:backend/ApiMain/wsgi.py

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ApiMain.settings')

application = get_wsgi_application()
