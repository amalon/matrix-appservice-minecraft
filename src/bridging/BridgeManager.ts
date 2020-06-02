import { Bridge } from "./Bridge";
import { BridgedAlreadyError, NotBridgedError } from "./errors";
import * as jose from 'jose';
import { v1 as uuid } from 'uuid';
import { Config } from "../Config";
import { BridgeTable, DBController } from "../db";


/**
 * The BridgeManager validates bridging between a Minecraft server and
 * corresponding Matrix room. It's important to communicate with the
 * BridgeManager before interacting with a room or Minecraft server to make
 * sure the interactions are valid.
 */
export class BridgeManager {
  private readonly db: BridgeTable;
  private readonly config: Config;

  constructor(config: Config, db: DBController) {
    this.db = db.bridges;
    this.config = config;
  }

  /**
   * This returns the established bridge based on the provided identifier
   * @param {string} id Bridge identifier
   * @returns {Bridge}
   * @throws {NotBridgedError}
   */
  public getBridge(id: string): Bridge {
    return this.db.getBridge(id);
  }

  /**
   * This checks if the provided identifier is bridged with a room
   * @param {string} id Bridge identifier
   * @returns {boolean}
   */
  public isBridged(id: string): boolean {
    return this.db.isBridged(id);
  }

  /**
   * This checks if a room ID is associated with a bridge already
   * @param {string} room Room ID
   * @returns {boolean}
   */
  public isRoomBridged(room: string): boolean {
    return this.db.isRoomBridged(room);
  }

  /**
   * This establishes a bridge
   * @param {string} room Room being bridged
   * @returns {Bridge}
   * @throws {BridgedAlreadyError}
   */
  public bridge(room: string): Bridge {
    const isBridged = this.isRoomBridged(room);

    if (!isBridged) {
      const id = jose.JWT.sign(
        { room, id: uuid() },
        this.config.webserver.privKey
      );
      this.db.setBridge(id, room);
      return new Bridge(id, room);
    } else {
      throw new BridgedAlreadyError();
    }
  }

  /**
   * This breaks a bridge
   * @param {string} id Bridge identifier
   * @returns {boolean} Whether or not it was successful
   */
  public unbridge(id: string): boolean {
    return this.db.unBridge(id);
  }
}
