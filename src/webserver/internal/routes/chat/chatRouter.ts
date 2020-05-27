/**
 * @author Dylan Hackworth <dhpf@pm.me>
 * @LICENSE GNU GPLv3
 */
import express from 'express';
import { getChat } from "./getChat";
import { checkIntegrity, postChat } from "./postChat";
import { LogService } from "matrix-bot-sdk";


export const chatRouter = express.Router();

chatRouter.use('/', express.json());
chatRouter.use('/', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
})

/**
 * GET /chat/
 */
chatRouter.get('/', ((req, res) => {
  try {
    getChat(req, res);
  } catch (err) {
    if (err instanceof Error) {
      LogService.error('marco-webserver', err.message, err.stack);
    }
  }
}));

/**
 * POST /chat/
 */
chatRouter.post('/', ((req, res, next) => {
  try {
    checkIntegrity(req, res, next);
  } catch (err) {
    if (err instanceof Error) {
      LogService.error('marco-webserver', err.message, err.stack);
    }
  }
}));
chatRouter.post('/', (async (req, res) => {
  try {
    await postChat(req, res);
  } catch (err) {
    if (err instanceof Error) {
      LogService.error('marco-webserver', err.message, err.stack);
    }
  }
}));
