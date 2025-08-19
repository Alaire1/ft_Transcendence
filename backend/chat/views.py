# chat/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json


def index(request):
    return render(request, "chat/index.html")

def room(request, room_name):
    return render(request, "chat/room.html", {"room_name": room_name})

def chat_main(request):
    return render(request, 'chat/main_chat.html')