/**
 * These are all the errors that can occur while managing a bridge
 */

/**
 * This can occur if a given room is already bridged
 */
export class BridgedAlreadyError extends Error {
  constructor() { super("This is already bridged"); }
}

/**
 * This can occur if a message is being sent to an unbridged room.
 */
export class NotBridgedError extends Error {
  constructor() { super("This isn't bridged"); }
}
