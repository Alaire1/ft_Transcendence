# chat/routing.py
from django.urls import re_path

from . import consumers, consumers_pong  # Import test consumer

websocket_urlpatterns = [
    re_path(r"back/wss/chat/(?P<room_name>\w+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"back/wss/pong/$", consumers_pong.PongConsumer.as_asgi()),
]
