import * as matrix from "matrix-bot-sdk";
import { LogService } from "matrix-bot-sdk";
import { RegManager } from "./internal/RegManager";
import { Config } from "../common/Config";
import type { Marco, McMessage, MxMessage } from "../Marco";
import { Bridge } from "../common/Bridge";
import { CmdManager } from "./internal/CmdManager";
import { MsgProcessor } from "./internal/MsgProcessor";


/**
 * The MatrixManager class has everything to do with Matrix's appservice
 * API and a couple utilities such as checking if a room exists. It's
 * responsible for keeping an appservice user in sync with their
 * corresponding Minecraft player by communicating with the PlayerManager.
 * It also stores new room messages in the newMxMessages for the Minecraft
 * server to retrieve periodically.
 */
export class MatrixManager {
  // Interfaces with Matrix
  private readonly appservice: matrix.Appservice;
  private readonly marco: Marco;
  // Collects new messages for Minecraft servers
  private readonly newMxMessages: Map<string, MxMessage[]>
  // Handles commands given by Matrix users
  private readonly cmdManager: CmdManager;
  // Converts matrix messages into McMessages
  private readonly msgProcessor: MsgProcessor;


  constructor(config: Config, marco: Marco) {
    const regManager = new RegManager(config);
    const registration = regManager.getRegistration();

    this.marco = marco;
    this.msgProcessor = new MsgProcessor(this);
    this.appservice = new matrix.Appservice({
      registration,
      bindAddress: config.appservice.bindAddress,
      homeserverName: config.appservice.homeserverName,
      homeserverUrl: config.appservice.homeserverURL,
      port: config.appservice.port
    });
    this.cmdManager = new CmdManager(this.appservice, this.marco);
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
   * This intakes a McMessage and relays it the corresponding room
   * (provided in the McMessage properties). Before it relays it to the
   * corresponding room it must make sure that the player name and skin are
   * synced with the Matrix appservice user to get the full experience of
   * talking to a Minecraft player through Matrix.
   * @param {McMessage} mcMessage
   * @returns {Promise<void>}
   */
  public async sendMessage(mcMessage: McMessage): Promise<void> {
    // The player UUID is the Matrix appservice user's Matrix ID
    const uuid = await mcMessage.player.getUUID();
    // This is the representing Matrix user
    const intent = this.appservice.getIntentForSuffix(uuid);

    try {
      await intent.ensureRegistered();
      // Keep the player name, skin in sync with their profile data on Matrix
      await this.marco.players.sync(intent, mcMessage.player);

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
        mcMessage.room,
        mcMessage.body
      );
    }
  }

  /**
   * This gives the Minecraft server all the new messages since last
   * retrieved. The Minecraft server will periodically make GET requests to
   * see if there are any new messages in the room (which is done here)
   *
   * Visual Representation (TL;DR):
   * Minecraft (GET /chat) -> Marco
   * Minecraft (GET /chat) <- Marco (Response: MxMessage[])
   *
   * @param {Bridge} bridge
   * @returns {MxMessage[]}
   */
  public getNewMxMessages(bridge: Bridge): MxMessage[] {
    let newMxMessages = this.newMxMessages.get(bridge.room);

    if (!newMxMessages) {
      newMxMessages = [];
      this.newMxMessages.set(bridge.room, newMxMessages);
    }

    return newMxMessages.splice(0, newMxMessages.length);
  }

  /**
   * This adds all new messages seen in the corresponding Matrix room. This
   * means that this appservice DOES NOT respect m.room.redaction events,
   * since there is no way of redacting the corresponding message on
   * Minecraft or even guaranteeing that the message gets taken out of the
   * list before the Minecraft server checks in. Sorry won't fix :(
   * @param {Bridge} bridge
   * @param {MxMessage} message
   */
  public addNewMxMessage(bridge: Bridge, message: MxMessage) {
    const newMxMessages = this.newMxMessages.get(bridge.room) || [];

    if (!this.appservice.isNamespacedUser(message.sender))
      newMxMessages.push(message);

    this.newMxMessages.set(bridge.room, newMxMessages);
  }

  /**
   * This gets the m.room.member state event of a provided Matrix ID and room
   * @param {string} room The room to retrieve the profile data from
   * @param {string} mxid The user being retrieved
   */
  public async getRoomMember(room: string, mxid: string) {
    return this.appservice.botClient.getRoomStateEvent(
      room,
      'm.room.member',
      mxid
    );
  }

  /**
   * This intakes m.room.message events, checks if the room that the event
   * appeared in is bridged and then deals with the type of message that it
   * is. Currently the only two message types are supported: m.emote, m.text.
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
    const isBridged = this.marco.bridges.isBridged(room);

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
      let mxMessage = await this.msgProcessor.buildTextMsg(room, event);

      // Give it to Marco to handle
      this.marco.onMxChat(mxMessage);

      // Handle m.emote message
    } else if (msgtype == 'm.emote') {
      let mxMessage = await this.msgProcessor.buildEmoteMsg(room, event);

      // Give it to Marco to handle
      this.marco.onMxChat(mxMessage);
    }
  }
}
