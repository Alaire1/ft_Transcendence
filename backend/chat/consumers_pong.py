import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .debugcolors import colors, print_colored, print_colored_variable, pretty_print_active_rooms, print_user_group
from .chatroom import ChatRoom
from .game_state import GameState, Powerup
from .tournament import Tournament

import asyncio
import math
import random

game_states = {}
tournaments = {}

POINTS_TO_WIN = 3

class PongConsumer(AsyncWebsocketConsumer):
    is_game_active = False
    game = None
    room_group_name = ""
    username = ""
    available_games = "available_games"
    available_tournaments = "available_tournaments"
    tournament = None
    game_task = None

    async def connect(self):
        await self.accept()

    async def disconnect(self, close_data):
        print("Disconnecting!")
        print(self.room_group_name)
        if self.game_task:
            print("Canceling game task...")
            self.game_task.cancel()

        if self.username in tournaments:
            print("Deleting tournament...")
            del tournaments[self.username]
            print(tournaments)
            print("sending disconnect message...")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "host_disconnect"
                }
            )
            print("Discarding room.")
            if len(self.room_group_name) > 0:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
            return

        if self.username in game_states:
            print("Sending disconnect message")
            del game_states[self.username]
            await self.channel_layer.group_send(
                self.available_games,
                {
                    "type": "host_disconnect"
                }
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "host_disconnect"
                }
            )

            await self.channel_layer.group_send(
                self.available_games,
                {
                    "type": "send_games",
                    "games" : [username for username, game in game_states.items() if not game.closed]
                }
            )
            
        if len(self.room_group_name) > 0:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)

        if (data.get("action") == "create_tournament"):
            self.username = data.get("username")
            print("CREATING TOURNAMENT!")

            new_tournament = Tournament(self.username)
            tournaments[self.username] = new_tournament
            new_tournament.is_pong_plus = str(data.get("isPongPlus")).lower() == "true"

            print("IS PONG PLUS???")
            print(new_tournament.is_pong_plus)

            self.room_group_name = f"pong_tournament_{self.username}"
            print("Creator room group name: " + self.room_group_name)
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            self.tournament = new_tournament
            self.game = new_tournament.current_game

            await self.channel_layer.group_send(
                self.available_tournaments,
                {
                    "type": "send_tournaments",
                    "tournaments" : [name for name, tournament in tournaments.items() if not tournament.closed]
                }
            )

        if data.get("action") == "get_tournaments":
            print("Getting tournaments")
            await self.channel_layer.group_add(self.available_tournaments, self.channel_name)

            await self.send(text_data=json.dumps({
                "type": "available_tournaments",
                "tournaments": [name for name, tournament in tournaments.items() if not tournament.closed]
            }))

        if (data.get("action") == "join_tournament"):
            tournament_name = data.get("tournamentToJoin")
            self.username = data.get("username")
            print("JOINING Tournament!")

            tournament = tournaments[tournament_name]
            tournament.add_player(self.username)

            self.room_group_name = f"pong_tournament_{tournament_name}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            self.game = tournament.current_game

            print("Notifying group of joinage: " + self.room_group_name)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "notify_tournament",
                    "players" : list(tournament.players)
                }
            )

        if (data.get("action") == "leave_tournament"):
            tournament_name = data.get("ownerUsername")
            self.username = data.get("username")
            print("LEAVING Tournament!")

            tournament = tournaments[tournament_name]
            tournament.remove_player(self.username)

            print("Notifying group of leaving: " + self.room_group_name)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "notify_tournament",
                    "players" : list(tournament.players)
                }
            )

        if data.get("action") == "get_games":
            print("Getting games")
            await self.channel_layer.group_add(self.available_games, self.channel_name)

            games = [username for username, game in game_states.items() if not game.closed]
            print(games)

            await self.send(text_data=json.dumps({
                "type": "available_games",
                "games": games
            }))

        if data.get("action") == "delete_game":
            print("Deleting game...")
            if self.username in game_states:
                del game_states[self.username]
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "host_disconnect"
                }
            )
            await self.channel_layer.group_send(
                self.available_games,
                {
                    "type": "send_games",
                    "games" : [username for username, game in game_states.items() if not game.closed]
                }
            )

        if data.get("action") == "delete_tournament":
            print("Deleting tournament...")
            if self.username in tournaments:
                del tournaments[self.username]

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "host_disconnect"
                }
            )

            await self.channel_layer.group_send(
                self.available_tournaments,
                {
                    "type": "send_tournaments",
                    "tournaments" : [name for name, tournament in tournaments.items() if not tournament.closed]
                }
            )

        if data.get("action") == "create":
            self.username = data.get("username")
            new_game = GameState(self.username)
            new_game.is_pong_plus = str(data.get("isPongPlus")).lower() == "true"

            print("New game created with player1: " + new_game.player1)
            print("IS PONG PLUS???")
            print(new_game.is_pong_plus)

            game_states[self.username] = new_game
            self.game = new_game

            self.room_group_name = f"pong_game_{self.username}"

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            print(f"Added to room: {self.room_group_name}")

            await self.channel_layer.group_send(
                self.available_games,
                {
                    "type": "send_games",
                    "games" : [username for username, game in game_states.items() if not game.closed]
                }
            )


        if data.get("action") == "join":
            game_to_join = data.get("gameToJoin")
            self.username = data.get("username")
            print("JOINING GAME!")
            self.game = game_states[game_to_join]
            self.game.closed = True
            print("P2 game is: ")
            print(self.game)

            await self.game.set_player2(self.username)

            await self.channel_layer.group_send(
                self.available_games,
                {
                    "type": "send_games",
                    "games" : [username for username, game in game_states.items() if not game.closed]
                }
            )

            self.room_group_name = f"pong_game_{game_to_join}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            print(f"Added to room: {self.room_group_name}")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "notify_opponent",
                    "username" : self.username
                }
            )

        if data.get("action") == "u":
            await self.game.move_paddle_up(data.get("player"))

        if data.get("action") == "d":
            await self.game.move_paddle_down(data.get("player"))

        if data.get("action") == "start":
            print("START GAME")

            if not PongConsumer.is_game_active:  # Start game logic only once
                PongConsumer.is_game_active = True

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "start",
                    "player1": self.game.player1,
                    "player2": self.game.player2
                }
            )
            
            await asyncio.sleep(1)
            self.game_task = asyncio.create_task(self.update_ball_position(self.game))
                
        if data.get("action") == "start_tournament":
            print("Start tournament!")

            self.tournament.generate_matches()
            self.tournament.closed = True

            await self.channel_layer.group_send(
                self.available_tournaments,
                {
                    "type": "send_tournaments",
                    "tournaments" : [name for name, tournament in tournaments.items() if not tournament.closed]
                }
            )
            
            await self.tournament.set_up_next_match()
            current_game = self.tournament.current_game

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "start_tournament",
                    "players": json.dumps(self.tournament.players),
                    "player1": current_game.player1,
                    "player2": current_game.player2
                }
            )

            await self.send(text_data=json.dumps({
                "type": "start_tournament",
                "players": json.dumps(self.tournament.players),
                "player1": current_game.player1,
                "player2": current_game.player2
            }))

            for i in range(5, 0, -1):
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "countdown",
                        "number": i
                    }
                )
                await self.send(text_data=json.dumps({
                    "type": "countdown",
                    "number": i
                }))
                await asyncio.sleep(1)

            print(current_game.player1)
            print(current_game.player2)
            print("Starting game!")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "next_match",
                    "player1": current_game.player1,
                    "player2": current_game.player2
                }
            )
            await self.send(text_data=json.dumps({
                    "type": "next_match",
                    "player1": current_game.player1,
                    "player2": current_game.player2
                }))
            
            await asyncio.sleep(1)
            self.game_task = asyncio.create_task(self.update_ball_position(current_game))

    async def start(self, event):
        print("Received event in start: ", event)

        await self.send(text_data=json.dumps({
            "type": "start",
            "player1": event["player1"],
            "player2": event["player2"]
        }))

    async def start_tournament(self, event):
        await self.send(text_data=json.dumps({
        "type": "start_tournament",
        "players": event["players"],
        "player1": event["player1"],
        "player2": event["player2"]
        }))

    async def update_ball_position(self, game):
        await game.reset_ball()

        try:
            while True:
                point_scored = False
                await game.check_collisions()

                if game.is_pong_plus:
                    await self.handle_powerups(game)

                if (game.ballX >= 1 or game.ballX <=0):
                    point_scored = True
                    if game.ballX >= 1:
                        await game.update_p1_score()
                    else:
                        await game.update_p2_score()

                    await game.reset_ball()
                    
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "point_scored", 
                            "player1Score": game.player_1_score, 
                            "player2Score": game.player_2_score
                        }
                    )

                    game.reset_paddle_speed()

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "paddle_speed", 
                            "paddle": "LEFT", 
                            "speed": "NONE"
                        }
                        )

                if (game.player_1_score >= POINTS_TO_WIN or game.player_2_score >= POINTS_TO_WIN):
                    if (self.tournament != None):
                        await self.start_next_match()
                        return

                    winner = game.player1
                    if game.player_2_score >= POINTS_TO_WIN:
                        winner = game.player2

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "game_over", 
                            "winner": winner,
                            "player1": game.player1,
                            "player2": game.player2,
                            "p1Score": game.player_1_score,
                            "p2Score": game.player_2_score
                        })
                    del game_states[self.username]
                    return

                if point_scored:
                    # Broadcast updated ball position to the group, so that the ball resets
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "update_ball",
                            "bx": game.ballX,
                            "by": game.ballY,
                            "p1": game.paddle_1_position,
                            "p2": game.paddle_2_position,
                        }
                    )                    
                    await asyncio.sleep(1)

                await game.update_ball_position()

                # Broadcast updated ball position to the group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "update_ball",
                        "bx": game.ballX,
                        "by": game.ballY,
                        "p1": game.paddle_1_position,
                        "p2": game.paddle_2_position,
                    }
                )
                
                await asyncio.sleep(0.02)
        except asyncio.CancelledError:
            # Handle task cancellation (e.g., on disconnect)
            pass

    async def start_next_match(self):
        await self.tournament.update_table_info()

        player_info_list = [
           {
                'name': player_name,
                'wins': player.to_dict()['wins'],
                'losses': player.to_dict()['losses'],
                'pointsFor': player.to_dict()['points_for'],
                'pointsAgainst': player.to_dict()['points_against']
            }
            for player_name, player in self.tournament.table_info.items()
        ]

        json_data = json.dumps(player_info_list)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "table_info",
                "info": json_data
            }
        )

        player1 = self.tournament.current_game.player1
        player2 = self.tournament.current_game.player2
        player_1_score = self.tournament.current_game.player_1_score
        player_2_score = self.tournament.current_game.player_2_score

        if self.tournament.is_over():
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "tournament_over",
                    "player1": player1,
                    "player2": player2,
                    "p1Score": player_1_score,
                    "p2Score": player_2_score,
                }
            )
            del tournaments[self.username]
            return

        await self.tournament.set_up_next_match()
        current_game = self.tournament.current_game

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "match_over",
                "player1": player1,
                "player2": player2,
                "p1Score": player_1_score,
                "p2Score": player_2_score,
                "nextPlayer1": current_game.player1,
                "nextPlayer2": current_game.player2
            }
        )

        for i in range(10, 0, -1):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "countdown",
                    "number": i
                }
            )
            await asyncio.sleep(1)

        # Broadcast updated ball position to the group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "update_ball",
                "bx": current_game.ballX,
                "by": current_game.ballY,
                "p1": current_game.paddle_1_position,
                "p2": current_game.paddle_2_position,
            }
        )

        print("start next match...")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "next_match",
                "player1": current_game.player1,
                "player2": current_game.player2
            }
        )

        await asyncio.sleep(1)
        self.game_task = asyncio.create_task(self.update_ball_position(current_game))

    async def update_ball(self, event):
        ballX = event["bx"]
        ballY = event["by"]
        paddle1 = event["p1"]
        paddle2 = event["p2"]

        await self.send(text_data=json.dumps({
            "type": "bu",
            "bx": ballX,
            "by": ballY,
            "p1": paddle1,
            "p2": paddle2
        }))

    async def point_scored(self, event):
        await self.send(text_data=json.dumps({
            "type": "point_scored",
            "player1Score": event["player1Score"],
            "player2Score": event["player2Score"]
        }))

    async def game_over(self, event):
        winner = event["winner"]

        await self.send(text_data=json.dumps({
            "type": "game_over", 
            "winner": winner,
            "player1": event["player1"],
            "player2": event["player2"],
            "p1Score": event["p1Score"],
            "p2Score": event["p2Score"]
        }))

    async def notify_opponent(self, event):
        name = event["username"]
        print("Notifying opponent that " + name + " has joined!")

        await self.send(text_data=json.dumps({
            "type": "notify_opponent",
            "username": name
        }))

    async def notify_tournament(self, event):
        players = event["players"]

        await self.send(text_data=json.dumps({
            "type": "notify_tournament",
            "players": players
        }))

    async def send_games(self, event):
        print("Sending available games!")

        await self.send(text_data=json.dumps({
            "type": "available_games",
            "games": event["games"]
        }))

    async def send_tournaments(self, event):
        print("Sending available games!")

        await self.send(text_data=json.dumps({
            "type": "available_tournaments",
            "tournaments": event["tournaments"]
        }))

    async def next_match(self, event):
        print("Starting next match!")

        await self.send(text_data=json.dumps({
            "type": "next_match",
            "player1": event["player1"],
            "player2": event["player2"]
        }))

    async def table_info(self, event):
        print("Sending table info...")

        await self.send(text_data=json.dumps({
            "type": "table_info",
            "info": event["info"]
        }))

    async def tournament_over(self, event):
        print("Sending tournament end...")
        self.tournament = None

        await self.send(text_data=json.dumps({
            "type": "tournament_over",
            "player1": event["player1"],
            "player2": event["player2"],
            "p1Score": event["p1Score"],
            "p2Score": event["p2Score"]
        }))

        if len(self.room_group_name) > 0:
            print("Discarding room group for tournament for user: " + self.username)
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )



    async def match_over(self, event):
        print("Sending match end...")

        await self.send(text_data=json.dumps({
            "type": "match_over",
            "player1": event["player1"],
            "player2": event["player2"],
            "p1Score": event["p1Score"],
            "p2Score": event["p2Score"],
            "nextPlayer1": event["nextPlayer1"],
            "nextPlayer2": event["nextPlayer2"],
        }))

    async def host_disconnect(self, event):
        print("Host disconnected...")
        self.tournament = None
        self.game = None

        await self.send(text_data=json.dumps({
            "type": "host_disconnect"
        }))

        if len(self.room_group_name) > 0:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def countdown(self, event):
        await self.send(text_data=json.dumps({
            "type": "countdown",
            "number": event["number"]
        }))

    async def spawn_powerup(self, event):
        print("Sending spawn powerup event")

        await self.send(text_data=json.dumps({
            "type": "spawn_powerup",
            "powerup_type": event["powerup_type"],
            "x": event["x"],
            "y": event["y"],
            "height": event["height"],
            "width": event["width"],
            "idx": event["idx"],
        }))

    async def remove_powerup(self, event):
        await self.send(text_data=json.dumps({
            "type": "remove_powerup",
            "powerup_type": event["powerup_type"],
            "idx": event["idx"],
        }))

    async def paddle_speed(self, event):
        print("Paddle speed update")

        await self.send(text_data=json.dumps({
            "type": "paddle_speed",
            "paddle": event["paddle"],
            "speed": event["speed"]
        }))

    async def handle_powerups(self, game):
        # 🟢 Check if the ball hits a power-up
                collected_powerups = [p for p in game.powerups if p.was_hit]
                for powerup in collected_powerups:
                    game.apply_powerup(powerup)  # Handle the powerup effect
                    game.powerups.remove(powerup)

                    if powerup.type == "COIN" or powerup.type == "DANGER":
                        await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "point_scored", 
                            "player1Score": game.player_1_score, 
                            "player2Score": game.player_2_score
                        }
                    )
                    else:
                        if powerup.type == "SLOW":
                            paddle = "RIGHT" if powerup.player_1_hit else "LEFT"
                        if powerup.type == "FAST":
                            paddle = "LEFT" if powerup.player_1_hit else "RIGHT"
                        await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "paddle_speed", 
                            "paddle": paddle, 
                            "speed": powerup.type
                        }
                        )

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "remove_powerup",
                            "powerup_type": powerup.type,
                            "idx": powerup.id
                        }
                    )

                # 🟢 Ensure there are always 3 power-ups
                while len(game.powerups) < 3:
                    new_powerup = Powerup(random.choices(
                        ["SLOW", "FAST", "COIN", "DANGER"],  # Options
                        weights=[35, 35, 20, 10],  # Corresponding probabilities
                        k=1  # Number of items to choose
)                   [0])
                    game.powerups.append(new_powerup)

                    # Notify frontend about the new power-up
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "spawn_powerup",
                            "powerup_type": new_powerup.type,
                            "x": new_powerup.x,
                            "y": new_powerup.y,
                            "height": new_powerup.height,
                            "width": new_powerup.width,
                            "idx": new_powerup.id
                        }
                    )