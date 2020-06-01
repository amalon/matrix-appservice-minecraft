import bent, { RequestFunction } from 'bent';
import sharp from "sharp";
import { Responses, Skin, Texture } from './types';
import * as Endpoints from "./endpoints";


/**
 * This class represents a player in Minecraft. It interacts with the
 * Mojang API (credit to wiki.vg for mapping out all the endpoints) to get
 * all the attributes in all the accessor methods.
 */
export class Player {
  private name: string | null;
  private uuid: string | null;

  public constructor(name?: string, uuid?: string) {
    this.name = name || null;
    this.uuid = uuid || null;
  }

  /**
   * This decodes the base64 encoding which represents the player's
   * texture, this can include a cape, skin, both, or neither.
   * @param {Texture} texture
   * @returns {Skin}
   */
  public static parseTexture(texture: Texture): Skin {
    let decoded = Buffer.from(texture.value, 'base64')
      .toString('utf-8');
    return JSON.parse(decoded);
  }

  /**
   * Retrieves the UUID of this player, this method should always be called
   * when trying to access the UUID property.
   * Playername -> UUID
   * @link https://wiki.vg/Mojang_API#Username_-.3E_UUID_at_time
   * @returns {Promise<string>}
   */
  public async getUUID(): Promise<string> {
    if (this.uuid != null)
      return this.uuid;
    else {
      const name = await this.getName();
      const getJSON = bent('json') as RequestFunction<Responses.UUID>;
      const target = Endpoints.get.uuid.replace(/({playername})/g, name);
      const res = await getJSON(target);

      this.uuid = res.id;
      return res.id;
    }
  }

  /**
   * This gets the playername assigned to the UUID.
   * @returns {Promise<string>}
   */
  public async getName(): Promise<string> {
    if (this.name != null)
      return this.name;
    else {
      const profile = await this.getProfile();

      this.name = profile.name;

      return profile.name;
    }
  }

  /**
   * Retrieves the name history of this player
   * UUID -> Name history
   * @link https://wiki.vg/Mojang_API#UUID_-.3E_Name_history
   * @returns {Promise<NameHistory>}
   */
  public async getNameHistory(): Promise<Responses.NameHistory> {
    const getJSON = bent('json') as RequestFunction<Responses.NameHistory>;
    const uuid = await this.getUUID();
    const target = Endpoints.get.nameHistory.replace(/({uuid})/g, uuid);

    return getJSON(target);
  }

  /**
   * This gets the player's profile
   * GET UUID -> Profile + Skin/Cape
   * @link https://wiki.vg/Mojang_API#UUID_-.3E_Profile_.2B_Skin.2FCape
   * @returns {Promise<Profile>}
   */
  public async getProfile(): Promise<Responses.Profile> {
    const getJSON = bent('json') as RequestFunction<Responses.Profile>
    const uuid = await this.getUUID();
    const target = Endpoints.get.profile.replace(/({uuid})/g, uuid);

    return getJSON(target);
  }

  /**
   * This decodes the base64 encoding representing the player's skin, cape,
   * or both. It then gets the file from that link and returns it into a Buffer
   * @returns {Promise<Buffer>}
   * @throws {Error} if there is no custom skin
   */
  public async getSkin(): Promise<Buffer> {
    let profile = await this.getProfile();
    if (profile.properties.length >= 1) {
      let texture = profile.properties[0];
      let parsed = Player.parseTexture(texture);

      if (parsed.textures.SKIN) {
        const getBuffer = bent('buffer');
        const target = new URL(parsed.textures.SKIN.url);

        target.protocol = 'https';

        return await getBuffer(target.toString()) as Buffer;
      } else {
        throw new Error('No custom skin');
      }
    } else {
      throw new Error('No custom skin');
    }
  }

  /**
   * This method crops the head out of the skin into a buffer
   * @returns {Promise<Buffer>}
   */
  public async getHead(): Promise<Buffer> {
    const skin = await this.getSkin();
    let image = sharp(skin);
    let head = image
      .extract({
        top: 8,
        left: 8,
        width: 8,
        height: 8,
      }).resize(200, 200, {
        kernel: sharp.kernel.nearest,
      });

    return new Promise((resolve, reject) => {
      head.toBuffer(((err, buffer) => {
        if (err)
          reject(err);
        else {
          resolve(buffer);
        }
      }));
    });
  }

  /**
   * Gets the URL of the player's skin
   * @returns {Promise<string>}
   * @throws {Error} if there is no custom skin
   */
  public async getSkinURL(): Promise<string> {
    let profile = await this.getProfile();

    if (profile.properties.length >= 1) {
      let texture = profile.properties[0];
      let parsed = Player.parseTexture(texture);

      if (parsed.textures.SKIN) {
        return parsed.textures.SKIN.url;
      } else {
        throw new Error('No custom skin');
      }
    } else {
      throw new Error('No custom skin');
    }
  }
}
