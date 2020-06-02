import type { Request, Response } from "express";
import type { Main } from "../../../../Main";
import type { Bridge } from "../../../../bridging";
import { LogService } from "matrix-bot-sdk";


/**
 * GET /chat/
 * Polo will call this endpoint to get all the messages from the Matrix room
 * @param {Request} req
 * @param {Response} res
 */
export function getChat(req: Request, res: Response) {
  // @ts-ignore
  const main: Main = req['main'];
  // @ts-ignore
  const bridge: Bridge = req['bridge'];
  // @ts-ignore
  const id = req['id'];
  const messages = main.getNewMxMessages(bridge);
  const chat = {
    chat: messages
  };

  res.status(200);
  res.send(chat);
  res.end();
  LogService.info(
    'marco-webserver',
    `Request ${id}`,
    ' - Finished.'
  );
}
