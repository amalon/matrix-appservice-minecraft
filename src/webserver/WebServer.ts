/**
 * This webserver currently has one endpoint which is /head/ see head.ts
 * file in the routes directory.
 * @author Dylan Hackworth
 * @license GNU GPLv3
 */
import express, {
  Application,
  NextFunction,
  Request,
  Response
} from "express";
import type { Config } from "../common/Config";
import type { Marco } from "../Marco";
import { NotBridgedError } from "../common/errors";
import { chatRouter } from "./internal/routes/chat/chatRouter";
import { LogService } from "matrix-bot-sdk";
import { v1 as uuid } from "uuid";
import * as Errors from "./internal/errors";


export class WebServer {
  private readonly app: Application;
  private readonly marco: Marco
  private readonly config: Config;

  public constructor(config: Config, marco: Marco) {
    this.app = express();
    this.marco = marco;
    this.config = config;
  }

  /**
   * This starts the webserver
   */
  public start() {
    // Vibe check for checking client to server integrity, if it passes the
    // checkAuth method then everything is good
    this.app.get('/vibecheck', this.vibeCheck.bind(this));

    // All the endpoints require authorization
    this.app.use('/', (req, res, next) => this.checkAuth(req, res, next));

    // Chat endpoint for getting messages and posting minecraft chat messages
    this.app.use('/chat', chatRouter);

    this.app.listen(this.config.webserver.port, () => {
      LogService.info(
        'webserver',
        `Listening on port ${this.config.webserver.port}`
      );
    });
  }

  private vibeCheck(req: Request, res: Response): void {
    const auth = req.header('Authorization');
    try {
      res.setHeader('Content-Type', 'application/json');

      // Check if they provided an auth token
      if (!auth) {
        res.status(401);
        res.send({ "status": "BAD", "error": Errors.noTokenError });
        res.end();
        return;
      }

      const token = auth.split(' ')[1];
      if (!token) {
        res.status(401);
        res.send({ "status": "BAD", "error": Errors.noTokenError });
        res.end();
        return;
      }
      const bridge = this.marco.bridges.getBridge(token);

      res.status(200);
      res.send({
        "status": "OK",
        "bridge": bridge.room
      });
      res.end();

    } catch (err) {
      if (err instanceof NotBridgedError) {
        res.status(401);
        res.send({ "status": "BAD", "error": Errors.invalidTokenError });
        res.end();
      }
    }
  }

  /**
   * Every request needs to be authorized
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  private checkAuth(req: Request, res: Response, next: NextFunction) {
    const auth = req.header('Authorization');

    if (auth == undefined) {
      res.status(401);
      res.end();
      return;
    }
    // split = ['Bearer', <access token>]
    const split = auth.split(' ');

    if (split.length < 2) {
      res.status(401);
      res.end();
      return;
    }

    const token = split[1];

    try {
      const bridge = this.marco.bridges.getBridge(token);
      const id = uuid();

      LogService.info(
        "webserver",
        `[${id}] Request from ${req.ip}\n` +
        `[${req.method}] Target: ${req.path}\n` +
        `User-Agent: ${req.header('User-Agent')}\n` +
        `Body: ${req.body}\n` +
        `Length: ${req.readableLength}\n`
      );

      // @ts-ignore
      req['marco'] = this.marco;
      // @ts-ignore
      req['bridge'] = bridge;

      next();
    } catch (err) {
      if (err instanceof NotBridgedError) {
        res.status(401);
        res.send(Errors.invalidTokenError);
        res.end();
      }
    }

  }
}

