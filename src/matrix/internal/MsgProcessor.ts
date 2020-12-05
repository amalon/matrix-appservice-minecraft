import { MatrixProfile } from "matrix-bot-sdk";
import { parse, HTMLElement, NodeType } from 'node-html-parser';
import { HTMLLayout } from "./HTMLLayout";
import { MatrixInterface, MxMessage } from "../MatrixInterface";
import { MxEvents } from "../../minecraft";
import { Player } from "../../minecraft/internal/Player";
import { Config } from "../../Config";

export class MsgProcessor {
  constructor(private readonly matrix: MatrixInterface, private readonly config: Config) {}

  /**
   * Parse an HTML colour code into a 24bit colour value.
   * @param {string} text HTML colour in the form "#rrggbb" or "#rgb"
   * @returns {number|null} parsed 24-bit colour value (0xRRGGBB)
   */
  public htmlColorTo24bit(text: string): number | null {
    // Validate
    const match = text.match(/^#([0-9a-fA-F]+)$/);
    if (!match)
      return null;

    // Should be 3 or 6 nibbles
    let hex = match[1];
    if (hex.length == 3) {
      // Expand to 6 nibbles
      hex = hex.charAt(0) + hex.charAt(0)
          + hex.charAt(1) + hex.charAt(1)
          + hex.charAt(2) + hex.charAt(2);
    } else if (hex.length != 6) {
      return null;
    }

    // Parse
    const parsed = parseInt(hex, 16);
    if (isNaN(parsed))
      return null;

    return parsed;
  }

  public simplifyBodyJson(jsonPrep: MxEvents.BodyStructPrep) {
    let json = jsonPrep as MxEvents.BodyStruct;
    for (let i = 1; i < jsonPrep.content.length; ++i) {
      let lastItem = jsonPrep.content[i-1];
      let item = jsonPrep.content[i];
      // Merge consecutive strings
      if (typeof item === "string" && typeof lastItem === "string") {
        jsonPrep.content[i-1] = lastItem.concat(item);
        jsonPrep.content.splice(i, 1);
        --i;
        continue;
      }
    }
    if (jsonPrep.content.length == 1)
      json.content = jsonPrep.content[0];
  }

  /**
   * This takes a message string and appends it to the bodyJson content taking
   * care to extract room mentions.
   * @param {string} str Raw message string
   * @param {MxEvents.BodyStructPrep} bodyJson JSON object to add to
   * @param {boolean} force Whether to force output even for a single string
   */
  private extractRoomMentions(str: string, bodyJson: MxEvents.BodyStructPrep, force: boolean) {
    // Transform @room into a room mention
    const atRoomRegex = /@room\b/g;
    const items = str.split(atRoomRegex);
    if (!force && items.length <= 1)
      return;

    let mention: MxEvents.BodyMention = {
      type: "mention",
      room: true,
      content: "@room",
    };

    if (items[0])
      bodyJson.content.push(items[0]);
    for (let i: number = 1; i < items.length; ++i) {
      bodyJson.content.push(mention);
      if (items[i])
        bodyJson.content.push(items[i]);
    }
  }

  private handleFontSpan(element: HTMLElement): MxEvents.BodyStyle | undefined {
    let style: MxEvents.BodyStyle = {
      type: "style",
      content: [],
    };
    for (let attr of [ 'data-mx-color', 'color' ]) {
      if (element.attributes[attr]) {
        let parsed = this.htmlColorTo24bit(element.attributes[attr]);
        if (parsed !== null) {
          style.color = parsed;
          return style;
        }
      }
    }
    if (element.attributes['data-mx-spoiler'] !== undefined) {
      style.spoiler = true;
      return style;
    }
  }

  private async handleLink(event: any, element: HTMLElement): Promise<MxEvents.BodyStruct | undefined> {
    // name, target, href (https, http, ftp, mailto, magnet)
    const href = element.attributes.href;
    if (href) {
      let match = href.match(/^https:\/\/matrix\.to\/#\/(@[^:]+:.*)$/);
      if (match) {
        const roomId: string = event['room_id'];
        let mxid: string = match[1];
        let profile: MatrixProfile = await this.matrix.getUserProfile(mxid, roomId);
        let mention: MxEvents.BodyMention = {
          type: "mention",
          user: {
            mxid: mxid,
            displayName: profile.displayName,
          },
          content: [],
        };

        // Is it a Minecraft player!
        let uuid = this.matrix.getPlayerUUID(mxid);
        if (uuid) {
          let mcMention: MxEvents.BodyMentionMinecraft = mention as MxEvents.BodyMentionMinecraft;
          mcMention.bridge = "minecraft";
          mcMention.player = {
            uuid: uuid,
          };
        }
        return mention;
      }
      match = href.match(/^([^:]+):/);
      if (match) {
        const protocols: {[x:string]:true} = {
          https: true,
          http: true,
          ftp: true,
          mailto: true,
          magnet: true,
        };
        if (protocols[match[1]]) {
          let link: MxEvents.BodyLink = {
            type: "link",
            href: href,
            content: [],
          };
          return link;
        }
      }
    }
  }

  private handleImage(element: HTMLElement): MxEvents.BodyImg | undefined {
    // width, height, alt, title, src
    let img: MxEvents.BodyImg = {
      type: "img",
    };
    const title = element.attributes.title;
    const alt = element.attributes.alt;
    const src = element.attributes.src;
    if (title)
      img.title = title;
    if (alt)
      img.alt = alt;
    // Validate src
    if (src) {
      let match = src.match(/^mxc:\/\/([^\/#?]+)\/([^\/#?]+)$/);
      if (match)
        img.src = `${this.config.appservice.homeserverURL}/_matrix/media/r0/download/${match[1]}/${match[2]}`;
    }
    return img;
  }

  // Walk the children on the node
  private async walkMxHtml(event: any, element: HTMLElement,
                           allowRoomMention: Promise<boolean>,
                           maxDepth: number,
                           bullets: { n : number } | null = null): Promise<MxEvents.BodyStructPrep> {
    let ret: MxEvents.BodyStructPrep = {type:"", content:[]};

    if (maxDepth <= 0)
      return ret;

    let json: MxEvents.BodyStruct | undefined;
    const tag: string = element.tagName;
    let style: MxEvents.BodyStyle = {
      type: "style",
      content: [],
    };
    switch (tag) {
      // Style elements

      case 'FONT':
      case 'SPAN':
        json = this.handleFontSpan(element);
        break;

      case 'B':
      case 'STRONG':
        style.bold = true;
        json = style;
        break;

      case 'I':
      case 'EM':
        style.italic = true;
        json = style;
        break;

      case 'U':
        style.underline = true;
        json = style;
        break;

      case 'DEL':
      case 'STRIKE':
        style.strike = true;
        json = style;
        break;

      case 'CODE':
        // class (language-*)
        style.code = true;
        json = style;
        break;

      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
        style.heading = parseInt(tag.substr(1)),
        json = style;
        break;

      // List elements

      case 'UL':
        bullets = null;
        break;

      case 'OL':
        bullets = { n: 1 };
        if (element.attributes.start) {
          const start = parseInt(element.attributes.start);
          if (!isNaN(start))
            bullets.n = start;
        }
        break;

      case 'LI': {
        let bullet: MxEvents.BodyBlockBullet = {
          type: "block",
          block: "bullet",
          content: [],
        };
        if (bullets !== null)
          bullet.n = bullets.n++;
        json = bullet;
        break;
      }

      // Other blockish tags

      case 'HR': {
        let hr: MxEvents.BodyHorizontalRule = {
          type: "horizontalRule",
        };
        json = hr;
        break;
      }

      case 'BLOCKQUOTE': {
        let quote: MxEvents.BodyBlockQuote = {
          type: "block",
          block: "quote",
          content: [],
        };
        json = quote;
        break;
      }

      case 'PRE': {
        let preformat: MxEvents.BodyBlockPreformat = {
          type: "block",
          block: "preformat",
          content: [],
        };
        json = preformat;
        break;
      }

      // Hyperlink elements

      case 'A':
        json = await this.handleLink(event, element);
        break;

      // Embedded content elements

      case 'IMG':
        json = this.handleImage(element);
        break;

      // Elements already handled by HTMLLayout

      case 'BR':
      case 'DIV':
      case 'P':
        break;

      // Unsupported elements

      case 'CAPTION':
      case 'SUB':
      case 'SUP':
      case 'TABLE':
      case 'TBODY':
      case 'TD':
      case 'TH':
      case 'THEAD':
      case 'TR':
      default:
        break;
    };
    if (json)
      ret = json as MxEvents.BodyStructPrep;

    for (const child of element.childNodes) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        if (await allowRoomMention)
          this.extractRoomMentions(child.text, ret, true);
        else
          ret.content.push(child.text);
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        let res: MxEvents.BodyStructPrep;
        res = await this.walkMxHtml(event, child as HTMLElement, allowRoomMention,
                                    maxDepth - 1, bullets);
        if (res.type) {
          ret.content.push(res);
        } else if (res.content) {
          ret.content = ret.content.concat(res.content);
        }
      }
    }

    if (ret.content !== undefined)
      this.simplifyBodyJson(ret);
    return ret;
  }

  /**
   * This intakes the content of a Matrix chat message and formats it as a
   * Minecraft message, using formatting codes.
   * Implemented with help from https://minecraft.gamepedia.com/Formatting_codes
   * @param {any} event Matrix m.room.message event
   * @returns {string} Message body
   */
  public async formatMxMessage(event: any): Promise<[string, MxEvents.BodyJson?]> {
    const content = event['content'];
    const sender: string = event['sender'];
    const roomId: string = event['room_id'];
    const format: string = content['format'];
    const formattedBody: string = content['formatted_body'];

    // Unformatted body, stripping out any Minecraft formatting code characters
    let body: string = content['body'].replace(/\u00a7/g, '');
    let bodyJson: MxEvents.BodyStructPrep = {type:"", content:[]};

    // Check for a room mention in body
    let allowRoomMention: Promise<boolean>;
    if (body.match(/@room\b/)) {
      // We should only allow if the user has sufficient power in this room
      allowRoomMention = this.matrix.checkRoomNotifyPrivilege(roomId, sender);
    } else {
      // Disallow
      allowRoomMention = new Promise((resolve, reject) => { resolve(false); });
    }

    if (format == 'org.matrix.custom.html') {
      // Parse the HTML to get a DOM
      let root = parse(formattedBody, {
        comment: false,
        blockTextElements: {
          script: true,
          noscript: true,
          style: true
        }
      });
      // Process paragraphs & whitespace in the DOM in place
      let layout = new HTMLLayout();
      layout.layoutHTML(root);
      // Walk the DOM to create the intermediate JSON
      bodyJson = await this.walkMxHtml(event, root, allowRoomMention, 100);
    } else if (await allowRoomMention) {
      this.extractRoomMentions(body, bodyJson, false);
      this.simplifyBodyJson(bodyJson);
    }

    if (bodyJson.content.length !== 0) {
      // Use formatted body
      return [body, bodyJson.content as MxEvents.BodyJson];
    } else {
      return [body];
    }
  }

  /**
   * This intakes an m.emote message type and builds to be ready to be sent
   * to a Minecraft chat. ie. "waves" -> " * <Dylan> waves"
   *
   * @param {string} room Corresponding room
   * @param {any} event m.room.message with typeof "m.emote"
   * @returns {Promise<string>}
   */
  public async buildEmoteMsg(room: string, event: any): Promise<MxMessage> {
    const sender = event['sender'];
    const bodies = this.formatMxMessage(event);
    const senderProfile = await this.matrix.getUserProfile(sender, room);
    const name: string = senderProfile.displayName;
    const [body, bodyJson] = await bodies;

    return {
      sender: sender,
      room,
      body: ` * <${name}> ${body}`,
      event: <MxEvents.EmoteMessageEvent> {
        sender: {
          mxid: sender,
          displayName: name
        },
        type: "message.emote",
        body: body,
        bodyJson: bodyJson,
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
    const sender = event['sender'];
    const bodies = this.formatMxMessage(event);
    const senderProfile = await this.matrix.getUserProfile(sender, room);
    const name: string = senderProfile.displayName;
    const [body, bodyJson] = await bodies;

    return {
      sender: sender,
      room,
      body: `<${name}> ${body}`,
      event: <MxEvents.TextMessageEvent> {
        sender: {
          mxid: sender,
          displayName: name
        },
        type: "message.text",
        body: body,
        bodyJson: bodyJson,
      } as MxEvents.Event
    };
  }

  public async buildKickMsg(room: string, event: any): Promise<MxMessage> {
    const content = event['content'];
    const reason = content['reason'];
    const prevContent = event['prev_content'] || {};
    const sender = event['sender'];
    const victim = event['state_key'];

    const senderProfile = await this.matrix.getUserProfile(sender, room);
    const victimUUID: string | undefined = this.matrix.getPlayerUUID(victim);
    const senderName: string = senderProfile.displayName;
    const victimName: string = prevContent['displayname'] || victimUUID;

    return {
      sender: sender,
      room,
      event: <MxEvents.KickPlayerEvent> {
        sender: {
          mxid: sender,
          displayName: senderName
        },
        type: "player.kick",
        player: new Player(victimName, victimUUID),
        reason: reason
      } as MxEvents.Event
    };
  }

  public async buildBanMsg(room: string, event: any): Promise<MxMessage> {
    const content = event['content'];
    const reason = content['reason'];
    const prevContent = event['prev_content'] || {};
    const sender = event['sender'];
    const victim = event['state_key'];

    const senderProfile = await this.matrix.getUserProfile(sender, room);
    const victimUUID: string | undefined = this.matrix.getPlayerUUID(victim);
    const senderName: string = senderProfile.displayName;
    const victimName: string = prevContent['displayname'] || victimUUID;

    return {
      sender: sender,
      room,
      event: <MxEvents.BanPlayerEvent> {
        sender: {
          mxid: sender,
          displayName: senderName
        },
        type: "player.ban",
        player: new Player(victimName, victimUUID),
        reason: reason
      } as MxEvents.Event
    };
  }

  public async buildUnbanMsg(room: string, event: any): Promise<MxMessage> {
    const prevContent = event['prev_content'];
    const sender = event['sender'];
    const victim = event['state_key'];

    const senderProfile = await this.matrix.getUserProfile(sender, room);
    const victimUUID: string | undefined = this.matrix.getPlayerUUID(victim);
    const senderName: string = senderProfile.displayName;
    const victimName: string = prevContent['displayname'] || victimUUID;

    return {
      sender: sender,
      room,
      event: <MxEvents.UnbanPlayerEvent> {
        sender: {
          mxid: sender,
          displayName: senderName
        },
        type: "player.unban",
        player: new Player(victimName, victimUUID)
      } as MxEvents.Event
    };
  }
}
