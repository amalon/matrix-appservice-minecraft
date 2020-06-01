import fs from "fs";
import mkdirp from 'mkdirp';
import yaml from "yaml";
import { v4 as uuid } from "uuid";
import { LogService } from "matrix-bot-sdk";


export type AppserviceConfig = {
  homeserverURL: string;
  homeserverName: string;
  bindAddress: string;
  port: number;
  regPath: string;
}

export type WebserverConfig = {
  port: number;
  privKey: string;
}

export type DatabaseConfig = {
  location: string;
}

export class Config {
  public static readonly configRoot = process.cwd() + '/config';
  public static readonly defaultPath = Config.configRoot + '/config.yaml'

  public readonly appservice: AppserviceConfig;
  public readonly webserver: WebserverConfig;
  public readonly database: DatabaseConfig;

  public constructor() {
    this.appservice = {
      port: 3051,
      bindAddress: '0.0.0.0',
      homeserverName: 'matrix.org',
      homeserverURL: 'https://matrix.org',
      regPath: Config.configRoot + '/appservice.yaml'
    };
    this.webserver = {
      port: 3052,
      privKey: uuid(),
    };
    this.database = {
      location: Config.configRoot + '/marco.db',
    };
  }

  /**
   * This gets a config if it exists, otherwise it generates a new one with
   * all the defaults (see genConfig method)
   * @returns {Config}
   */
  public static getConfig(location?: string): Config {
    const configPath = location || Config.defaultPath;

    if (!fs.existsSync(Config.configRoot))
      mkdirp.sync(Config.configRoot);

    if (fs.existsSync(configPath)) {
      const configBuff = fs.readFileSync(configPath);

      LogService.debug('marco:Config', 'Restored configuration.');
      return yaml.parse(configBuff.toString());
    } else {
      LogService.debug('marco:Config', 'Generating default configuration.');
      return Config.genConfig(location);
    }
  }

  /**
   * This generates a default config (see constructor for default properties)
   * @returns {Config}
   */
  public static genConfig(location?: string): Config {
    const conf = new Config();

    fs.writeFileSync(location || Config.defaultPath, yaml.stringify(conf));

    return conf;
  }
}
