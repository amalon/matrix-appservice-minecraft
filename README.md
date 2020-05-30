# Marco
LICENSE: [GNU GPLv3](./LICENSE)

Version: 0.9.1

Summary: A bridge between [Matrix](https://matrix.org/) 
and [Minecraft](https://www.minecraft.net/)

## Features
 - [x] Minecraft
   - [x] Retrieve matrix messages
      - [x] m.emotes
      - [x] m.text
   - [ ] Send messages
      - [ ] Player events (ie deaths, kicks, advancements, etc.)
      - [x] Player chat messages / emotes
 - [x] Matrix
   - [x] In-sync Profiles
      - [x] Player's skin as matrix avatar
      - [x] Player's name as matrix display name
   - [x] Bridge / Unbridge with commands


## Description
Marco is a Matrix appservice that bridges a Matrix room to a Minecraft
server by communicating to a plugin called 
"[Polo](https://github.com/dhghf/polo)".

Polo simply sends all the new messages from the Minecraft chat to Marco
which then Marco sends it to Matrix. Then Polo does a get request to see
if there are any new messages in the Matrix room and sends those messages
to the Minecraft chat.


### Why split them up to two parts?
To keep Matrix and Minecraft chat in sync takes up a lot of
performance. Marco does all of this externally to take a load off of the
Minecraft server host. As long as there is at least one instance of Marco
running any Minecraft server can communicate with it. This makes it easy for a
Minecraft server host to establish a bridge just by doing the following:
 1. Add the plugin
 2. Set the host resolvable where Marco is running
 3. Set a bridge token
 4. Enjoy.


### How does Marco + Polo Work?
Polo will keep Marco up-to-date on all the messages on Minecraft by sending
POST requests that contain the player and the body of the message.
 - Polo -> Marco -> Matrix

Polo will periodically make GET requests to see all the new messages since
the last time requested.
 - Polo <- Marco <- Matrix

## Setup
(in development)

## Keep in Touch
Join us in our Matrix room
[#minecraft:dhdf.dev](https://matrix.to/#/!RUdwKvpeiDnWUyWSMJ:dhdf.dev?via=dhdf.dev)

## Leave a Star!
It means a lot

