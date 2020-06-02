import { MatrixInterface, MxMessage } from "../MatrixInterface";

export class MsgProcessor {
  constructor(private readonly matrix: MatrixInterface) {}

  /**
   * This intakes an m.emote message type and builds to be ready to be sent
   * to a Minecraft chat. ie. "waves" -> " * <Dylan> waves"
   *
   * @param {string} room Corresponding room
   * @param {any} event m.room.message with typeof "m.emote"
   * @returns {Promise<string>}
   */
  public async buildEmoteMsg(room: string, event: any): Promise<MxMessage> {
    const content = event['content'];
    const sender = event['sender'];
    const body = content['body'];
    const roomMember = await this.matrix.getRoomMember(room, sender);
    const name: string = roomMember['displayname'] || sender;

    return {
      sender,
      room,
      body: ` * <${name}> ${body}`,
    };
  }

  /**
   * This intakes an m.text message type and builds to be ready to be sent
   * to a Minecraft chat. ie. "Hello world" -> "<Dylan> Hello world"
   *
   * @param room
   * @param event
   * @returns {Promise<string>}
   */
  public async buildTextMsg(room: string, event: any): Promise<MxMessage> {
    const content = event['content'];
    const sender = event['sender'];
    const body = content['body'];
    const roomMember = await this.matrix.getRoomMember(room, sender);
    const name: string = roomMember['displayname'] || sender;

    return {
      sender,
      room,
      body: `<${name}> ${body}`,
    };
  }
}
