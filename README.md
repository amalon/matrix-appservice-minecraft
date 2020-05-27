# Marco
LICENSE: [GNU GPLv3](./LICENSE)
Version: Proof Of Concept
Summary: A minecraft relay bridge for Matrix.

## Features
 - [x] Minecraft
   - [x] Retrieve matrix messages
      - [x] m.emotes
      - [x] m.text
   - [x] Send messages
      - [ ] Player events (ie deaths, kicks, etc.)
      - [x] Player chat messages / emotes
 - [x] Matrix
   - [x] In-sync Profiles
      - [x] Player's skin as matrix avatar
      - [x] Player's name as matrix display name
   - [x] Bridge / Unbridge with commands


## Description
Marco is half of a project. The other half is 
[Polo](https://github.com/dhghf/polo) (a play on words). Both Marco and Polo
work together to establish a Matrix relay bridge between multiple minecraft
servers and corresponding Matrix rooms.

Why split them up to two counter-parts? Because to keep the Matrix
appservice users up-to-date takes up a lot a performance that a minecraft
server host should not have to deal with so Polo throws all the
information at Marco where it is processed and relayed back and forth
between the Minecraft chat, and a Matrix room.

Polo will keep Marco up-to-date on all the messages on Minecraft by sending
POST requests that contain the player and the body of the message.
 - Polo -> Marco -> Matrix

Polo will periodically make GET requests to see all the new messages since
the last time requested
 - Polo <- Marco <- Matrix

This ultimately helps Minecraft hosts setup a bridge easily:
 1. Add the plugin
 2. Set the host resolvable where Marco is running
 3. Set a bridge token
 4. Enjoy.

It is up to whoever is running Marco to keep the performance steady and
configuration clean.

## Visual Representation (TL;DR)

 1. matrix user: `!marco bridge !example:example.com`
 2. marco: Here's a token `12356789`
 3. minecraft user: `/bridge 12345679`

Once they've executed the bridge command Polo (the minecraft plugin) will
periodically stay up to date on all the new messages in the Matrix room as
well as letting Marco know all the messages appearing on the Minecraft
server.

## Setup
As this is still a proof of concept the setup / configuration may change
once there is a major release so I am halting on writing a setup process
until it's sophisticated.

## Contact

