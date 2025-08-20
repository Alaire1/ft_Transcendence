
# ft_Transcendence

A web-based multiplayer Pong game built as a single-page application.  
It includes real-time gameplay, user authentication, and integrated chat, all powered by a Django backend and vanilla JavaScript frontend, fully containerized with Docker.

---
## Team
**[Anita](https://github.com/Alaire1)** **[Tony](https://github.com/tonywilliamspiano)** **[Noah](https://github.com/Nuloiz)** **[Jonas](https://github.com/jonaspeters85)** **[Arafa](https://github.com/ankinzin)**

---
## Architecture

### Backend (Django)
- Handles user management (registration, authentication)  
- WebSocket support (e.g., Django Channels) for real-time gameplay and chat  
- REST endpoints for user profile, game data, etc.

### Frontend (Vanilla JS SPA)
- Single-page application using HTML, CSS, and JavaScript  
- Connects via WebSockets for live game events and chat  
- Interfaces with Django’s REST API for authentication and game lifecycle

### Docker & Orchestration
- `Dockerfile` and `docker-compose.yml` included—for backend, frontend, and Nginx  
- Separate services allow containerized development and seamless deployment

---

## Features
🎮 Gameplay

Classic Pong game implemented in the browser

Real-time multiplayer matches over WebSockets

Tournament mode supporting multiple players in structured brackets

Matchmaking system (manual invites or automatic pairing)

Accurate ball & paddle physics handled server-side

Score tracking and persistence for each match

👤 User & Authentication

User registration and login system

JWT-based authentication for secure stateless API access

Secure password hashing with Django’s built-in system

Two-factor authentication (2FA) for enhanced account security

User profiles with stats (matches played, wins/losses, tournaments)

Customizable avatars & usernames

Session persistence and secure cookie handling

💬 Communication

Real-time chat system using WebSockets (Django Channels)

Global chat room for community interaction

Private one-to-one chat between players

Chat accessible before, during, and after games

🌐 Frontend (SPA)

Single-Page Application using Vanilla JavaScript, HTML5, and CSS3

Custom CSS for styling (not relying on external frameworks)

Asynchronous communication with backend via REST API (Django REST Framework) and WebSockets

Responsive design for multiple devices (desktop, tablet, mobile)

Dynamic DOM rendering for live updates (game state, chat, user lists)

Different themes/backgrounds for app sections (login, game, chat, etc.)

Multi-language support (internationalization)

⚙️ Backend (Django)

Built with Django + Django REST Framework (DRF)

JWT authentication flow with refresh tokens

Django Channels for WebSocket handling (real-time game + chat)

PostgreSQL (or SQLite in dev) for persistent storage

Modular app design (auth, game, chat, tournament management)

RESTful endpoints for authentication, user data, and match history

Role-based access control (if implemented)

Secure CSRF & CORS handling

🐳 Deployment & DevOps

Dockerized architecture:

backend (Django + DRF + Channels)

frontend (SPA served by Nginx)

nginx (reverse proxy + static assets)

db (PostgreSQL container)

Docker Compose for multi-container orchestration

Isolated networks between containers for secure communication

Environment configuration via .env file (SECRET_KEY, JWT settings, DB creds)

Ready for deployment in both local and cloud environments

🛠️ Development & Testing

Backend unit tests for authentication, WebSockets, and business logic

Database migrations with Django ORM

Logging and error handling for debugging and monitoring

Hot reload for frontend and backend during development

Linting & code style adherence
