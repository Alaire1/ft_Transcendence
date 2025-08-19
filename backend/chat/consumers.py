# File: consumers.py
import json
import httpx
from channels.generic.websocket import AsyncWebsocketConsumer
from .debugcolors import colors, print_colored, print_colored_variable, pretty_print_active_rooms, print_user_group, print_profile, pretty_print_gameinvite_list
from .chatroom import ChatRoom
from .profile import GameInvite
from datetime import datetime
import pytz

import urllib.parse

class HelloWorldConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"message": "Hello, World!"}))

    async def disconnect(self, close_code):
        print(f"WebSocket closed with code: {close_code}")

 
class ChatConsumer(AsyncWebsocketConsumer):
    active_rooms = {}       # dict of connected rooms
    jcount = 0
    # newMsgList = []
    game_invites = []
    doubleUser = False 
  
    global_start_msg = {
        'type': 'chat_message',
        'message': "Hello from Chatserver",
        'name': "Chat-Server 2000",
        'timestamp': "",
    } 
    
    async def connect(self):
        print("ALJKDHBSLKJDHLKAJHSLFJAHSJHALLSJFHAJSDHFLKKJAHDLFJJHALDJFLAKJHDF")
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tconnect()", "yellow")
        
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user_name = self.scope['query_string'].decode().split('=')[1]
        # Extraciting parameters
   
         
        # decode the query string und split parameters
        query_string = self.scope['query_string'].decode()  #  bytes to String
        query_params = urllib.parse.parse_qs(query_string)  #  Parse the Query-String to Dictionary
        print_colored(f"Received query string: {query_string}", "red")


        self.user_name = query_params.get('name', [None])[0]  # default value = None, if 'name' not available
        friend_list_json = query_params.get('friend_list', [None])[0]
        self.friend_list = json.loads(friend_list_json) if friend_list_json else []
        blocked_list_json = query_params.get('blocked_list', [None])[0]
        self.blocked_list = json.loads(blocked_list_json) if blocked_list_json else []
        self.other_user2 = query_params.get('other_user', [None])[0]  # default value = None, if 'name' not available
          
        print_user_group(self.connect.__name__, self.room_name,  self.room_group_name, self.user_name, "","","","")
        pretty_print_active_rooms(self.active_rooms)
        
        if self.room_group_name == "chat_global":
            #print("ROOOM GLOBAL !!!")
            if "chat_global" in ChatConsumer.active_rooms and self.user_name in ChatConsumer.active_rooms["chat_global"].connected_users:
                print_colored("USER: " + self.user_name + " is already in connected_useers", "red")
                self.doubleUser = True
                self.disconnect(self)
                return

            
        
        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

                
        # adding chat_room to active_rooms struct
        if self.room_group_name not in ChatConsumer.active_rooms:
            print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] +"\tconnect > add to active rooms dict: ", self.room_group_name, "green")
            ChatConsumer.active_rooms[self.room_group_name] = ChatRoom(self.room_group_name, ChatConsumer.active_rooms)    # add room_group_name to dict
            if self.room_group_name == "chat_global":
                ChatConsumer.active_rooms[self.room_group_name].add_message((self.global_start_msg)) 
        
        #pretty_print_active_rooms(ChatConsumer.active_rooms)
        
        # Add user to the users list
        if self.user_name not in ChatConsumer.active_rooms[self.room_group_name].connected_users:
            print_colored_variable(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] +"\tconnect > user >> " + self.user_name + " << not in connected_user: " , ChatConsumer.active_rooms[self.room_group_name].connected_users,  "magenta")
            ChatConsumer.active_rooms[self.room_group_name].add_user(self.user_name)

            #sending old messages
            for msg in ChatConsumer.active_rooms[self.room_group_name].get_old_messages():   
                #print_colored_variable(f"sending old to >"+ f"{colors['green']}" + self.room_group_name + f"{colors['default']}" + "<  msg ---> ", msg, 'red')
                await self.send(text_data=json.dumps({
                    'type': 'chat_message',
                    'message': msg['message'],
                    'name': msg['name'],
                    'timestamp': msg['timestamp']
                }))
                 
            # new 24.11 delting new msg entry
            if self.other_user2 and self.user_name:
                if 'chat_global' in ChatConsumer.active_rooms: 
                    ChatConsumer.active_rooms['chat_global'].del_new_msg_user_dict_entry(self.other_user2, self.user_name)
                await self.send_user_list()
        
        # adding user profile to chat_global
        ChatConsumer.active_rooms["chat_global"].add_new_profile(self.user_name, self.friend_list, self.blocked_list)
        await self.send_user_list()
                
 
        # Debug print - User connected successfully
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + f" [CONNECTED] User '{self.user_name}' has joined room '{self.room_name}'", 'green')
        # pretty_print_active_rooms(self.active_rooms)
        # print("")
 
    async def disconnect(self, close_code):
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + " disconnect()", "red") 
        print("\tuser name   : " + self.user_name)
        print("\tchannel name: " + self.channel_name)
        print("\troom    name: " + self.room_name)

        if self.doubleUser:
            print("\tDisconncet --> doubleUser return!!! ")
            return 
        
        print_user_group(self.disconnect.__name__, self.room_name, self.room_group_name, self.user_name, "","","","")
        
        # del user invites
        GameInvite.delInviteWithPlayer(self.game_invites, self.user_name)
        
        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        ) 
        
        msg = self.user_name
    
        # sendings leaving message
        if ChatConsumer.active_rooms["chat_global"].profiles.get(self.user_name, None):
            if ChatConsumer.active_rooms["chat_global"].profiles.get(self.user_name, None).display_name:
                msg += " aka " + ChatConsumer.active_rooms["chat_global"].profiles.get(self.user_name, None).display_name        
        
        msg += " has left the chatroom"
        
        await self.channel_layer.group_send(
            self.room_group_name, 
            {
                'type': 'chat_message',
                'message': msg,
                'name': "Chat-Server 2000",
                'timestamp': datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3],
            }
        )
         
        if ChatConsumer.active_rooms["chat_global"]:
            ChatConsumer.active_rooms["chat_global"].remove_profile(self.user_name)
            
        # remove user form ChatRoom list    XXX todo security checkt if room_group_name in active_rooms
        if self.user_name in ChatConsumer.active_rooms[self.room_group_name].connected_users:
            ChatConsumer.active_rooms[self.room_group_name].remove_user(self.user_name)
         
        #pretty_print_active_rooms(self.active_rooms)
        try:
            ChatConsumer.active_rooms["chat_global"]
            print_colored("\t send user LIST", 'green') 
            await self.send_user_list() 
        except:
            print_colored("\t not send user LIST because NO user Available", "red")

        #pretty_print_active_rooms(self.active_rooms)
        
        await self.send_user_list() 

        # Debug print - User disconnected
        #api_url = "http://localhost:8080/auth/online_status/"
        #headers = {
        #    "Content-Type": "application/json",
        #}
        #payload = {"status": False}
        #async with httpx.AsyncClient() as client:
        #    try:
        #        response = await client.post(api_url, json=payload, headers=headers)
        #        if response.status_code == 200:
        #            print_colored(f"✅ Successfully updated online status for {self.user_name}", "green")
        #        else:
        #            print_colored(f"⚠️ Failed to update online status: {response.status_code}", "yellow")
        #    except httpx.RequestError as e:
        #        print_colored(f"❌ Error sending request: {str(e)}", "red")
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + f" [DISCONNECTED] User  '{self.user_name}' has left room '{self.room_name}'", 'red')

    async def send_user_profile(self, user_profile, data):
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + " send_user_profile()", "yellow")
        print("DATA: ")
        print(data)
        
        message_type = data.get('type')
        print(".... message type: " + message_type)
        if message_type == 'request_user_profile' or 'game_invite':
            print("..........") 

            if 'requested_user' in data:
                requested_user = data['requested_user']
            if 'current_user' in data:
                current_user = data['current_user']  
    
        # Check if there's an invitation from the requested user to the current user
        try:
            if requested_user and current_user:
                #invitation_exists = requested_user in self.game_invites.get(current_user, [])
                #invitation_exists = any(invite.player1 == requested_user and invite.player2 == current_user and not invite.accepted for invite in self.game_invites)
                print("------------")
                invitation_exists = any(invite.player2 == requested_user and invite.player1 == current_user and not invite.accepted for invite in self.game_invites)

        except:
            invitation_exists = False
            
        print("invitation_exists --> " + str(invitation_exists)) 
        if user_profile:
            await self.send(text_data=json.dumps({
                'type': 'user_profile',
                'self_name': self.user_name,
                'user_name': user_profile.user_name,
                'display_name': user_profile.display_name,
                'rank': user_profile.rank,
                'games_played_count': user_profile.games_played_count,
                'games_won': user_profile.games_won,
                'games_lost': user_profile.games_lost,
                'games_played_with': user_profile.games_played_with,
                'blocked_users': user_profile.block_list,
                'blocked_by': user_profile.blocked_by,
                'friends_with' : user_profile.friend_list,
                'invitation_exists': invitation_exists
            }))

    async def receive(self, text_data): 
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + " receive()", "yellow")
        ChatConsumer.jcount += 1
        
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        print_colored_variable("\treceive text_data: ", text_data_json, "green")
        
        if message_type == 'request_user_profile': 
            print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + " message_type == 'request_user_profile':", 'red')
            requested_user = text_data_json['requested_user']
            print_colored(f"\tRequested profile for user: {requested_user}", 'yellow')

            user_profile = ChatConsumer.active_rooms["chat_global"].profiles.get(requested_user, None)

            await self.send_user_profile(user_profile, text_data_json)

        elif message_type == 'game_finished':
            print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + " message_type == 'game_finished':", 'red')
            GameInvite.delInviteWithPlayers(self.game_invites, self.user_name)
            pretty_print_gameinvite_list(self.game_invites)
            await self.send_user_list()
            
        elif message_type == 'block_user':
            print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\t message_type == 'block_user':", 'red')
            user_to_block = text_data_json['user_to_block']
            print("    user_to_block: " + user_to_block)
            print("        user_name: " + self.user_name)
            
            user_profile = ChatConsumer.active_rooms["chat_global"].profiles.get(user_to_block, None)
            all_profiles = ChatConsumer.active_rooms["chat_global"].profiles

            if user_profile:
                if user_to_block in user_profile.block_list:
                    print("unblock_user")
                    user_profile.unblock_user(user_to_block, all_profiles)
                else:
                    print("block_user")
                    user_profile.block_user(self.user_name, all_profiles)

                pretty_print_active_rooms(ChatConsumer.active_rooms)
                #print("     user_name:   " + self.user_name)
                
                await self.send_user_profile(user_profile, text_data_json)
                
                # send single block name
                await self.send(text_data=json.dumps({
                    'type': 'block',
                    'block': user_to_block,
                }))
                
                await self.send_user_list()
        
        elif message_type == 'un-block_user':
            print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tmessage_type == 'un-block_user' :", 'red')
            user_to_block = text_data_json['user_to_block']
            print("    user_to_block (unblock): " + user_to_block)
            print("        user_name: " + self.user_name)
            
            user_profile = ChatConsumer.active_rooms["chat_global"].profiles.get(user_to_block, None)
            all_profiles = ChatConsumer.active_rooms["chat_global"].profiles

            if user_profile:
                print("un-block_user")
                user_profile.unblock_user(self.user_name, all_profiles)

                pretty_print_active_rooms(ChatConsumer.active_rooms)
                #print("     user_name:   " + self.user_name)
                
                await self.send_user_profile(user_profile, text_data_json)
                
                # send single unblock name
                await self.send(text_data=json.dumps({
                    'type': 'unblock',
                    'unblock': user_to_block,
                }))
                
                await self.send_user_list()

                  
        elif message_type == 'update_display_name':
            print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tmessage_type == 'update_display_name' :", 'red')

            user_name = text_data_json['user_name']
            new_display_name = text_data_json['new_display_name']

            print_colored(f"Updating display name for user: {user_name} to '{new_display_name}'", 'yellow')

            # update the display-name in profil of the user
            user_profile = ChatConsumer.active_rooms["chat_global"].profiles.get(user_name, None)
            if user_profile: 
                user_profile.set_display_name(new_display_name)
                await self.send_user_profile(user_profile, text_data_json)
                await self.send_user_list()
#                await self.x()    

        # Handle game invitation
        elif message_type == 'game_invite':
            print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tmessage_type == 'game_invite' :", 'red')

            from_user = text_data_json['from_user']
            to_user = text_data_json['to_user']

            # Create new GameInvite object and add it to the list
            invite = GameInvite(player1=from_user, player2=to_user)

            if not GameInvite.arePlayers_in_List(self.game_invites, from_user, to_user):
                print(">> add invitation to game_invites")
                self.game_invites.append(invite) 

            await self.send_user_list()  
            
            # await self.channel_layer.group_send(
            #     self.room_group_name,
            #     {
            #         'type': 'new_game_invite',
            #         'from_user': from_user,
            #         'to_user': to_user
            #     } 
            # )
            
            pretty_print_gameinvite_list(self.game_invites)
        
        # elif message_type == 'game_invite_accept':
        #     print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tmessage_type == 'game_invite_accept' :", 'red')
        #     from_user = text_data_json['from_user']
        #     to_user = text_data_json['to_user']
        #     print_colored_variable("\tfrom_user ", from_user, "green")
        #     print_colored_variable("\tto_user   ", to_user, "green")
            
        #     print("\tgame invites ........")
        #     print(self.game_invites)
            
        # Update the User List
        elif message_type == 'update_user_list':
            print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tmessage_type == 'update_user_list' :", 'red')

            await self.send_user_list()
            return
         
        # Handle accepting an invitation
        elif message_type == 'accept_invite':
            from_user = text_data_json['from_user']
            to_user = text_data_json['to_user']

            print_colored_variable("\tfrom_user ", from_user, "green")
            print_colored_variable("\tto_user   ", to_user, "green")
            # Find the invite and update its status to accepted
            for invite in self.game_invites:
                if invite.player1 == from_user and invite.player2 == to_user and not invite.accepted:
                    invite.accepted = True
                    invite.game_started = False # xxx
                    print("BINGO  self.room_group_name " + self.room_group_name)
                    pretty_print_gameinvite_list(self.game_invites)

                    # Send a response to player accepted 
                    # await self.send(text_data=json.dumps({
                    #     'type': 'invite_accepted',
                    #     'from_user': from_user,
                    #     'to_user': to_user
                    # }))
                    
                    # await self.channel_layer.group_send(
                    #     self.room_group_name,
                    #     {
                    #         'type': 'invite_accepted',
                    #         'from_user': from_user,
                    #         'to_user': to_user
                    #     })
                    await self.send_user_list()
 
                    break 
                

        try:
            text_data_json['message']
            ChatConsumer.active_rooms["chat_" + self.room_name].add_message(text_data_json)
            print_colored_variable("\tadding msg to >" + self.room_name + "< list: ", text_data_json, 'magenta')
        except:
            print("\tno message in json ")
            return 
            
        # if msg is private and less than 2 users connecte --> update the new_msd_user_dict
        if len(ChatConsumer.active_rooms["chat_" + self.room_name].connected_users) < 2 and self.room_name != "global":
            # Messgage marking for user2
            if self.other_user2:  # Prüfen, ob ein anderer Benutzer spezifiziert ist
                print_colored(" ----> CASE 1 ", "cyan")
                ChatConsumer.active_rooms['chat_global'].add_new_msg_user_dict_entry(text_data_json['name'], self.other_user2)
                #await self.send_user_list()
        else: 
            if text_data_json['name'] and self.other_user2:
                print_colored(" ----> CASE 2   other_user2: " + self.other_user2 + "  name: " + text_data_json['name'], "cyan")
         
        await self.send_user_list()

        pretty_print_active_rooms(ChatConsumer.active_rooms)
        
         # Send the message to the room group
        message = text_data_json['message']
        name = text_data_json['name']
        timestamp = text_data_json['timestamp']

        print_user_group(self.receive.__name__, self.room_name, self.room_group_name, self.user_name, "", message, name, timestamp)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'name': name,
                'timestamp': timestamp,
            }
        )

    async def new_game_invite(self, event):
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "  new_game_invite()", "magenta")

        from_user = event['from_user']
        to_user = event['to_user']
        print("from User: " + from_user + "   to User: " + to_user)
        # Send message to WebSocket to notify the correct client about the new game invitation
        await self.send(text_data=json.dumps({
            'type': 'new_game_invite',
            'from_user': from_user,
            'to_user': to_user 
        }))
        
    async def chat_message(self, event):
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "  chat_message()", "cyan")

        print_user_group(self.chat_message.__name__, self.room_name, self.room_group_name, self.user_name, event['type'], event['message'], event['name'], event['timestamp'])

        # Send the message to the WebSocket
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + "\tSend the message to the WebSocket() ...", "yellow")
        #pretty_print_active_rooms(self.active_rooms)
        
        if "chat_global" not in ChatConsumer.active_rooms:
            return
        
        if self.room_group_name in self.active_rooms:
            if len(self.active_rooms[self.room_group_name].connected_users) < 2:
                #self.active_rooms['chat_global'].add_new_msg_user_dict_entry(self.user_name, self.other_user2)
                await self.send_user_list()
             
        #pretty_print_active_rooms(self.active_rooms)
          
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'name': event['name'],
            'timestamp': event['timestamp'],
        })) 
  

    async def send_user_list(self):
        # Send the updated user list to all connected clients 
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + " send_user_list()", "blue")
        #print(ChatConsumer.active_rooms['chat_global'].connected_users)
        #print(self.active_rooms['chat_global'].connected_users)
        #print("\t\tuser:   " + self.user_name)
        #print("\t\tother:  " + str(self.other_user2))
        
        #pretty_print_active_rooms(self.active_rooms)
        
        all_profiles = ChatConsumer.active_rooms['chat_global'].profiles
        updated_profiles = {name: {
            'blocked_users': profile.block_list,
            'blocked_by': profile.blocked_by,
            'display_name': profile.display_name  # Display-Name adding
        } for name, profile in all_profiles.items()}
       
        all_game_invites = ChatConsumer.game_invites
        updated_game_invites = [{
            'player1': profile.player1,
            'player2': profile.player2,
            'game_started': profile.game_started,
            'accepted': profile.accepted,
            'game_finished': profile.game_finished,
        } for  profile in all_game_invites]
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_list_update',  # XXX good
                #'type': 'user_list',  # XXX good
                
                'users': list(ChatConsumer.active_rooms['chat_global'].connected_users),
                'newmsg': ChatConsumer.active_rooms['chat_global'].new_msg_user_dict, # User with new Messages
                'updated_profiles': updated_profiles,       # New for updating display names list
                'game_invites': updated_game_invites        # List of all game invites
            }
            
        ) 
 
    async def user_list_update(self, event):
        print_colored(datetime.now(pytz.timezone("Europe/Berlin")).strftime("%H:%M:%S.%f")[:-3] + " user_list_update()", "blue")

        #print_colored_variable("\troom: ", self.room_group_name, 'green')
        #print_colored_variable("\tuser: ", self.user_name, 'green')
        
        # Debug print - User list details
        #print_colored_variable("\t  users: ", event['users'], "blue")
   
        all_profiles = ChatConsumer.active_rooms['chat_global'].profiles
        updated_profiles = {name: {
            'user_name': profile.user_name,
            'display_name': profile.display_name,  # Display-Name adding
            'blocked_users': profile.block_list,
            'blocked_by': profile.blocked_by,
            'rank': profile.rank,
            'games_played_count': profile.games_played_count,
            #'games_lost': profile.games_lost,
            #'games_won': profile.games_won,
            'games_played_with': profile.games_played_with
        } for name, profile in all_profiles.items()}
        
        all_game_invites = ChatConsumer.game_invites
        updated_game_invites = [{
            'player1': profile.player1,
            'player2': profile.player2,
            'game_started': profile.game_started,
            'accepted': profile.accepted,
            'game_finished': profile.game_finished,
        } for  profile in all_game_invites]
        
        # Send the updated user list to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_list',
            'users': event['users'],
            'newmsg': event['newmsg'],
            'updated_profiles': updated_profiles,
            'game_invites': updated_game_invites        # List of all game invites

        }))
   