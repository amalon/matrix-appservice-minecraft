import { MatrixInterface, MxMessage } from "../MatrixInterface";
import { MxEvents } from "../../minecraft";
import { Player } from "../../minecraft/internal/Player";

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
      sender: sender,
      room,
      body: ` * <${name}> ${body}`,
      event: <MxEvents.EmoteMessageEvent> {
        sender: {
          mxid: sender,
          displayName: name
        },
        type: "dev.dhdf.mx.message.emote",
        body: body,
      } as MxEvents.Event
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
      sender: sender,
      room,
      body: `<${name}> ${body}`,
      event: <MxEvents.TextMessageEvent> {
        sender: {
          mxid: sender,
          displayName: name
        },
        type: "dev.dhdf.mx.message.text",
        body: body,
      } as MxEvents.Event
    };
  }

  public async buildKickMsg(room: string, event: any): Promise<MxMessage> {
    const content = event['content'];
    const reason = content['reason'];
    const prevContent = event['prev_content'];
    const sender = event['sender'];
    const victim = event['state_key'];

    const senderRoomMember = await this.matrix.getRoomMember(room, sender);
    const victimUUID: string | undefined = this.matrix.getPlayerUUID(victim);
    const senderName: string = senderRoomMember['displayname'] || sender;
    const victimName: string = prevContent['displayname'] || victimUUID;

    return {
      sender: sender,
      room,
      event: <MxEvents.KickPlayerEvent> {
        sender: {
          mxid: sender,
          displayName: senderName
        },
        type: "dev.dhdf.mx.player.kick",
        player: new Player(victimName, victimUUID),
        reason: reason
      } as MxEvents.Event
    };
  }

  public async buildBanMsg(room: string, event: any): Promise<MxMessage> {
    const content = event['content'];
    const reason = content['reason'];
    const prevContent = event['prev_content'];
    const sender = event['sender'];
    const victim = event['state_key'];

    const senderRoomMember = await this.matrix.getRoomMember(room, sender);
    const victimUUID: string | undefined = this.matrix.getPlayerUUID(victim);
    const senderName: string = senderRoomMember['displayname'] || sender;
    const victimName: string = prevContent['displayname'] || victimUUID;

    return {
      sender: sender,
      room,
      event: <MxEvents.BanPlayerEvent> {
        sender: {
          mxid: sender,
          displayName: senderName
        },
        type: "dev.dhdf.mx.player.ban",
        player: new Player(victimName, victimUUID),
        reason: reason
      } as MxEvents.Event
    };
  }

  public async buildUnbanMsg(room: string, event: any): Promise<MxMessage> {
    const prevContent = event['prev_content'];
    const sender = event['sender'];
    const victim = event['state_key'];

    const senderRoomMember = await this.matrix.getRoomMember(room, sender);
    const victimUUID: string | undefined = this.matrix.getPlayerUUID(victim);
    const senderName: string = senderRoomMember['displayname'] || sender;
    const victimName: string = prevContent['displayname'] || victimUUID;

    return {
      sender: sender,
      room,
      event: <MxEvents.UnbanPlayerEvent> {
        sender: {
          mxid: sender,
          displayName: senderName
        },
        type: "dev.dhdf.mx.player.unban",
        player: new Player(victimName, victimUUID)
      } as MxEvents.Event
    };
  }
}
