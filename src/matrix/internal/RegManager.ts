import type { Config } from "../../common/Config";
import type { IAppserviceRegistration } from "matrix-bot-sdk";
import fs from "fs";
import * as yaml from "yaml";
import { v4 as uuid } from "uuid";


/**
 * Appservice register manager. It makes sure it generates and gets the
 * right registration file to interact with a Matrix server.
 */
export class RegManager {
  public static readonly regPath = "./appservice.yaml";

  constructor(public readonly config: Config) { }

  public getRegistration(): IAppserviceRegistration {
    if (fs.existsSync(RegManager.regPath)) {
      const regBuff = fs.readFileSync(RegManager.regPath);

      return yaml.parse(regBuff.toString());
    } else {
      return this.genRegistration();
    }
  }

  /**
   * Generates a appservice registration and writes to the proper path to
   * refer to it later (see static property regPath)
   * @link https://matrix.org/docs/spec/application_service/r0.1.2#registration
   * @returns {IAppserviceRegistration}
   */
  public genRegistration(): IAppserviceRegistration {
    const reg: IAppserviceRegistration = {
      as_token: uuid(),
      hs_token: uuid(),
      id: uuid(),
      url: `http://localhost:${this.config.appservice.port}`,
      namespaces: {
        aliases: [],
        rooms: [],
        users: [{
          exclusive: true,
          regex: '@_mc_.*'
        }]
      },
      protocols: ['minecraft'],
      rate_limited: false,
      sender_localpart: "_mc_bot"
    };
    fs.writeFileSync(RegManager.regPath, yaml.stringify(reg));

    return reg;
  }
}
