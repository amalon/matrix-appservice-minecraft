import { WebInterface } from "./webserver";
import { Config } from "./Config";
import { Bridge, BridgeManager } from "./bridging";
import { MatrixInterface } from "./matrix";
import { DBController } from "./db";
import { MxEvents, MCEvents, PlayerManager } from "./minecraft";
import { MxMessage } from "./matrix/MatrixInterface";


/**
 * This is the Main classes both the WebInterface and MatrixInterface
 * communicate to this class to exchange messages between Minecraft and Matrix.
 *
 * Visual Representation:
 * Minecraft Server -> WebInterface -> Main -> Matrix
 * Minecraft Server <- WebInterface <- Main <- Matrix
 */
export class Main {
  // The matrix property interfaces everything related to Matrix this
  // includes holding new messages since the Minecraft server checked in,
  // sending and receiving messages, and some extra utilities to get the
  // job done.
  public readonly matrix: MatrixInterface;

  // The webserver interfaces with the Minecraft server. The Minecraft
  // server will periodically check for any new messages in the Matrix room
  // and even keep the webserver up-to-date on all the new messages /
  // events that happened on the server
  public readonly webserver: WebInterface;

  // This is the bridge manager it establishes new bridges, everything
  // should communicate with the BridgeManager to add, remove, or check a
  // bridge establishment.
  public readonly bridges: BridgeManager;

  // The player manager interfaces with the Mojang API to get all the
  // player data of a certain Minecraft player. It also is responsible for
  // keeping player's Minecraft appservice user in sync with their player
  // name, skin, etc.
  public readonly players: PlayerManager;

  constructor() {
    const config = Config.getConfig();
    const db = new DBController(config);

    this.webserver = new WebInterface(config, this);
    this.matrix = new MatrixInterface(config, this);
    this.bridges = new BridgeManager(config, db);
    this.players = new PlayerManager();
  }

  /**
   * This starts up the webserver and matrix appservice.
   */
  public async start() {
    await this.matrix.start();
    const router = this.matrix.appservice.expressAppInstance;
    this.webserver.start(router);
  }

  /**
   * This handles all new Matrix messages from a room
   * @param {MxMessage} message A pre-formatted message by MsgProcessor
   * @throws {NotBridgedError}
   */
  public sendToMinecraft(message: MxMessage) {
    this.matrix.addNewMxMessage(message);
  }

  /**
   * This gets all the new messages from a bridged Matrix room
   * Minecraft (GET Request)  ->           WebInterface
   * Minecraft (GET Response) <- string[]  WebInterface
   * @returns {MxEvents.Event[]}
   */
  public getNewMxMessages(bridge: Bridge): MxEvents.Event[] {
    return this.matrix.getNewMxMessages(bridge);
  }

  /**
   * This handles all new Minecraft messages provided by a Minecraft server
   * Minecraft (POST Request) Player chat event ->        WebInterface
   * Minecraft (POST Response)                  <- 200 OK WebInterface
   *
   * @param {Bridge} bridge Bridged room
   * @param {MCEvents.Message} message Message to send
   * @returns {Promise<void>}
   * @throws {NotBridgedError}
   */
  public sendToMatrix(bridge: Bridge, message: MCEvents.Message) {
    return this.matrix.sendMessage(bridge, message);
  }

  /**
   * This handles Minecraft join events provided by a Minecraft server
   * Minecraft (POST Request) Player join event ->        WebInterface
   * Minecraft (POST Response)                  <- 200 OK WebInterface
   *
   * @param {Bridge} bridge Bridged room
   * @param {MCEvents.Join} join Join event to send
   * @returns {Promise<void>}
   * @throws {NotBridgedError}
   */
  public joinToMatrix(bridge: Bridge, join: MCEvents.Join) {
    return this.matrix.sendJoin(bridge, join);
  }

  /**
   * This handles Minecraft quit events provided by a Minecraft server
   * Minecraft (POST Request) Player quit event ->        WebInterface
   * Minecraft (POST Response)                  <- 200 OK WebInterface
   *
   * @param {Bridge} bridge Bridged room
   * @param {MCEvents.Quit} quit Quit event to send
   * @returns {Promise<void>}
   * @throws {NotBridgedError}
   */
  public quitToMatrix(bridge: Bridge, quit: MCEvents.Quit) {
    return this.matrix.sendQuit(bridge, quit);
  }

  /**
   * This handles Minecraft kick events provided by a Minecraft server
   * Minecraft (POST Request) Player kick event ->        WebInterface
   * Minecraft (POST Response)                  <- 200 OK WebInterface
   *
   * @param {Bridge} bridge Bridged room
   * @param {MCEvents.Kick} kick Kick event to send
   * @returns {Promise<void>}
   * @throws {NotBridgedError}
   */
  public kickToMatrix(bridge: Bridge, kick: MCEvents.Kick) {
    return this.matrix.sendKick(bridge, kick);
  }

  /**
   * This handles Minecraft death events provided by a Minecraft server
   * Minecraft (POST Request) Player death event ->        WebInterface
   * Minecraft (POST Response)                   <- 200 OK WebInterface
   *
   * @param {Bridge} bridge Bridged room
   * @param {MCEvents.Death} death Death event to send
   * @returns {Promise<void>}
   * @throws {NotBridgedError}
   */
  public deathToMatrix(bridge: Bridge, death: MCEvents.Death) {
    return this.matrix.sendDeath(bridge, death);
  }
}
