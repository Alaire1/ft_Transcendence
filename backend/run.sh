#!/bin/bash

# Load environment variables
export $(grep -v '^#' ../../.env | xargs)

# Start Redis container if it's not already running
container_ids=$(docker ps -a -q --filter "ancestor=redis:5")

if [ -z "$container_ids" ]; then
  echo "No Redis container found. Starting Redis..."
  docker run -p 6378:6378 -d redis:5
else
  echo "Redis container already running."
fi

# macOS: Start Docker Desktop if needed (not required on Linux)
# open -a "Docker Desktop"  # This line is only for macOS

# macOS: Check and run Redis container if not running (not required on Linux)
# if ! docker ps -q -f name=redis; then
#   echo "Starting Redis container..."
#   docker run -p 6378:6378 --name redis -d redis:5
# else
#   echo "Redis container already running."
# fi

# Create the virtual environment if it does not exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Run migrations
echo "Running migrations..."
python manage.py migrate > /dev/null 2>&1  # Suppress output

# Start Uvicorn server
echo "Starting Uvicorn server..."
uvicorn django_main.asgi:application --host 0.0.0.0 --port 8000 --reload



#venv deactivate
#source deactivate

#python3 -m venv venv

# close docker container
#container_ids=$(docker ps -a -q --filter "ancestor=redis:5")
#
## check, if Redis-Container 
#if [ -z "$container_ids" ]; then
#  echo "no Redis-Container found."
#else
#  # Redis-Container stop
#  echo "stop Redis-Container... $container_ids"
#  docker stop $container_ids
#
#  # Redis-Container delete
#  echo "remove Redis-Container... $container_ids"
#  docker rm $container_ids
#fi
#
## create virtual environment, if not existend
#if [ ! -d "venv" ]; then
#    python3 -m venv venv
#    echo "virtual env created"
#else
#    echo "virtual env already exsists"
#fi
#
## activate virtual environment
## hunt: this command only works if the script will be executed with 'source' 
## source setup_venv.sh
#
#echo "source venv/bin/activate"
#source venv/bin/activate
#
#
## open docker
#open -a "Docker Desktop" # for Mac
#
#sleep 3
#
## starting redis server
#docker run -p 6378:6378 -d redis:5
#
#echo "Starting Uvicorn server..."



#python3 chat_tutorial/mysite/manage.py runserver

#open "http://127.0.0.1:8000/chat/" &