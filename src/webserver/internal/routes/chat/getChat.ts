import { Request, Response } from "express";
import { Marco } from "../../../../Marco";
import { Bridge } from "../../../../common/Bridge";


export function getChat(req: Request, res: Response) {
  // @ts-ignore
  const marco: Marco = req['marco'];
  // @ts-ignore
  const bridge: Bridge = req['bridge'];
  const messages = marco.matrix.getNewMxMessages(bridge);
  const chat = {
    chat: messages
  };

  res.status(200);
  res.send(chat);
  res.end();
}
