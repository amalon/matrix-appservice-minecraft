import connection, { Database } from 'better-sqlite3';
import { BridgeTable } from "./BridgeTable";


export class DBController {
  private static readonly dbPath = './marco.db';
  public readonly bridges: BridgeTable;
  private readonly db: Database

  constructor() {
    this.db = connection(DBController.dbPath);
    this.bridges = new BridgeTable(this.db);
  }
}
