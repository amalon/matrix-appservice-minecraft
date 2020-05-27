/**
 * @author Dylan Hackworth <dhpf@pm.me>
 * @LICENSE GNU GPLv3
 */

/**
 * This class holds the details about an established bridge.
 * @property {string} id The current identifier is a JWT.
 *  <jwt>.room: string = room bridged
 *  <jwt>.uuid: string = token identifier
 * @property {string} room The room bridged
 */
export class Bridge {
  public readonly id: string;
  public readonly room: string;

  constructor(id: string, room: string) {
    this.id = id;
    this.room = room;
  }
}
