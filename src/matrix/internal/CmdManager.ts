import { Appservice, MatrixClient } from "matrix-bot-sdk";
import { Main } from "../../Main";
import { BridgeError } from "../../bridging";


/**
 * This class handles all the commands on the Matrix side a user can use
 * "!minecraft" to interact with the bot and establish a bridge.
 */
export class CmdManager {
  public static readonly prefix = "!minecraft";
  private static readonly help =
    "Command List:\n" +
    // see <CmdBridge>.handleBridge method
    " - bridge <room ID>: This will provide an access token to give a" +
    " Minecraft server to send and retrieve messages in the room with.\n" +
    // see <CmdBridge>.handleUnbridge method
    " - unbridge <room ID>: This will forcefully invalidate any tokens" +
    " corresponding with this room"
  private readonly appservice: Appservice;
  private readonly main: Main;


  constructor(appservice: Appservice, main: Main) {
    this.appservice = appservice;
    this.main = main;
  }

  /**
   * This checks if the user has a power level greater than state_default
   * @param {MatrixClient} client Client to utilize to check privilege
   * @param {string} room Room checking in
   * @param {string} user User checking
   * @returns {Promise<boolean>}
   */
  private static async checkPrivilege(client: MatrixClient,
                                      room: string,
                                      user: string): Promise<boolean> {
    const powerLevels = await client.getRoomStateEvent(
      room,
      'm.room.power_levels',
      ''
    );
    const stateEventPower: number = powerLevels['state_default'] || 50;
    const senderPower: number = powerLevels['users'][user] || 0;
    const hasPerms = (senderPower >= stateEventPower);

    if (!hasPerms) {
      await client.sendText(
        room,
        `You need a higher power level (<${stateEventPower})`,
      );
    }

    return hasPerms;
  }

  /**
   * This handles m.room.message events that involve commands
   * @param {string} room Room ID
   * @param {string} sender
   * @param {string} body Text-body of the command
   * @returns {Promise<void>}
   */
  public async onMxMessage(room: string, sender: string, body: string) {
    // args = ["!minecraft", "bridge" || "unbridge" || undefined]
    const args = body.split(' ');
    const client = this.appservice.botClient;

    switch (args[1]) {
      case 'bridge':
        await this.handleBridge(room, sender, args);
        break;
      case 'unbridge':
        await this.handleUnbridge(room, sender, args);
        break;
      default:
        await client.sendText(room, CmdManager.help);
    }
  }

  /**
   * This handles bridging errors
   * @param {string} room Room to talk in
   * @param {any} err Error to talk about
   */
  private async bridgeError(room: string, err: any) {
    const client = this.appservice.botClient;

    if (err instanceof BridgeError.BridgedAlreadyError) {
      await client.sendText(
        room,
        "This room is already bridged to a server.",
      );
    } else if (err instanceof Error) {
      if (err.message == 'Invalid room ID or alias') {
        await client.sendText(
          room,
          CmdManager.help
        );
      } else {
        await client.sendText(
          room,
          "Something went wrong: " + err.message
        );
      }
    } else {
      await client.sendText(
        room,
        'Something went wrong'
      );
    }
  }

  /**
   * Establishes a new bridge
   * @param {string} room
   * @param {string} sender
   * @param {string[]} args ["!minecraft", "bridge", "<room id>" || undefined]
   * @returns {Promise<void>}
   */
  private async handleBridge(room: string, sender: string, args: string[]) {
    const client = this.appservice.botClient;

    try {
      // Get the room they're referring to
      const target = await client.resolveRoom(args[2] || '');
      if (!target) {
        await client.sendText(room, "That room doesn't exist");
        return;
      }

      // See if the user has state_default perms
      const hasPerms = await CmdManager.checkPrivilege(client, room, sender);
      if (hasPerms) {
        const bridge = this.main.bridges.bridge(target);
        await client.sendText(
          room,
          'Bridged! Go-to the Minecraft server and execute' +
          `"/bridge <token>"\n${bridge.id}`
        );
      }
    } catch (err) {
      await this.bridgeError(room, err);
    }
  }

  /**
   * Remove a bridge
   * @param {string} room
   * @param {string} sender
   * @param {string[]} args
   * ["!minecraft", "unbridge", "<room id>" || undefined]
   * @returns {Promise<void>}
   */
  private async handleUnbridge(room: string, sender: string, args: string[]) {
    const client = this.appservice.botClient;

    try {
      // Get the room they're referring to
      const target = await client.resolveRoom(args[2] || '');

      if (!target) {
        await client.sendText(room, "That room doesn't exist");
        return;
      }

      // See if the user has state_default perms
      const hasPerms = await CmdManager.checkPrivilege(client, room, sender);

      if (hasPerms) {
        const unbridged = this.main.bridges.unbridge(target);

        if (unbridged)
          await client.sendText(room, "Room has been unbridged.");
        else
          await client.sendText(room, "The room was never bridged.");
      }
    } catch (err) {
      await this.bridgeError(room, err);
    }
  }
}
