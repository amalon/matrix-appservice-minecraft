/**
 * This is the chat endpoint it allows Polo to send and retrieve messages
 */
import express, { Request } from 'express';
import { getChat } from "./getChat";
import { checkChatIntegrity, postChat } from "./postChat";
import { validatePost, handlePostAsync, handleGet, checkPlayerIntegrity } from "../../validate";
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
handleGet(chatRouter, '/', getChat);

/**
 * POST /chat/
 * Polo will call this endpoint when there's a new message in the
 * Minecraft chat
 */
validatePost(chatRouter, '/', checkPlayerIntegrity);
validatePost(chatRouter, '/', checkChatIntegrity);
handlePostAsync(chatRouter, '/', postChat);
