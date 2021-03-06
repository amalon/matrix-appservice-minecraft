/**
 * These are *all* the error responses that the WebInterface provides
 */

/**
 * Something went wrong internally
 * @const serverError
 */
export const serverError = {
  "error": "SERVER_ERROR",
  "message": "The server messed up"
};

/**
 * Polo provided a token but it's invalid / not bridged with anything.
 * @const invalidTokenError
 */
export const invalidTokenError = {
  "error": "INVALID_TOKEN",
  "message": "The token provided is not bridged with anything"
};

/**
 * Polo didn't provide a bearer token in the authorization header
 * @const noTokenError
 */
export const noTokenError = {
  "error": "NO_TOKEN",
  "message": "A token was not provided"
};

/**
 * Polo didn't provide a body in the request
 * @const noBodyError
 */
export const noBodyError = {
  "error": "NO_BODY",
  "message": "Provide a body with valid JSON"
};

/**
 * Polo didn't provide a message
 * @const noMessageError
 */
export const noMessageError = {
  "error": "NO_MESSAGE",
  "message": "Provide a message property"
};

/**
 * Polo didn't provide a reason
 * @const noReasonError
 */
export const noReasonError = {
  "error": "NO_REASON",
  "message": "Provide a reason property"
};

/**
 * Polo provided a message but it's not a string
 * @const messageTypeError
 */
export const messageTypeError = {
  "error": "MESSAGE_TYPE",
  "message": "The message property must be type of string"
};

/**
 * Polo provided a reason but it's not a string
 * @const reasonTypeError
 */
export const reasonTypeError = {
  "error": "REASON_TYPE",
  "message": "The reason property must be type of string"
};

/**
 * Polo provided a player property but it's not an object
 * @const playerTypeError
 */
export const playerTypeError = {
  "error": "PLAYER_TYPE",
  "message": "The player property must be type of object with a name and" +
    " uuid property"
};

/**
 * Polo didn't provide player details
 * @const noPlayerError
 */
export const noPlayerError = {
  "error": "NO_PLAYER",
  "message": "Provide player property"
};

/**
 * Polo didn't provide a player name
 * @const noPlayerNameError
 */
export const noPlayerNameError = {
  "error": "NO_PLAYER_NAME",
  "message": "Provide player name property in player object"
};

/**
 * Polo provided a player name but it's not a string
 * @const playerNameTypeError
 */
export const playerNameTypeError = {
  "error": "PLAYER_NAME_TYPE",
  "message": "Name property of player object must be type of string"
};


/**
 * Polo didn't provide a player UUID
 * @const noPlayerIdError
 */
export const noPlayerIdError = {
  "error": "NO_PLAYER_UUID",
  "message": "Provide player UUID property in player object"
};

/**
 * Polo provided a player UUID but it's not a string
 * @const playerIdTypeError
 */
export const playerIdTypeError = {
  "error": "PLAYER_UUID_TYPE",
  "message": "UUID property of player object must be type of string"
}
