# Use the official Python base image
FROM python:3.9

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt /app/requirements.txt

# Install system dependencies (SQLite3 in this case)
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# Install Python dependencies from requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the rest of the application into the container - Comment this for local development!
COPY . /app/

# Expose the port that Uvicorn will run on
EXPOSE 8000

# Set environment variables to avoid writing .pyc files and to ensure unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the default command to run Django migrations and start the application
CMD ["sh", "-c", "python manage.py migrate && uvicorn django_main.asgi:application --host 0.0.0.0 --port 8000 --reload"]