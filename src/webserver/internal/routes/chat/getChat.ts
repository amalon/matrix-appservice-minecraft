import type { Request, Response } from "express";
import type { Marco } from "../../../../Marco";
import type { Bridge } from "../../../../common/Bridge";
import { LogService } from "matrix-bot-sdk";


/**
 * GET /chat/
 * Polo will call this endpoint to get all the messages from the Matrix room
 * @param {Request} req
 * @param {Response} res
 */
export function getChat(req: Request, res: Response) {
  // @ts-ignore
  const marco: Marco = req['marco'];
  // @ts-ignore
  const bridge: Bridge = req['bridge'];
  // @ts-ignore
  const id = req['id'];
  const messages = marco.matrix.getNewMxMessages(bridge);
  const chat = {
    chat: messages
  };

  res.status(200);
  res.send(chat);
  res.end();
  LogService.info(
    'marco-webserver',
    `Request ${id}`,
    'finished.'
  );
}
