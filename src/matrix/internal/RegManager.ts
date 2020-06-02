import { Config } from "../../Config";
import type { IAppserviceRegistration } from "matrix-bot-sdk";
import fs from "fs";
import * as yaml from "yaml";
import { v4 as uuid } from "uuid";
import mkdirp from "mkdirp";


/**
 * Appservice register manager. It makes sure it generates and gets the
 * right registration file to interact with a Matrix server.
 */
export class RegManager {
  private static readonly regRoot = Config.configRoot;
  private static readonly defaultPath = RegManager.regRoot + '/appservice.yaml'

  constructor() {}

  public static getRegistration(config: Config): IAppserviceRegistration {
    const location = config.appservice.regPath;

    if (fs.existsSync(config.appservice.regPath)) {
      const regBuff = fs.readFileSync(location);

      return yaml.parse(regBuff.toString());
    } else {
      return RegManager.genRegistration();
    }
  }

  /**
   * Generates a appservice registration and writes to the proper path to
   * refer to it later (see static property regPath)
   * @link https://matrix.org/docs/spec/application_service/r0.1.2#registration
   * @returns {IAppserviceRegistration}
   */
  public static genRegistration(): IAppserviceRegistration {
    const reg: IAppserviceRegistration = {
      as_token: uuid(),
      hs_token: uuid(),
      id: uuid(),
      url: `http://localhost:3051`,
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
    if (!fs.existsSync(RegManager.regRoot))
      mkdirp.sync(RegManager.defaultPath);

    fs.writeFileSync(RegManager.defaultPath, yaml.stringify(reg));

    return reg;
  }
}
