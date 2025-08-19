# game_state.py
import asyncio
import math
import random

class Powerup:
    _id_counter = 0  # Class-level counter

    def __init__(self, powerup_type):
        self.type = powerup_type
        self.x = random.uniform(0.3, 0.7)
        self.y = random.uniform(0.1, 0.9)
        self.height = 0.05
        self.width = 0.05
        self.was_hit = False
        self.player_1_hit = False
        self.id = Powerup._generate_id()  # Assign a unique ID

    @classmethod
    def _generate_id(cls):
        """Generates a unique ID for each powerup."""
        cls._id_counter += 1
        return cls._id_counter

POWERUP_TYPES = ["COIN", "SLOW", "FAST", "DANGER"]
MAX_BOUNCE_ANGLE = math.pi / 4  # 45 degrees
INITIAL_VELOCITY = 0.013
SPEED_MULTIPLIER = 1.02
MAX_SPEED = 0.02
PADDLE_DEFAULT_INCREMENT = -0.01
PADDLE_FAST_INCREMENT = -0.017
PADDLE_SLOW_INCREMENT = -0.007

class GameState:

    def __init__(self, player1):
        self.is_game_active = False
        self.paddle_1_position = 0.4
        self.paddle_2_position = 0.4
        self.paddle_1_speed = PADDLE_DEFAULT_INCREMENT
        self.paddle_2_speed = PADDLE_DEFAULT_INCREMENT
        self.ballX = 0.5
        self.ballY = 0.5
        self.velocityX = INITIAL_VELOCITY
        self.velocityY = 0
        self.player_1_score = 0
        self.player_2_score = 0
        self.player1 = player1
        self.player2 = None
        self.lock = asyncio.Lock()  # To prevent race conditions
        self.closed = False
        self.speed = math.sqrt(self.velocityX ** 2 + self.velocityY ** 2)  # Preserve speed
        self.powerups = []
        self.is_pong_plus = False


    async def move_paddle_up(self, player):
        async with self.lock:
            if player == "1" and self.paddle_1_position > 0:
                self.paddle_1_position += self.paddle_1_speed
            if player == "2" and self.paddle_1_position > 0:
                self.paddle_2_position += self.paddle_2_speed

    async def move_paddle_down(self, player):
        async with self.lock:
            if player == "1" and self.paddle_1_position < 1:
                self.paddle_1_position -= self.paddle_1_speed
            if player == "2" and self.paddle_1_position < 1:
                self.paddle_2_position -= self.paddle_2_speed

    async def update_ball_position(self):
        async with self.lock:
            self.ballX += self.velocityX
            self.ballY += self.velocityY

    async def reset_scores(self):
        self.player_1_score = 0
        self.player_2_score = 0

    async def reset_ball(self):
        print("Reset ball")
        async with self.lock:
            self.paddle_1_position = 0.4
            self.paddle_2_position = 0.4
            self.ballX = 0.5
            self.ballY = 0.5
            if (self.velocityX > 0):
                self.velocityX = -1 * INITIAL_VELOCITY
            else:
                self.velocityX = INITIAL_VELOCITY
            self.velocityY = 0
            self.speed = math.sqrt(self.velocityX ** 2 + self.velocityY ** 2)  # Preserve speed
        print("Velocity X is: ")
        print(self.velocityX)


    async def set_player1(self, player1):
        self.player1 = player1

    async def set_player2(self, player2):
        self.player2 = player2


    async def check_collisions(self):
        async with self.lock:
            # Wall collisions
            if (self.ballY >= 0.98 and self.velocityY > 0):
                self.velocityY = -self.velocityY
            if (self.ballY <= 0.02 and self.velocityY < 0):
                self.velocityY = -self.velocityY

            # Paddle 1 collision (left side)
            if 0.02 < self.ballX < 0.04:
                if self.paddle_1_position <= self.ballY <= self.paddle_1_position + 0.2:
                    paddle_center = self.paddle_1_position + 0.1  # Middle of the paddle
                    offset = (self.ballY - paddle_center) / 0.1  # Normalize (-1 to 1)
    
                    bounce_angle = offset * MAX_BOUNCE_ANGLE
                    speed = math.sqrt(self.velocityX ** 2 + self.velocityY ** 2)  # Preserve speed

                    self.velocityX = speed * math.cos(bounce_angle)
                    self.velocityY = speed * math.sin(bounce_angle)

                    # Ensure the ball moves in the correct direction
                    if self.velocityX < 0:
                        self.velocityX *= -1

                    await self.increase_speed()

            # Paddle 2 collision (right side)
            if 0.94 < self.ballX < 0.96:
                if self.paddle_2_position <= self.ballY <= self.paddle_2_position + 0.2:
                    paddle_center = self.paddle_2_position + 0.1  # Middle of the paddle
                    offset = (self.ballY - paddle_center) / 0.1  # Normalize (-1 to 1)

                    bounce_angle = offset * MAX_BOUNCE_ANGLE

                    self.velocityX = self.speed * math.cos(bounce_angle)
                    self.velocityY = self.speed * math.sin(bounce_angle)

                    # Ensure the ball moves in the correct direction
                    if self.velocityX > 0:
                        self.velocityX *= -1

                    await self.increase_speed()

        for p in self.powerups:
            hit = self.ball_hits_powerup(p)
            if hit:
                p.was_hit = True
                if (self.velocityX > 0):
                    p.player_1_hit = True
            

    def ball_hits_powerup(self, powerup):
        powerup_left = powerup.x
        powerup_right = powerup.x + powerup.width
        powerup_top = powerup.y
        powerup_bottom = powerup.y + powerup.height

        return (
            self.ballX >= powerup_left and
            self.ballX <= powerup_right and
            self.ballY >= powerup_top and
            self.ballY <= powerup_bottom
        )


    async def update_p1_score(self):
        async with self.lock:
            self.player_1_score += 1

    async def update_p2_score(self):
        async with self.lock:
            self.player_2_score += 1

    async def reset(self):
        print("Reset game!")
        self.scores["P1"] = 0
        self.scores["P2"] = 0

    async def increase_speed(self):
        self.speed = min(self.speed * SPEED_MULTIPLIER, MAX_SPEED)  # Cap the max speed

        angle = math.atan2(self.velocityY, self.velocityX)  # Keep the same direction

        self.velocityX = self.speed * math.cos(angle)
        self.velocityY = self.speed * math.sin(angle)
    
    def reset_paddle_speed(self):
        self.paddle_1_speed = PADDLE_DEFAULT_INCREMENT
        self.paddle_2_speed = PADDLE_DEFAULT_INCREMENT

    def apply_powerup(self, powerup):
        if powerup.player_1_hit:
            if powerup.type == "COIN":
                self.player_1_score += 1
            if powerup.type == "DANGER" and self.player_2_score > 0:
                self.player_2_score -= 1
        else:
            if powerup.type == "COIN":
                self.player_2_score += 1
            if powerup.type == "DANGER" and self.player_1_score > 0:
                self.player_1_score -= 1

        if powerup.type == "FAST":
            if powerup.player_1_hit:
                self.paddle_1_speed = PADDLE_FAST_INCREMENT
            else: 
                self.paddle_2_speed = PADDLE_FAST_INCREMENT

        if powerup.type == "SLOW":
            if powerup.player_1_hit:
                self.paddle_2_speed = PADDLE_SLOW_INCREMENT
            else: 
                self.paddle_1_speed = PADDLE_SLOW_INCREMENT        
