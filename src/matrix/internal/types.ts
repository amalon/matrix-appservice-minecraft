export module MxTypes {
  export type RoomMessage = {
    body: string;
    msgtype: string;
  }

  export interface FormattedBody extends RoomMessage {
    format?: string;
    formatted_body?: string;
  }

  export interface Text extends FormattedBody {
    msgtype: "m.text";
  }

  export interface Emote extends FormattedBody {
    msgtype: "m.emote";
  }

  export interface Notice extends FormattedBody {
    msgtype: "m.notice";
  }
}
