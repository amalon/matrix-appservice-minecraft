import type { Request, Response } from "express";
import type { Main } from "../../../../Main";
import type { Bridge } from "../../../../bridging";
import type { MxEvents } from "../../../../minecraft";
import { LogService } from "matrix-bot-sdk";


/**
 * GET /chat/
 * Polo will call this endpoint to get all the messages from the Matrix room.
 * This is a legacy interface provided only for compatibility, and will discard
 * any non-message events. Please use the /chat/events/ endpoint instead.
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
  let messages: string[] = []
  main.getNewMxMessages(bridge).forEach(
    function (rawEvent) {
      switch (rawEvent['type']) {
        case "message.emote": {
          let event = rawEvent as MxEvents.EmoteMessageEvent;
          messages.push(` * <${event['sender']['displayName']}> ${event['body']}`);
          break;
        }
        case "message.text": {
          let event = rawEvent as MxEvents.TextMessageEvent;
          messages.push(`<${event['sender']['displayName']}> ${event['body']}`);
          break;
        }
        case "message.announce": {
          let event = rawEvent as MxEvents.AnnounceMessageEvent;
          messages.push(`[Server] ${event['body']}`);
          break;
        }
      }
    });
  const chat = {
    chat: messages
  };

  res.status(200);
  res.send(chat);
  res.end();
  LogService.info(
    'WebInterface',
    `[Request ${id}]: Finished.`
  );
}
