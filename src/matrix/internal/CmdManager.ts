import { Appservice } from "matrix-bot-sdk";
import { Main } from "../../Main";
import { BridgeError } from "../../bridging";
import { MxEvents } from "../../minecraft";


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
    " corresponding with this room\n" +
    ' - announce <...announcement>: This will send an announcement as' +
    ' "Server". Send this command in a bridged room.'
  private readonly appservice: Appservice;
  private readonly main: Main;


  constructor(appservice: Appservice, main: Main) {
    this.appservice = appservice;
    this.main = main;
  }

  /**
   * This handles m.room.message events that involve commands
   * @param {string} room Room ID
   * @param {string} sender
   * @param {string} body Text-body of the command
   */
  public async onMxMessage(room: string, sender: string, body: string) {
    // args = ["!minecraft", "bridge" || "unbridge" || undefined]
    const args = body.split(' ');
    const client = this.appservice.botClient;

    switch (args[1]) {
      case 'bridge':
        await this.bridge(room, sender, args);
        break;
      case 'unbridge':
        await this.unbridge(room, sender, args);
        break;
      case 'announce':
        const announcement = body.substr(
          CmdManager.prefix.length + " announce".length
        );
        await this.announce(room, sender, announcement);
        break;
      default:
        await client.sendNotice(room, CmdManager.help);
    }
  }

  /**
   * This checks if the user has a power level greater than state_default
   * @param {string} room Room checking in
   * @param {string} user User checking
   * @returns {Promise<boolean>}
   */
  private async checkPrivilege(room: string, user: string): Promise<boolean> {
    const client = this.appservice.botClient;
    const powerLevels = await client.getRoomStateEvent(
      room,
      'm.room.power_levels',
      ''
    );
    const stateEventPower: number = powerLevels['state_default'] || 50;
    const senderPower: number = powerLevels['users'][user] || 0;
    const hasPerms = (senderPower >= stateEventPower);

    if (!hasPerms) {
      await client.sendNotice(
        room,
        `You need a higher power level (<${stateEventPower})`,
      );
    }

    return hasPerms;
  }

  /**
   * This handles bridging errors
   * @param {string} room Room to talk in
   * @param {any} err Error to talk about
   */
  private async bridgeError(room: string, err: any) {
    const client = this.appservice.botClient;

    if (err instanceof BridgeError.BridgedAlreadyError) {
      await client.sendNotice(
        room,
        "This room is already bridged to a server.",
      );
    } else if (err instanceof Error) {
      if (err.message == 'Invalid room ID or alias') {
        await client.sendNotice(
          room,
          CmdManager.help
        );
      } else {
        await client.sendNotice(
          room,
          "Something went wrong: " + err.message
        );
      }
    } else {
      await client.sendNotice(
        room,
        'Something went wrong'
      );
    }
  }

  /**
   * Makes an announcement as the Server in Minecraft.
   * @param {string} room Room ID
   * @param {string} sender User ID
   * @param {string} body Body of the announcement
   */
  private async announce(room: string, sender: string, body: string) {
    const client = this.appservice.botClient;
    const hasPerms = await this.checkPrivilege(room, sender);

    if (!hasPerms) {
      return;
    }

    const isBridged = await this.main.bridges.isRoomBridged(room);

    if (isBridged) {
      this.main.sendToMinecraft({
        room: room,
        sender,
        body: `[Server] ${body}`,
        event: <MxEvents.AnnounceMessageEvent> {
          sender: {
            mxid: sender,
            displayName: sender
          },
          type: "message.announce",
          body: body,
        } as MxEvents.Event
      });
      await client.sendNotice(room, "Sent!");
    } else {
      await client.sendNotice(room, "This room isn't bridged.")
    }

  }

  /**
   * Establishes a new bridge
   * @param {string} room
   * @param {string} sender
   * @param {string[]} args ["!minecraft", "bridge", "<room id>" || undefined]
   * @returns {Promise<void>}
   */
  private async bridge(room: string, sender: string, args: string[]) {
    const client = this.appservice.botClient;

    try {
      // Get the room they're referring to
      const target = await client.resolveRoom(args[2] || '');
      if (!target) {
        await client.sendNotice(room, "That room doesn't exist");
        return;
      }

      // See if the user has state_default perms
      const hasPerms = await this.checkPrivilege(room, sender);
      if (hasPerms) {
        const bridge = this.main.bridges.bridge(target);
        await client.sendNotice(
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
  private async unbridge(room: string, sender: string, args: string[]) {
    const client = this.appservice.botClient;

    try {
      // Get the room they're referring to
      const target = await client.resolveRoom(args[2] || '');

      if (!target) {
        await client.sendNotice(room, "That room doesn't exist");
        return;
      }

      // See if the user has state_default perms
      const hasPerms = await this.checkPrivilege(room, sender);

      if (hasPerms) {
        const unbridged = this.main.bridges.unbridge(target);

        if (unbridged)
          await client.sendNotice(room, "Room has been unbridged.");
        else
          await client.sendNotice(room, "The room was never bridged.");
      }
    } catch (err) {
      await this.bridgeError(room, err);
    }
  }
}
