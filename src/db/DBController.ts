import connection, { Database } from 'better-sqlite3';
import { BridgeTable } from "./BridgeTable";
import { Config } from "../common/Config";


export class DBController {
  private readonly dbPath: string;
  public readonly bridges: BridgeTable;
  private readonly db: Database

  constructor(config: Config) {
    this.dbPath = config.database.location;
    this.db = connection(this.dbPath);
    this.bridges = new BridgeTable(this.db);
  }
}
