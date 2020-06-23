import type { NextFunction, Request, Response, Router } from "express";
import type { Config } from "../Config";
import type { Main } from "../Main";
import { BridgeError } from "../bridging";
import { chatRouter } from "./internal/routes";
import { playerRouter } from "./internal/routes";
import { getEvents } from "./internal/getEvents";
import { LogService } from "matrix-bot-sdk";
import { v1 as uuid } from "uuid";
import * as Errors from "./internal/errors";


export class WebInterface {
  private readonly main: Main
  private readonly config: Config;

  public constructor(config: Config, main: Main) {
    this.main = main;
    this.config = config;
  }

  /**
   * This starts the webserver
   * @param {Router} app Router to extend off of
   */
  public start(app: Router) {
    // Vibe check for checking client to server integrity, if it passes the
    // checkAuth method then everything is good
    app.get('/vibecheck', this.vibeCheck.bind(this));

    // Check all authorization headers at these endpoints
    app.use('/chat', this.checkAuth.bind(this));
    app.use('/events', this.checkAuth.bind(this));
    app.use('/player', this.checkAuth.bind(this));

    // Chat endpoint for getting messages and posting minecraft chat messages
    app.use('/chat', chatRouter);

    // Events endpoint for getting messages and events from Matrix
    app.get('/events', getEvents);

    // Player endpoint for posting minecraft player events
    app.use('/player', playerRouter);
  }

  /**
   * This intakes an HTTP request that has a bearer token. In that token
   * should determine whether or not it's bridged with a room. If it is
   * then we're vibing, otherwise not so much.
   * @param {Request} req The request object being read from
   * @param {Response} res The response object being sent to the requester
   */
  private vibeCheck(req: Request, res: Response) {
    const auth = req.header('Authorization');
    const id = uuid();

    LogService.info("WebInterface", `[Request ${id}]`);
    LogService.info(
      "WebInterface",
      `[Request ${id}]: Endpoint ${req.method} ${req.path}`
    );

    try {
      res.setHeader('Content-Type', 'application/json');

      // Check if they provided an auth token
      if (!auth) {
        res.status(401);
        res.send(Errors.noTokenError);
        res.end();
        return;
      }

      const token = auth.split(' ')[1];

      if (!token) {
        res.status(401);
        res.send(Errors.noTokenError);
        res.end();
        return;
      }

      const bridge = this.main.bridges.getBridge(token);

      LogService.info("WebInterface", `[Request ${id}]: Authorized`);

      res.status(200);
      res.send({
        "status": "OK",
        "bridge": bridge.room
      });
      res.end();

    } catch (err) {
      if (err instanceof BridgeError.NotBridgedError) {
        LogService.warn(
          "WebInterface",
          `[Request ${id}]: Unauthorized`
        );
        res.status(401);
        res.send(Errors.invalidTokenError);
        res.end();
      } else {
        LogService.error(
          "marco:WebServer",
          err
        );
        res.status(500);
        res.send(Errors.serverError);
      }
    }

    LogService.info("WebInterface", `[Request ${id}]: Finished`);
  }

  /**
   * Every request needs to be authorized
   * @param {Request} req The request object being read from
   * @param {Response} res The response object being sent to the requester
   * @param {NextFunction} next This is called if the checkAuth passes
   */
  private checkAuth(req: Request, res: Response, next: NextFunction) {
    // This represents the identifier for the request being made (for
    // logging purposes)
    const id = uuid();

    LogService.info("WebInterface", `[Request ${id}]`);
    LogService.info(
      "WebInterface",
      `[Request ${id}]: Endpoint ${req.method} ${req.path}`
    );

    const auth = req.header('Authorization');

    // Let's see if they actually provided an authorization header
    if (auth == undefined) {
      res.status(401);
      res.end();
      return;
    }
    // split = ['Bearer', <access token>]
    const split = auth.split(' ');

    // Make sure they provided "Bearer <access token>"
    if (split.length < 2) {
      res.status(401);
      res.end();
      return;
    }

    // This is the token they provided in the authorization header
    const token = split[1];

    try {
      // The BrideManager associates tokens with rooms and if this is a
      // valid token it will result in a Bridge type otherwise it will
      // throw a NotBridgedError
      const bridge = this.main.bridges.getBridge(token);

      LogService.info(
        "WebInterface",
        `[Request ${id}]: Authorized`
      );

      // @ts-ignore
      req['main'] = this.main;
      // @ts-ignore
      req['bridge'] = bridge;
      // @ts-ignore
      req['id'] = id;

      next();
    } catch (err) {
      if (err instanceof BridgeError.NotBridgedError) {
        res.status(401);
        res.send(Errors.invalidTokenError);
        res.end();
      } else {
        res.status(500);
        res.send(Errors.serverError);
        res.end();
      }
    }
  }
}

