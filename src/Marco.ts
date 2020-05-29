import { WebServer } from "./webserver";
import { Config } from "./common/Config";
import { BridgeManager } from "./common/BridgeManager";
import { MatrixManager } from "./matrix";
import { Player, PlayerManager } from "./minecraft";


/**
 * This represents a message coming from Matrix. Note there is not "author"
 * or "sender" that is because whatever is in the body is what gets sent to
 * the Minecraft chat this keeps it simple to display whatever type of
 * message whether it's an emote or a plain text message.
 * @type MxMessage
 * @prop {string} body The body is what it will look like on Minecraft ie.
 * "<player> Hello world"
 * @prop {string} room The room it was sent from
 */
export type MxMessage = {
  body: string;
  room: string;
  sender: string;
}

/**
 * This represents a message coming from a player on Minecraft.
 * @type McMessage
 * @prop {Player} player The player that sent the message
 * @prop {string} body The body of the message
 * @prop {string} room The designation
 */
export type McMessage = {
  player: Player;
  body: string;
  room: string;
}

/**
 * This is the main class that handles managing the Matrix appservice (See
 * MatrixManager) and the webserver (See WebServer class)
 */
export class Marco {
  // The matrix property interfaces everything related to Matrix this
  // includes holding new messages since the Minecraft server checked in,
  // sending and receiving messages, and some extra utilities to get the
  // job done.
  public readonly matrix: MatrixManager;
  // The webserver interfaces with the Minecraft server. The minecraft
  // server will periodically check for any new messages in the Matrix room
  // and even keep the webserver up-to-date on all the new messages /
  // events that happened on the server
  public readonly webserver: WebServer;
  // This is the bridge manager it establishes new bridges, it doesn't
  // quite have any interesting features rather it just validates a bridge
  // between a server and a room. The BridgeManager must be checked in with
  // before any interaction between a server and a room can happen
  public readonly bridges: BridgeManager;
  // The player manager keeps a Minecraft player's Matrix puppet in sync
  // with their player's face, name, and UUID. This ultimately interacts
  // with the Mojang API and crops the face out of the player's skin.
  public readonly players: PlayerManager;

  constructor() {
    const config = Config.getConfig();

    this.webserver = new WebServer(config, this);
    this.matrix = new MatrixManager(config, this);
    this.bridges = new BridgeManager(config);
    this.players = new PlayerManager();
  }

  /**
   * This starts up the webserver and matrix appservice.
   */
  public async start() {
    await this.webserver.start();
    await this.matrix.start();
  }

  /**
   * This handles all new Matrix messages from a room
   * Minecraft (GET Request) -> Marco
   * Minecraft (GET Response): MxMessage[] <- Marco
   * @param {MxMessage} message
   * @throws {NotBridgedError}
   */
  public onMxChat(message: MxMessage) {
    const bridge = this.bridges.getBridge(message.room);

    this.matrix.addNewMxMessage(bridge, message);
  }

  /**
   * This handles all new Minecraft messages provided by a Minecraft server
   * Minecraft (POST Request): McMessage -> Marco
   * Minecraft (POST Response): 200 OKAY <- Marco
   * @param {McMessage} message
   * @returns {Promise<void>}
   * @throws {NotBridgedError}
   */
  public onMcChat(message: McMessage): Promise<void> {
    return this.matrix.sendMessage(message);
  }
}
