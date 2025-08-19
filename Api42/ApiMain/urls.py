from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from api42 import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('api42.urls')),
    path('auth/', include('api42.urls')),
    path('api/api/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Refreshing token
    path('api/api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    #path('api/token/', include('djoser.urls.jwt')),
    path('api/2fa/generate-qrcode/', views.Generate2FAQRCodeView.as_view(), name='generate_qrcode'),
    path('api/2fa/verify/', views.Verify2FAView.as_view(), name='verify_2fa'),
    path('api/2fa/disable/', views.Disable2FAView.as_view(), name='disable_2fa'),
    path('api/2fa/verify-login/', views.Verify2FALoginView.as_view(), name='verify_2fa_login'),
    path('api/2fa/confirm-enabled/', views.Confirm2FAEnabledView.as_view(), name='confirm_2fa_enabled'),
]

if settings.DEBUG or settings.FORCE_SERVE_MEDIA:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)