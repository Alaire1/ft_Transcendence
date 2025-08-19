# chat/urls.py
from django.urls import path

from . import views


urlpatterns = [
    #path("", views.index, name="index"),
    #path("<str:room_name>/", views.room, name="room"),
    #path('', views.chat_main, name='chat_main'),  # Nur eine Hauptseite für den Chat
    path('', views.chat_main, name='chat_main'),
]
