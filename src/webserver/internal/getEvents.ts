import type { Request, Response } from "express";
import type { Main } from "../../Main";
import type { Bridge } from "../../bridging";
import type { MxEvents } from "../../minecraft";
import { LogService } from "matrix-bot-sdk";


/**
 * GET /events/
 * Polo will call this endpoint to get all the events from the Matrix room
 * @param {Request} req
 * @param {Response} res
 */
export function getEvents(req: Request, res: Response) {
  // @ts-ignore
  const main: Main = req['main'];
  // @ts-ignore
  const bridge: Bridge = req['bridge'];
  // @ts-ignore
  const id = req['id'];
  const events = main.getNewMxMessages(bridge);
  const chat = {
    events: events
  };

  res.status(200);
  res.send(chat);
  res.end();
  LogService.info(
    'WebInterface',
    `[Request ${id}]: Finished.`
  );
}

