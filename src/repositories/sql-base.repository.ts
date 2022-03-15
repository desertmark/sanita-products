import { IConfig } from "@config/config";
import { Database, SqlColDefinition } from "@models/database.model";
import { inject, injectable } from "inversify";
import { ColumnValue, Connection, ParameterOptions, Request, TediousType, TYPES } from "tedious";

export interface SqlParameter {
  name: string;
  type: TediousType;
  value: any;
  options?: ParameterOptions;
}
@injectable()
export class SqlBaseRepository {
  constructor(@inject("config") private config: IConfig) {}

  private connection: Connection;

  async init(): Promise<void> {
    await this.connect();
    if (this.config.db.generateSchema) {
      await this.createSchema(this.config.db.generateSchemaForce);
    }
  }

  async connect(): Promise<void> {
    console.log("Attempt to connect to SQL Database...");
    return new Promise((res, rej) => {
      const { host, name, password, port, user } = this.config.db;
      this.connection = new Connection({
        server: host,
        authentication: {
          type: "default",
          options: {
            userName: user,
            password,
          },
        },
        options: {
          encrypt: true,
          database: name,
          port,
        },
      });
      this.connection.connect((error: Error) => {
        if (error) {
          console.log("Failed to connect to SQL database.", { error });
          rej(error);
        } else {
          console.log("SQL database connected.");
          res();
        }
      });
    });
  }

  async createSchema(force?: boolean) {
    console.log("Generating SQL Schema...");
    const sqlSchema = Database.Schema.Tables.map((table) => this.createTable(table.name, table.cols, force)).join("\n");
    console.log("About to create SQL schema:");
    console.log(sqlSchema);
    this.executeQuery(sqlSchema);
  }

  createTable(name: string, cols: SqlColDefinition[], force = false): string {
    const dropSql = `
    IF EXISTS (SELECT * FROM sysobjects WHERE name='${name}' and xtype='U')
      DROP TABLE ${name};
    `;
    const pks = cols
      .filter((col) => col.pk)
      .map((col) => col.name)
      .join();
    const fks = cols
      .filter((col) => col.fk)
      .map((col) => `FOREIGN KEY (${col.name}) REFERENCES ${col.fk.foreignTable}(${col.fk.foreignCol})`);
    const sql = `
      ${force ? dropSql : ""}
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${name}' and xtype='U')
        CREATE TABLE ${name} (
          ${cols
            .map(
              (col) => `${col.name} ${col.type} ${col.notNull ? "NOT NULL" : ""} ${col.identity ? "IDENTITY(1,1)" : ""}`
            )
            .join(",\n\t")},
          ${pks?.length ? `CONSTRAINT PK_${name} PRIMARY KEY(${pks})` : ""}
          ${fks.join()}
        );
    `;
    return sql;
  }

  async findById<T>(id: string, tableName: string): Promise<T[]> {
    const sql = `SELECT * FROM [${tableName}] t WHERE t.id = @Id`;
    return await this.executeQuery(sql, [
      {
        name: "@Id",
        value: id,
        type: TYPES.NVarChar,
      },
    ]);
  }

  async list<T>(tableName: string): Promise<T[]> {
    const sql = `SELECT * FROM [${tableName}]`;
    return await this.executeQuery(sql);
  }

  async executeQuery<T>(sql: string, params?: SqlParameter[]): Promise<T[]> {
    await this.connect();
    return new Promise((res, rej) => {
      var req = new Request(sql, (error, rowCount, rows) => {
        if (error) {
          // reject
          console.error("SqlBaseRepository.executeQuery: Failed to execute SQL query", { error, sql });
          rej(error);
        }
        console.log(`SqlBaseRepository.executeQuery: ${rowCount} rows returned`);
      });
      let rows = [];
      req.on("row", (cols) => {
        const row = {};
        cols.forEach((c) => (row[c.metadata.colName] = c.value));
        rows.push(row);
      });
      req.on("requestCompleted", () => res(rows));
      params?.forEach((param) => req.addParameter.apply(req, param));
      this.connection.execSql(req);
      this.closeConnection(req);
    });
  }

  private closeConnection(request: Request) {
    // Close the connection after the final event emitted by the request, after the callback passes
    request.on("requestCompleted", () => {
      this.connection.close();
    });
  }
}
