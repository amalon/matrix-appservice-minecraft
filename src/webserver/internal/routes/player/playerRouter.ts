/**
 * This is the player endpoint it allows Polo to send player events
 */
import express, { Request } from 'express';
import { postJoin } from "./postJoin";
import { postQuit } from "./postQuit";
import { postKick, checkKickIntegrity } from "./postKick";
import { postDeath, checkDeathIntegrity } from "./postDeath";
import { validatePost, handlePostAsync, checkPlayerIntegrity } from "../../validate";
import { LogService } from "matrix-bot-sdk";


export const playerRouter = express.Router();

playerRouter.use('/', express.json());
playerRouter.use('/', (_, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
})

/**
 * POST /player/join/
 * Polo will call this endpoint when a user joins the minecraft server
 */
validatePost(playerRouter, '/join', checkPlayerIntegrity);
handlePostAsync(playerRouter, '/join', postJoin);

/**
 * POST /player/quit/
 * Polo will call this endpoint when a user quits the minecraft server
 */
validatePost(playerRouter, '/quit', checkPlayerIntegrity);
handlePostAsync(playerRouter, '/quit', postQuit);

/**
 * POST /player/kick/
 * Polo will call this endpoint when a user quits the minecraft server
 */
validatePost(playerRouter, '/kick', checkPlayerIntegrity);
validatePost(playerRouter, '/kick', checkKickIntegrity);
handlePostAsync(playerRouter, '/kick', postKick);

/**
 * POST /player/death/
 * Polo will call this endpoint when a player dies
 */
validatePost(playerRouter, '/death', checkPlayerIntegrity);
validatePost(playerRouter, '/death', checkDeathIntegrity);
handlePostAsync(playerRouter, '/death', postDeath);
