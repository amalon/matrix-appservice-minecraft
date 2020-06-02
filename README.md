# Matrix Minecraft Bridge

**This Project is in Beta**

A bridge between [Matrix](https://matrix.org/) 
and [Minecraft](https://www.minecraft.net/)

![](./docs/res/made-for-matrix.png)

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
This is a Matrix appservice that communicates between a plugin based
Minecraft server and Matrix. The Minecraft server must have a proper
plugin (see compatible plugins below). 

## Setup
To set up follow this process then go to a compatible plugin and follow it's
setup process. If you already know where an instance of this application is
running then all that is left is setting up the plugin.
```shell script
# Install all the needed dependencies
npm install -P

# Generate the configuration
npm run setup

# ... configure ./config/config.yaml

# Make your matrix server point to the appservice.yaml

# finally run
npm start
```

## Leave a Star!
It means a lot

## Developing
Join us in our Matrix room
[#minecraft:dhdf.dev](https://matrix.to/#/!RUdwKvpeiDnWUyWSMJ:dhdf.dev?via=dhdf.dev)


## Compatible Plugins:
 - [Matrix Plugin](https://github.com/dhghf/matrix-plugin)
   - By @dhghf
