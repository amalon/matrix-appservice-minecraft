import { MxMessage } from "../../Marco";
import { MatrixManager } from "../MatrixManager";

export class MsgProcessor {
  constructor(private readonly matrix: MatrixManager) {}

  /**
   * This intakes an m.emote message type and builds to be ready to be sent
   * to a Minecraft chat.
   *
   * Visual Representation (TL;DR):
   * (Matrix Message "waves") -> buildEmoteMsg
   * buildEmoteMsg -> (Minecraft message " * <Dylan> waves")
   * @param {string} room Corresponding room
   * @param {any} event m.room.message with typeof "m.emote"
   * @returns {Promise<MxMessage>}
   */
  public async buildEmoteMsg(room: string, event: any): Promise<MxMessage> {
    const content = event['content'];
    const sender = event['sender'];
    const body = content['body'];
    const roomMember = await this.matrix.getRoomMember(room, sender);
    const name: string = roomMember['displayname'] || sender;

    return {
      body: ` * <${name}> ${body}`,
      sender,
      room,
    }
  }

  /**
   * This intakes an m.text message type and builds to be ready to be sent
   * to a Minecraft chat.
   *
   * Visual Representation (TL;DR):
   * (Matrix Message "Hello world") -> buildTextMsg
   * buildTextMsg -> (Minecraft Message "<Dylan> Hello world")
   * @param room
   * @param event
   */
  public async buildTextMsg(room: string, event: any): Promise<MxMessage> {
    const content = event['content'];
    const sender = event['sender'];
    const body = content['body'];
    const roomMember = await this.matrix.getRoomMember(room, sender);
    const name: string = roomMember['displayname'] || sender;

    return {
      body: `<${name}> ${body}`,
      sender,
      room
    }
  }
}
