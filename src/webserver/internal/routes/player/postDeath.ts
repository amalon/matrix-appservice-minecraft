import { NextFunction, Request, Response } from "express";
import { Main } from "../../../../Main";
import { Bridge } from "../../../../bridging";
import { LogService } from "matrix-bot-sdk";
import { MCEvents } from "../../../../minecraft";
import { fail } from "../../validate";
import * as Errors from "../../errors";


/**
 * POST /player/death
 * Polo will call this endpoint when a user dies
 * Example body:
 * {
 *   "message": <death message>,
 *   "player": {
 *     "name": <player name string>,
 *     "uuid": <player uuid string>
 *   }
 * }
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export async function postDeath(req: Request, res: Response): Promise<void> {
  // @ts-ignore
  const main: Main = req['main'];
  // @ts-ignore
  const bridge: Bridge = req['bridge'];
  // @ts-ignore
  const id: string = req['id'];
  const body = req.body;
  const message: string = body['message'];
  const playerRaw: { name: string, uuid: string, displayName?: string, texture?: string } = body.player;
  const player = await main.players.getPlayer(playerRaw.name, playerRaw.uuid, playerRaw.displayName, playerRaw.texture);
  const mcDeath: MCEvents.Death = {
    message,
    player
  }

  await main.deathToMatrix(bridge, mcDeath);
  res.status(200);
  res.end();
  LogService.info(
    'marco-webserver',
    `Request ${id}`,
    '- Finished.'
  );
}

/**
 * This checks the body of the request to make sure everything checks up
 * correctly.
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export function checkDeathIntegrity(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  const reqID = req['id'];
  const body = req.body;

  LogService.info(
    'WebInterface',
    `[Request ${reqID}]: Checking Death Body Integrity`
  );

  // Check message
  const message = body['message'];
  if (message == undefined) {
    fail(res, Errors.noReasonError);
    return;
  } else if (!(typeof message == 'string')) {
    fail(res, Errors.messageTypeError);
    return;
  }

  LogService.debug(
    'WebInterface',
    `[Request ${reqID}]: Message "${message}"`
  )

  /**
   * If the integrity passed this is what the body should look like:
   * {
   *   "message": "The death message",
   *   "player" {
   *     "name": "player name",
   *     "uuid": "player uuid"
   *   }
   * }
   */
  next();
}
