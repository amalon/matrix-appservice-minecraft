/**
 * @author Dylan Hackworth <dhpf@pm.me>
 * @LICENSE GNU GPLv3
 */
import { Bridge } from "./Bridge";
import { BridgedAlreadyError, NotBridgedError } from "./errors";
import * as jose from 'jose';
import { v1 as uuid } from 'uuid';
import { Config } from "./Config";


/**
 * The BridgeManager validates bridges between a Minecraft server and
 * corresponding Matrix room. It's important to communicate with the
 * BridgeManager before interacting with a room or Minecraft server to make
 * sure the interactions are valid.
 */
export class BridgeManager {
  private readonly bridges: Map<string, Bridge>
  private readonly config: Config;

  constructor(config: Config) {
    this.bridges = new Map();
    this.config = config;
  }

  /**
   * This returns the established bridge based on the provided identifier
   * @param {string} id Bridge identifier
   * @returns {Bridge}
   * @throws {NotBridgedError}
   */
  public getBridge(id: string): Bridge {
    for (const bridge of this.bridges.values()) {
      if (bridge.room == id || bridge.id == id) {
        return bridge;
      }
    }
    throw new NotBridgedError();
  }

  /**
   * This checks if the provided identifier is bridged with a room
   * @param {string} id Bridge identifier
   * @returns {boolean}
   */
  public isBridged(id: string): boolean {
    try {
      const bridge = this.getBridge(id);
      return bridge != undefined
    } catch (err) {
      return false;
    }
  }

  /**
   * This establishes a bridge
   * @param {string} room Room being bridged
   * @returns {Bridge}
   * @throws {BridgedAlreadyError}
   */
  public bridge(room: string): Bridge {
    const signed = jose.JWT.sign(
      { room, id: uuid() },
      this.config.webserver.privKey
    );
    return this.setBridge(signed, room);
  }

  /**
   * This breaks a bridge
   * @param {string} id Bridge identifier
   * @returns {boolean} Whether or not it was successful
   */
  public unbridge(id: string): boolean {
    return this.bridges.delete(id);
  }

  /**
   * This establishes a new bridge
   * @param {string} id Bridge identifier
   * @param {string} room Room bridged with
   * @returns {Bridge}
   * @throws {BridgedAlreadyError}
   */
  private setBridge(id: string, room: string): Bridge {
    const isBridged = this.isBridged(room);

    if (!isBridged) {
      const bridge = new Bridge(id, room);
      this.bridges.set(id, bridge);
      return bridge;
    } else
      throw new BridgedAlreadyError();
  }
}
