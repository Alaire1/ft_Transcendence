from .debugcolors import colors, print_colored, print_colored_variable, pretty_print_active_rooms, pretty_print_active_room
from .profile import UserProfile
from datetime import datetime
import pytz

#datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "
class ChatRoom:
    def __init__(self, room_name, active_rooms):
        self.room_name = room_name
        self.connected_users = set()  # User how are connected with this room
        self.messages = []            # List of old messages
        self.new_msg_count = 0
        self.new_msg_user_dict = {}     # a dict for storing if a user should get an new msg info.   new_msg_user_dict['me'] string I get is the user ho send me an msg ... update there is a list befind 
        self.profiles = {}
        self.active_rooms = active_rooms  # Reference to hole dictonary in consumer.py 

    def add_user(self, user_name):
        print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom: " + self.room_name +  " add_user: ", user_name, 'green')
        self.connected_users.add(user_name)
            

    def remove_user(self, user_name):
        print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom: " + self.room_name + " remove_user: " , user_name, 'red')
        self.connected_users.discard(user_name)
        
        if not self.connected_users:  # if no connected_users left

            # del chat room from list of active chat rooms    but chat_global will be staying
            if self.room_name in self.active_rooms:
                if self.room_name != "chat_global":
                    print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + f"\tChatRoom   '{self.room_name}' will be delete, cause no connected users", 'magenta')
                    print_colored_variable("\tdel self.room_name: ", self.room_name, 'red')
                    del self.active_rooms[self.room_name]    
        #pretty_print_active_room(self)

    def add_message(self, msg):
        #print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom   add_message: ", msg, 'blue')
        self.inc_new_msg()
        self.messages.append(msg)

    def get_old_messages(self):
        #print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom   get_old_messages: ", self.messages, 'blue')
        return self.messages

    def inc_new_msg(self):
        if len (self.connected_users) == 1:
            self.new_msg_count += 1
            #print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom   inc_new_msg: ", self.new_msg_count, 'blue')

    
    def add_new_msg_user_dict_entry(self, me, other_user):
        if me not in self.new_msg_user_dict:
            # ini list if receiver doesnt excists
            self.new_msg_user_dict[me] = []
        
        if me and other_user:
            self.new_msg_user_dict[me].append(other_user)
            #print(self.new_msg_user_dict[me])

    def del_new_msg_user_dict_entry(self, me, other_user):
        print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom   del_new_msg_user_dict_entry: ", me + "  other_user: " + other_user, 'red')
        if not me and not other_user:
            return
        
        if me in self.new_msg_user_dict:            
            if me in self.new_msg_user_dict and other_user in self.new_msg_user_dict[me]:
                # delete other_user from list of new msg
                self.new_msg_user_dict[me].remove(other_user)

            # if list is empty delete user
            if not self.new_msg_user_dict[me]:
                del self.new_msg_user_dict[me]

        #print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom   remove_message_from_user:", f"{other_user} -> {me}", 'red')
    
    def add_new_profile(self, name, friend_list, blocked_list):
        if name not in self.profiles:
            print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom: " + self.room_name +  " add_new_profile: ", name, 'blue')
            self.profiles[name] = UserProfile(name, friend_list, blocked_list)
            
    def remove_profile(self, user_name):
        if user_name in self.profiles:
            print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tChatRoom: " + self.room_name + " remove_profile: ", user_name, 'red')
            del self.profiles[user_name]