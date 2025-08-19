from django.apps import AppConfig
from django.core.management import call_command


class Api42Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api42'

class MyAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api42"

    def ready(self):
        try:
            call_command("create_superuser")
        except Exception as e:
            print(f"Error creating superuser: {e}")