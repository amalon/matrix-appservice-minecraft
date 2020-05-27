export const invalidTokenError = {
  "error": "INVALID_TOKEN",
  "message": "The token provided is not bridged with anything"
};

export const noTokenError = {
  "error": "NO_TOKEN",
  "message": "A token was not provided"
};

// export const invalidRoomError = {
//   "error": "INVALID_ROOM",
//   "message": "Is the appservice in the room? Is this a valid room ID?"
// };
//
// export const noRoomIdError = {
//   "error": "NO_ROOM_ID",
//   "message": "Provide a roomId property"
// };

export const noBodyError = {
  "error": "NO_BODY",
  "message": "Provide a body with valid JSON"
};

// export const bridgedAlreadyError = {
//   "error": "ROOM_BRIDGED_ALREADY",
//   "message": "This room is already bridged"
// };

export const noMessageError = {
  "error": "NO_MESSAGE",
  "message": "Provide a message property"
};

export const messageTypeError = {
  "error": "MESSAGE_TYPE",
  "message": "The message property must be type of string"
};

export const playerTypeError = {
  "error": "PLAYER_TYPE",
  "message": "The player property must be type of object with a name and" +
    " uuid property"
};

export const noPlayerError = {
  "error": "NO_PLAYER",
  "message": "Provide player property"
};

export const noPlayerNameError = {
  "error": "NO_PLAYER_NAME",
  "message": "Provide player name property in player object"
};

export const playerNameTypeError = {
  "error": "PLAYER_NAME_TYPE",
  "message": "Name property of player object must be type of string"
};

export const playerIdTypeError = {
  "error": "PLAYER_UUID_TYPE",
  "message": "UUID property of player object must be type of string"
}

export const noPlayerIdError = {
  "error": "NO_PLAYER_UUID",
  "message": "Provide player UUID property in player object"
};
