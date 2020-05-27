import fs from "fs";
import * as yaml from "yaml";
import { v4 as uuid } from "uuid";


export type AppserviceConfig = {
  homeserverURL: string;
  homeserverName: string;
  bindAddress: string;
  port: number;
}

export type WebserverConfig = {
  port: number;
  privKey: string;
}

export class Config {
  public static readonly configPath = './config.yaml';

  public readonly appservice: AppserviceConfig;
  public readonly webserver: WebserverConfig;

  public constructor() {
    this.appservice = {
      port: 3051,
      bindAddress: '0.0.0.0',
      homeserverName: 'matrix.org',
      homeserverURL: 'https://matrix.org'
    };
    this.webserver = {
      port: 3052,
      privKey: uuid()
    }
  }

  /**
   * This gets a config if it exists, otherwise it generates a new one with
   * all the defaults (see genConfig method)
   * @returns {Config}
   */
  public static getConfig(): Config {
    if (fs.existsSync(Config.configPath)) {
      const configBuff = fs.readFileSync(Config.configPath);

      return yaml.parse(configBuff.toString());
    } else {
      return Config.genConfig();
    }
  }

  /**
   * This generates a default config (see constructor for default properties)
   * @returns {Config}
   */
  public static genConfig(): Config {
    const conf = new Config();

    fs.writeFileSync(Config.configPath, yaml.stringify(conf));

    return conf;
  }
}
