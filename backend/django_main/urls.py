from django.contrib import admin
from django.urls import include, path
from . import views

urlpatterns = [
    path('back/chat/', include("chat.urls")),
    path('admin/', admin.site.urls),
    path('back/test/', views.test_view, name='test'), # Route for the form submission
    path('game/', views.pong_game, name='pong_game'),  # Route for the Pong game
]