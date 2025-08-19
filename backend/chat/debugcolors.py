#from .profile import GameInvite

# Colors for printing in the console
colors = {
    "default": "\033[0m",   # Default color
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "white": "\033[37m"
}

def print_colored(text, color="default"):
    color_code = colors.get(color, colors["default"])
    print(f"{color_code}{text}\033[0m")

def print_colored_variable(text, vari, color="default"):
    color_code = colors.get(color, colors["default"])
    print(f"{text}{color_code}{vari}\033[0m")


def pretty_print_gameinvite(data):
    print_colored_variable("\tPlayer 1:       ", data.player1, 'blue')
    print_colored_variable("\tPlayer 2:       ", data.player2, 'magenta')
    if data.accepted:
        print_colored_variable("\taccepted:       ", data.accepted, 'green')
    else:
        print_colored_variable("\taccepted:       ", data.accepted, 'red')
    print_colored_variable("\tgame_started:   ", data.game_started, 'yellow')
    print_colored_variable("\tgame_finished : ", data.game_finished, 'cyan')
    print("")
    
def pretty_print_gameinvite_list(data):
    print_colored("*** Game Invite Dict ***", "yellow")
    #print("len: " + str(len(data)))
    #print("p1 " + data[0].player1)
    for i in range(0, len(data)):
        pretty_print_gameinvite(data[i]) 
    
def print_profile(profile):
    for name, prof in profile.items():
        print_colored_variable("\n\t\t   Profile Name:     ", name, "blue")
        print_colored_variable("\t\t   Rank:               ", prof.rank, "yellow")
        print_colored_variable("\t\t   games_played_count: ", prof.games_played_count, "cyan")
        print_colored_variable("\t\t   games_lost:         ", prof.games_lost, "red")
        print_colored_variable("\t\t   games_won:          ", prof.games_won, "green")
        print_colored_variable("\t\t   games_played_with:  ", list(prof.games_played_with), "yellow")
        print_colored_variable("\t\t   blocked users:      ", list(prof.block_list), "red")
        print_colored_variable("\t\t   blocked by   :      ", list(prof.blocked_by), "red")

        print_colored("\t\t   - - - - - - - - - - - -      ", "default")

def pretty_print_active_room(active_room):
    print(        "\n\t------------------------------------")
    print_colored("\t---- pretty_print_active_room -----")
    if not active_room:
        print_colored("\tNo active room available.", "red")
        return

    #for room_name, chat_room in active_room.items():
    print_colored_variable("\t-\tRoom Name: ", active_room.room_name, "blue")
    # show users
    print_colored("\t-\t   Connected Users:", "yellow")
    if active_room.chat_room.connected_users:
        for user in active_room.chat_room.connected_users:
            print_colored(f"\t-\t    - {user}", "green")
    else:
        print_colored("\t-\t     No users connected.", "red")
    # show messages 
    print_colored("\t-\t    Messages:", "magenta")
    if active_room.chat_room.messages:
        for message in active_room.chat_room.messages:
            try:
                print_colored(f"\t-\t    - [{message['timestamp']}] {message['name']}: {message['message']}", "cyan")
            except:
                print("\t-\t error")
    else:
        print_colored("\t-\t    No messages available.", "red")
    # new msg count 
    print_colored_variable("\t-\t    new_msg_count: ", active_room.chat_room.new_msg_count,"magenta")
    #if chat_room.new_msg_user_dict:
    print_colored_variable("\t-\t    new_msg_user_dict: ", active_room.chat_room.new_msg_user_dict,"cyan")
    print_profile(active_room.chat_room.profiles)
    print_colored("\t" + "-" * 40, "white")

def pretty_print_active_rooms(active_rooms):
    print(        "\n\t------------------------------------")
    print_colored("\t---- pretty_print_active_rooms -----")
    if not active_rooms:
        print_colored("\tNo active rooms available.", "red")
        return

    # for every room in active Rooms
    for room_name, chat_room in active_rooms.items():
        print_colored_variable("\t-\tRoom Name: ", room_name, "blue")

        # show users 
        print_colored("\t-\t   Connected Users:", "yellow")
        if chat_room.connected_users:
            for user in chat_room.connected_users:
                print_colored(f"\t-\t    - {user}", "green")
        else:
            print_colored("\t-\t     No users connected.", "red")

        # show messages
        print_colored("\t-\t    Messages:", "magenta")
        if chat_room.messages:
            for message in chat_room.messages:
                try:
                    print_colored(f"\t-\t    - [{message['timestamp']}] {message['name']}: {message['message']}", "cyan")
                except:
                    print("\t-\t error")
        else:
            print_colored("\t-\t    No messages available.", "red")

        # new msg count 
        print_colored_variable("\t-\t    new_msg_count: ", chat_room.new_msg_count,"magenta")

        #if chat_room.new_msg_user_dict:
        print_colored_variable("\t-\t    new_msg_user_dict: ", chat_room.new_msg_user_dict,"cyan")

        print_profile(chat_room.profiles)

        print_colored("\t" + "-" * 40, "white")

def print_user_group(called_from, room_name, room_group_name, user_name, type, msg, name, timestamp):
    print_colored_variable("\tprint_user_group in function      : ", called_from + "()", "yellow")
    if (room_name):
        print_colored_variable("  roomname       : ", room_name, "green")
    if room_group_name:
        print_colored_variable("  room_group_name: ", room_group_name, "blue")
    if user_name:
        print_colored_variable("  user_name      : ", user_name, "magenta")
    if type:
        print_colored_variable("  type     : ", type, "green")
    if msg:
        print_colored_variable("  message  : ", msg, "cyan")
    if name:
        print_colored_variable("  name     : ", name, "cyan")
    if timestamp:
        print_colored_variable("  timestamp: ", timestamp, "cyan")
        