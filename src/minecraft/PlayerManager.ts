import { Player } from "./internal/Player";
import type { Intent } from "matrix-bot-sdk";


type MarcoProfile = {
  skin64: string;
}

/**
 * The PlayerManager class handles interaction with the Mojang API to get
 * all the player details of a certain player on Minecraft. It even goes to
 * the extent of cropping the head out of a player's skin to keep their
 * Matrix puppet in sync
 */
export class PlayerManager {
  private readonly players: Map<string, Player>;

  constructor() {
    this.players = new Map();
  }

  /**
   * This gets a Player object which represents a Minecraft player this
   * will allow us to get all the details we need about a certain player.
   * For more details see the Player class.
   * NOTE: At least one argument must be provided.
   * @example

   let player = getPlayer(null, "5bce3068e4f3489fb66b5723b2a7cdb1");
   // OR
   player = getPlayer("dhmci");

   * @param {?string} name Player's name
   * @param {?string} uuid Player's UUID
   * @returns {Promise<void>}
   * @throws {Error} if both parameters are undefined
   */
  public async getPlayer(name?: string, uuid?: string): Promise<Player> {
    let player = this.players.get(uuid || '');

    if (player)
      return player;
    else if (!name && !uuid)
      throw new Error('Both parameters can not be undefined');
    else {
      player = new Player(name, uuid);
      uuid = await player.getUUID();
      this.players.set(uuid, player);
      return player;
    }
  }

  /**
   * This syncs details of a Minecraft player and Matrix appservice user to
   * make sure they look the same.
   * @param {Intent} intent The Matrix version of the provided player
   * @param {Player} player The player being mimicked
   * @returns {Promise<void>}
   */
  public async sync(intent: Intent, player: Player): Promise<void> {
    const mxProfile = await intent.underlyingClient.getUserProfile(
      intent.userId
    );
    const playerName = await player.getName();
    const mcProfile = await player.getProfile();
    const mxName: string | undefined = mxProfile['displayname'];
    const mxAvatar: string | undefined = mxProfile['avatar_url'];
    let marcoProfile: MarcoProfile | undefined;
    try {
      marcoProfile = await intent.underlyingClient.getAccountData("dev.dhdf.marco");
    } catch (err) {
      marcoProfile = undefined;
    }


    // Sync display name with in-game player name
    if (mxName != playerName) {
      await intent.underlyingClient.setDisplayName(playerName);
    }

    // Sync their Matrix's avatar with their in-game skin ...

    // This is a base64 encoding representation of the player's texture. It
    // can be a skin, cape, or both. We can use this base64 encoding to see
    // if they've updated their skin.
    const skinBase64 = mcProfile.properties[0].value;

    if (!mxAvatar) {
      // This will get the skin and crop the head out (see getHead method)
      const head = await player.getHead();
      // This will get sent to the Intent's account data so we can use it
      // to see if their base64 encoding has updated in the future
      const marcoProfile: MarcoProfile = {
        skin64: skinBase64
      };

      // This represents their new Matrix-content-url (mxc) which can be
      // used to set their Matrix user's avatar
      const mxUrl = await intent.underlyingClient.uploadContent(
        head,
        'image/png', // All skins are in PNG format
        playerName + '-head.png'
      );
      await intent.underlyingClient.setAvatarUrl(mxUrl)
      await intent.underlyingClient.setAccountData(
        "dev.dhdf.marco",
        marcoProfile
      );
    }
  }
}

