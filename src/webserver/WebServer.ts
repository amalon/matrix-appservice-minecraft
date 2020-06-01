import express, {
  Application,
  NextFunction,
  Request,
  Response
} from "express";
import type { Config } from "../common/Config";
import type { Marco } from "../Marco";
import { NotBridgedError } from "../common/errors";
import { chatRouter } from "./internal/routes";
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

      LogService.info(
        "marco:WebServer",
        `Vibe Request ${id}\n` +
        ` - token: ${token}`
      );
      const bridge = this.marco.bridges.getBridge(token);

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
      if (err instanceof NotBridgedError) {
        LogService.warn(
          "marco:WebServer",
          `Vibe Request ${id}\n` +
          `Invalid Bridge`
        );
        res.status(401);
        res.send({ "status": "BAD", "error": Errors.invalidTokenError });
        res.end();
      } else {
        LogService.error(
          "marco:WebServer",
          err
        );
        res.status(500);
        res.send({ "status": "BAD", "error": Errors.serverError })
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
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
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
      const bridge = this.marco.bridges.getBridge(token);

      LogService.info(
        "marco:WebServer",
        `Request ${id}\n` +
        " - Authorized"
      );

      // @ts-ignore
      req['marco'] = this.marco;
      // @ts-ignore
      req['bridge'] = bridge;
      // @ts-ignore
      req['id'] = id;

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

