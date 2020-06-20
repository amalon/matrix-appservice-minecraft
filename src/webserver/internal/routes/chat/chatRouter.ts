/**
 * This is the chat endpoint it allows Polo to send and retrieve messages
 */
import express, { Request } from 'express';
import { getChat } from "./getChat";
import { checkIntegrity, postChat } from "./postChat";
import { postJoin, postQuit } from "./postJoin";
import { LogService } from "matrix-bot-sdk";


export const chatRouter = express.Router();

chatRouter.use('/', express.json());
chatRouter.use('/', (_, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
})

/**
 * GET /chat/
 * Polo will call this endpoint to get all the messages from the Matrix room
 */
chatRouter.get('/', ((req, res) => {
  try {
    getChat(req, res);
  } catch (err) {
    errorHandler(req, err);
  }
}));

// this checks to make sure Polo is calling this endpoint properly
chatRouter.post('/', ((req, res, next) => {
  try {
    checkIntegrity(req, res, next);
  } catch (err) {
    errorHandler(req, err);
  }
}));

/**
 * POST /chat/
 * Polo will call this endpoint when there's a new message in the
 * Minecraft chat
 */
chatRouter.post('/', (async (req, res) => {
  try {
    await postChat(req, res);
  } catch (err) {
    errorHandler(req, err);
  }
}));

// this checks to make sure Polo is calling this endpoint properly
chatRouter.post('/join/', ((req, res, next) => {
  try {
    checkIntegrity(req, res, next);
  } catch (err) {
    errorHandler(req, err);
  }
}));

/**
 * POST /chat/join/
 * Polo will call this endpoint when a user joins the minecraft server
 */
chatRouter.post('/join/', (async (req, res) => {
  try {
    await postJoin(req, res);
  } catch (err) {
    errorHandler(req, err);
  }
}));

// this checks to make sure Polo is calling this endpoint properly
chatRouter.post('/quit/', ((req, res, next) => {
  try {
    checkIntegrity(req, res, next);
  } catch (err) {
    errorHandler(req, err);
  }
}));

/**
 * POST /chat/quit/
 * Polo will call this endpoint when a user quits the minecraft server
 */
chatRouter.post('/quit/', (async (req, res) => {
  try {
    await postQuit(req, res);
  } catch (err) {
    errorHandler(req, err);
  }
}));

function errorHandler(req: Request, err: any): void {
  // @ts-ignore
  const id = req['id'];
  if (err instanceof Error) {
    LogService.error(
      'marco-webserver',
      `Request ${id}`,
      err.message,
    );
  } else {
    LogService.error(
      'marco-webserver',
      `Request ${id}`,
      err
    );
  }
}
