import * as matrix from "matrix-bot-sdk";
import { LogService } from "matrix-bot-sdk";
import { RegManager } from "./internal/RegManager";
import { Config } from "../Config";
import type { Main } from "../Main";
import { Bridge } from "../bridging";
import { CmdManager } from "./internal/CmdManager";
import { MsgProcessor } from "./internal/MsgProcessor";
import type { MCEvents } from "../minecraft";


export type MxMessage = {
  sender: string;
  room: string;
  body: string;
}

/**
 * The MatrixManager class has everything to do with Matrix's appservice
 * API and a couple utilities such as checking if a room exists. It's
 * responsible for keeping an appservice user in sync with their
 * corresponding Minecraft player by communicating with the PlayerManager.
 * It also stores new room messages in the newMxMessages for the Minecraft
 * server to retrieve periodically.
 */
export class MatrixInterface {
  // Interfaces with Matrix
  public readonly appservice: matrix.Appservice;
  private readonly main: Main;
  // Collects new messages for Minecraft servers
  private readonly newMxMessages: Map<string, string[]>
  // Handles commands given by Matrix users
  private readonly cmdManager: CmdManager;
  // Converts matrix messages into McMessages
  private readonly msgProcessor: MsgProcessor;


  constructor(config: Config, marco: Main) {
    let registration = RegManager.getRegistration(config);

    this.main = marco;
    this.msgProcessor = new MsgProcessor(this);
    this.appservice = new matrix.Appservice({
      registration,
      bindAddress: config.appservice.bindAddress,
      homeserverName: config.appservice.homeserverName,
      homeserverUrl: config.appservice.homeserverURL,
      port: config.appservice.port
    });
    this.cmdManager = new CmdManager(this.appservice, this.main);
    this.newMxMessages = new Map();
  }

  /**
   * This begins the appservice, it's important to call this method first
   * before anything else.
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    matrix.AutojoinRoomsMixin.setupOnAppservice(this.appservice);

    this.appservice.on('room.message', this.onMxMessage.bind(this));

    await this.appservice.begin();
  }

  /**
   * This intakes a Minecraft chat message and relays it the provided bridged
   * room.
   * @param {Bridge} bridge
   * @param {MCEvents.Message} mcMessage
   * @returns {Promise<void>}
   */
  public async sendMessage(bridge: Bridge, mcMessage: MCEvents.Message): Promise<void> {
    // The player UUID is the Matrix appservice user's Matrix ID
    const uuid = await mcMessage.player.getUUID();
    // This is the representing Matrix user
    const intent = this.appservice.getIntentForSuffix(uuid);

    try {
      await intent.ensureRegistered();
      // Keep the player name, skin in sync with their profile data on Matrix
      await this.main.players.sync(intent, mcMessage.player);

      // Finally send the message to the room, half of these steps are
      // skipped to this if everything has already been completed before
      // (such as inviting, joining, and syncing unless the player updated a
      // certain detail that we keep synced)
    } catch (err) {
      let errMessage = 'An error occurred while sending a message to a bridged room.\n'
      if (err instanceof Error) {
        errMessage += ` - message: ${err.message}\n`;
        errMessage += ` - stack:\n${err.stack}`;
      } else {
        errMessage += ' - error: ' + err;
      }
      LogService.error('marco-matrix', errMessage);
    } finally {
      // what matters most is that the message gets to the room.
      await intent.sendText(
        bridge.room,
        mcMessage.message
      );
    }
  }

  /**
   * This returns all the new room messages of a given bridge since the
   * last time requested.
   * @param {Bridge} bridge
   * @returns {string[]}
   */
  public getNewMxMessages(bridge: Bridge): string[] {
    let newMxMessages = this.newMxMessages.get(bridge.room);

    if (!newMxMessages) {
      newMxMessages = [];
      this.newMxMessages.set(bridge.room, newMxMessages);
    }

    return newMxMessages.splice(0, newMxMessages.length);
  }

  /**
   * This stores all the new Matrix room messages
   * @param {MxMessage} message
   */
  public addNewMxMessage(message: MxMessage) {
    const newMxMessages = this.newMxMessages.get(message.room) || [];

    if (!this.appservice.isNamespacedUser(message.sender))
      newMxMessages.push(message.body);

    this.newMxMessages.set(message.room, newMxMessages);
  }

  /**
   * This gets the m.room.member state event of a provided Matrix ID and room
   * @param {string} room The room to retrieve the profile data from
   * @param {string} user The user being retrieved
   * @returns {Promise<any>}
   */
  public async getRoomMember(room: string, user: string): Promise<any> {
    return this.appservice.botClient.getRoomStateEvent(
      room,
      'm.room.member',
      user
    );
  }

  /**
   * This intakes m.room.message events. It first sees if it's a !minecraft
   * command if it is then it gives it to CmdManager.onMxMessage, otherwise
   * it checks if the message is coming from a bridged room if it is then
   * it process the message and sends it to Main.sendToMinecraft.
   * @param {string} room Room Matrix ID
   * @param {any} event m.room.message event
   */
  private async onMxMessage(room: string, event: any): Promise<void> {
    // Check if the event hasn't already been redacted
    const content: any | undefined = event['content'];
    if (!content || !content['body'])
      return;
    const body = content['body'];
    const msgtype: string = content['msgtype'];
    const isBridged = this.main.bridges.isRoomBridged(room);

    // Handle commands first
    if (msgtype == 'm.text' && body.startsWith(CmdManager.prefix)) {
      await this.cmdManager.onMxMessage(room, event['sender'], content['body']);
      return;
    }

    // If it isn't a command then check if the m.room.message was sent in a
    // bridged room
    if (!isBridged)
      return;

    // Handle m.text message
    if (msgtype == 'm.text') {
      let message = await this.msgProcessor.buildTextMsg(room, event);

      // Give it to Main to handle
      this.main.sendToMinecraft(message);

      // Handle m.emote message
    } else if (msgtype == 'm.emote') {
      let message = await this.msgProcessor.buildEmoteMsg(room, event);

      // Give it to Main to handle
      this.main.sendToMinecraft(message);
    }
  }
}
