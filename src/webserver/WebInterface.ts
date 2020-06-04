import type { NextFunction, Request, Response, Router } from "express";
import type { Config } from "../Config";
import type { Main } from "../Main";
import { BridgeError } from "../bridging";
import { chatRouter } from "./internal/routes";
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

    // Chat endpoint for getting messages and posting minecraft chat messages
    app.use('/chat', chatRouter);
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

    LogService.info(
      "marco:WebServer",
      `Vibe Request ${id}\n` +
      ` - User-Agent: ${req.header('User-Agent')}`
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

      LogService.info(
        "marco:WebServer",
        `Vibe Request ${id}\n` +
        ` - token: ${token}`
      );
      const bridge = this.main.bridges.getBridge(token);

      LogService.info(
        "marco:WebServer",
        `Vibe Request ${id}\n` +
        ` - Valid Bridge`
      );

      res.status(200);
      res.send({
        "status": "OK",
        "bridge": bridge.room
      });
      res.end();

    } catch (err) {
      if (err instanceof BridgeError.NotBridgedError) {
        LogService.warn(
          "marco:WebServer",
          `Vibe Request ${id}\n` +
          `Invalid Bridge`
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

    LogService.info(
      "marco:WebServer",
      `Vibe Request ${id}\n` +
      ` - Finished`
    );
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

    LogService.info(
      "marco:WebServer",
      `Request ${id}\n` +
      ` - Endpoint: ${req.method} ${req.path}\n` +
      ` - User-Agent: ${req.header('User-Agent')}`
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
        "marco:WebServer",
        `Request ${id}\n` +
        " - Authorized"
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

