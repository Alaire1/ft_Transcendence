COMPOSE_FILE := docker-compose.yml
ENV_FILE := .env

SERVICES := frontend backend redis nginx dbapi api42

.PHONY: up down build restart logs volumes prune run-$(SERVICE) exec-$(SERVICE)

up:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up -d

down:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down

clean:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down --rmi all --volumes --remove-orphans
	docker system prune -a --volumes -f
	find Api42/media/avatars/ -type f ! -name 'default_picture.png' -delete

build:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) build --no-cache
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up -d

cache:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) build --no-cache
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up

restart:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) restart

logs:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) logs -f

volumes:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up -d

prune:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down --rmi all --volumes --remove-orphans
	docker volume prune -f

run $(SERVICE):
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) run --rm $(SERVICE)

exec $(SERVICE):
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) exec $(SERVICE) /bin/bash


rebuild $(SERVICE):
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up --build -d $(SERVICE)

clean_data:
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down --remove-orphans
	docker network prune -f