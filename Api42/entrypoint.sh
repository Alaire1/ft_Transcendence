#!/bin/sh

# Wait for the database to be ready before proceeding
echo "Waiting for database to be ready..."
echo "DB_HOST_API: ${DB_HOST_API}"
echo "DB_USER_API: ${DB_USER_API}"
echo "DB_PORT_API: ${DB_PORT_API}"

until pg_isready -h ${DB_HOST_API} -U ${DB_USER_API} -p ${DB_PORT_API}; do
  >&2 echo "Api42 starting..."
  sleep 2
done

>&2 echo "Database is ready."

# Make migrations
echo "Making migrations..."
python manage.py makemigrations

# Migrate auth tables
echo "Migrating auth tables..."
python manage.py migrate auth

# Run all migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
username = '${SUPERUSER_NAME}';
email = '${SUPERUSER_Email}';
password = '${SUPERUSER_PASS}';
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password);
    print(f'Superuser {username} created successfully.');
else:
    print(f'Superuser {username} already exists.');
"

# Run the Django development server
echo "Starting the Django development server..."
python manage.py runserver 0.0.0.0:8080