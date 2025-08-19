#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
from django.contrib.auth import get_user_model
from decouple import config
import os
import sys


def create_superuser():
    """Automatically create a superuser based on environment variables."""
    try:
        User = get_user_model()

        # Access superuser credentials from the environment (via django-decouple)
        username = config("SUPERUSER_NAME", default=None)
        email = config("SUPERUSER_EMAIL", default=None)
        password = config("SUPERUSER_PASS", default=None)

        if username and email and password:
            if not User.objects.filter(username=username).exists():
                User.objects.create_superuser(username=username, email=email, password=password)
                print(f"Superuser {username} created successfully.")
            else:
                print(f"Superuser {username} already exists.")
        else:
            print("Superuser credentials not found in environment variables.")

        # Test code to populate the database...
        print("Populating database with various users for test...")
        
        if not User.objects.filter(username="Tony").exists():
            User.objects.create_user(username="Tony", email="a@123.de", password="password123", display_name="Tony")
            print("Created Tony!")

        if not User.objects.filter(username="Anita").exists():
            User.objects.create_user(username="Anita", email="b@123.de", password="password123", display_name="Anita")
            print("Created Anita!")

        if not User.objects.filter(username="Jonas").exists():
            User.objects.create_user(username="Jonas", email="c@123.de", password="password123", display_name="Jonas")
            print("Created Jonas!")

        if not User.objects.filter(username="Noah").exists():
            User.objects.create_user(username="Noah", email="d@123.de", password="password123", display_name="Noah")
            print("Created Noah!")

    except Exception as e:
        print(f"Error creating superuser: {e}")


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ApiMain.settings")
    try:
        from django.core.management import execute_from_command_line
        if len(sys.argv) > 1 and sys.argv[1] == "runserver":
            import django
            django.setup()
            create_superuser()
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
