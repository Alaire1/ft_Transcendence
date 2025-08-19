from .debugcolors import print_colored, print_colored_variable

class GameInvite:
    def __init__(self, player1, player2):
        self.player1 = player1            # the user_name who startet the invitation
        self.player2 = player2            # the user_name who get the inviation
        self.accepted = False        # state if the invitation is accecpted 
        self.game_started = False    # true when Game is started
        self.game_finished = False   # true when Game is finished 
        
    def arePlayers_in_List(list, player1, player2):
        #print_colored("arePlayers_in_List()", "yellow")
        for i in range(0, len(list)):
            #print(str(i) + " Player1: " + list[i].player1)
            #print(str(i) + " Player2: " + list[i].player2)
            if (list[i].player1 == player1 and list[i].player2 == player2):
                #print(">> True")
                return True
        return False
    
    # return the line(s) where the player is; as player1 and player2
    def isPlayer_in_List(list, player):
        for i in range(0, len(list)):
            if (list[i].player1 == player or list[i].player2 == player):
                return i
        return -1
    
    def delInviteWithPlayer(list, player):
        print_colored_variable("delInviteWithPlayer()", player, "yellow")

        while (GameInvite.isPlayer_in_List(list, player) != -1):
            print("\tdel " + player + " in game_invites at " + str(GameInvite.isPlayer_in_List(list, player)))
            list.pop(GameInvite.isPlayer_in_List(list, player))

    def delInviteWithPlayers(game_invites, player):
        """
        Removes all game invites where the given player is either player1 or player2.
        """
        print(f"Deleting all invites where {player} is involved.")

        # Filter out invites that involve the given player
        game_invites[:] = [invite for invite in game_invites if invite.player1 != player and invite.player2 != player]

        print(f"Remaining invites: {len(game_invites)}")

#class FriendRequest:
#   def __init__(self, sender, receiver):
#       self.sender = sender            # the user_name who startet the invitation
#       self.receiver = receiver            # the user_name who get the inviation
#       self.accepted = False        # state if the invitation is accecpted 
#       
#   def areusers_in_List(list, sender, receiver):
#       #print_colored("arePlayers_in_List()", "yellow")
#       for i in range(0, len(list)):
#           #print(str(i) + " Player1: " + list[i].player1)
#           #print(str(i) + " Player2: " + list[i].player2)
#           if (list[i].sender == sender and list[i].receiver == receiver):
#               #print(">> True")
#               return True
#       return False
#   
#   # return the line(s) where the player is; as player1 and player2
#   def isuser_in_List(list, user):
#       for i in range(0, len(list)):
#           if (list[i].sender == user or list[i].player2 == user):
#               return i
#       return -1
#   
#   def delInviteWithPlayer(list, user):
#       print_colored_variable("delInviteWithPlayer()", user, "yellow")//
#       while (FriendRequest.isuser_in_List(list, user) != -1):
#           print("\tdel " + user + " in friend_request at " + str(FriendRequest.isuser_in_List(list, user)))
#           list.pop(FriendRequest.isPuser_in_List(list, user))
#       
 
# a dict of UserProfiles is later in the activeUsers dict
class UserProfile:
    def __init__(self, user_name, friend_list, blocked_list): 
        self.user_name = user_name
        self.display_name = ""
        self.block_list = blocked_list
        self.blocked_by = []
        self.friend_list = friend_list
        self.rank = -1
        self.games_played_count = 0
        self.games_lost = 0
        self.games_won = 0
        self.games_played_with = []    # names of other users  multiple allowed?

    def block_user(self, blocked_by_user, all_profiles):
        if blocked_by_user not in self.blocked_by:
            print_colored("\tUserProfile   block_user ", 'yellow')
            print_colored_variable("\tUserProfile   blocked_by_user: ", blocked_by_user, 'red')
            print_colored_variable("\tUserProfile   self.user_name:  ", self.user_name, 'red')

            self.blocked_by.append(blocked_by_user)
            
            # Add to the other user's "blocked" list
            if blocked_by_user in all_profiles:
                print("      ... add User " + self.user_name + "  to user_to_block_list from: " + blocked_by_user)
                all_profiles[blocked_by_user].block_list.append(self.user_name)


    def unblock_user(self, user_to_unblock, all_profiles):
        print_colored_variable("\tUserProfile   unblock_user: ", user_to_unblock, 'green')
        print("self.block_list: " + str(self.block_list))
        print("self.blocked_by: " + str(self.blocked_by))
        print("user_to_unblock: " + user_to_unblock)
        print("self.user_name:  " + self.user_name)

        if user_to_unblock in self.blocked_by:
            self.blocked_by.remove(user_to_unblock)
        
        if user_to_unblock in all_profiles:
            if self.user_name in all_profiles[user_to_unblock].block_list:
                #self.block_list.remove(self.user_name)
                all_profiles[user_to_unblock].block_list.remove(self.user_name)
            
    def set_display_name(self, dp_name):
        self.display_name = dp_name
    def get_display_name(self):
        return self.display_name
