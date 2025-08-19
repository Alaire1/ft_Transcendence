from .game_state import GameState

# TODO - idea - use dataclasses here instead? Similar to java records. 
class PlayerInfo:
    def __init__(self):
        self.wins = 0
        self.losses = 0
        self.points_for = 0
        self.points_against = 0

    def to_dict(self):
        return {
            "wins": self.wins,
            "losses": self.losses,
            "points_for": self.points_for,
            "points_against": self.points_against
        }
    
    def __repr__(self):
        return f"PlayerInfo(name={self.name}, wins={self.wins}, losses={self.losses}, points_for={self.points_for}, points_against={self.points_against})"


class Match:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.p1_score = 0
        self.p2_score = 0

    def set_score(self, p1_score, p2_score):
        self.p1_score = p1_score
        self.p2_score = p2_score

    def __repr__(self):
        return f"Match({self.player1} vs {self.player2}, Score: {self.p1_score}-{self.p2_score})"


class Tournament:
    def __init__(self, owner):
        self.players = []
        self.owner = owner
        self.table_info = {}
        self.matches = []
        self.closed = False
        self.game_index = 0
        self.current_game = GameState("Init")
        self.add_player(owner)
        self.over = False
        self.closed = False
        self.is_pong_plus = False

    def is_over(self):
        return self.over

    def add_player(self, player_name):
        self.players.append(player_name)
        self.table_info[player_name] = (PlayerInfo())

    def remove_player(self, player_name):
        if player_name in self.players:
            self.players.remove(player_name)  # Remove from players list
        if player_name in self.table_info:
            del self.table_info[player_name]  # Remove from dictionary

    def schedule_match(self, player1, player2):
        if player1 in self.players and player2 in self.players:
            self.matches.append(Match(player1, player2))
        else:
            print(f"Error: One or both players are not in the tournament.")

    async def update_table_info(self):
        info_player_1 = self.table_info[self.current_game.player1]
        info_player_2 = self.table_info[self.current_game.player2]

        info_player_1.points_for += self.current_game.player_1_score
        info_player_1.points_against += self.current_game.player_2_score

        info_player_2.points_for += self.current_game.player_2_score
        info_player_2.points_against += self.current_game.player_1_score

        if (self.current_game.player_1_score > self.current_game.player_2_score):
            info_player_1.wins += 1
            info_player_2.losses += 1
        else:
            info_player_2.wins += 1
            info_player_1.losses += 1

    async def set_up_next_match(self):
        next_match = self.matches[self.game_index]
        self.game_index += 1

        if self.game_index >= len(self.matches):
            print("Setting tournament to over.")
            self.over = True

        print("Next match p1: " + next_match["player1"])
        print("Next match p2: " + next_match["player2"])

        if self.is_pong_plus:
            self.current_game.is_pong_plus = True
            self.current_game.powerups = []

        await self.current_game.reset_ball()
        await self.current_game.reset_scores()

        await self.current_game.set_player1(next_match["player1"])
        await self.current_game.set_player2(next_match["player2"])


    def generate_matches(self):
        matches = []
        player_handles = self.players
        num_players = len(player_handles)

        # Add a dummy player if the number of players is odd
        is_odd = num_players % 2 != 0
        if is_odd:
            player_handles.append("BYE")

        num_rounds = len(player_handles) - 1

        for round_num in range(num_rounds):
            round_matches = []

            for i in range(len(player_handles) // 2):
                p1_name = player_handles[i]
                p2_name = player_handles[-(i + 1)]

                if p1_name != "BYE" and p2_name != "BYE":
                    round_matches.append({"player1": p1_name, "player2": p2_name, "p1_score": None, "p2_score": None})

            matches.extend(round_matches)

            # Rotate players (except the first one) for the next round
            player_handles.insert(1, player_handles.pop())

        # Remove "BYE" if it was added
        if is_odd:
            player_handles.remove("BYE")

        self.matches = matches
    
    def start(self):
        self.matches = self.generate_matches(self.players)

    def __repr__(self):
        return f"Tournament(Owner: {self.owner}, Players: {self.players}, Matches: {self.matches})"