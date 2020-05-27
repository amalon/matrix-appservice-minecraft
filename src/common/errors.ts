export class BridgedAlreadyError extends Error {
  constructor() { super("This is already bridged"); }
}

export class NotBridgedError extends Error {
  constructor() { super("This isn't bridged"); }
}
