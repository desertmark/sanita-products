import { IConfig } from "@config/config";
import { Database, SqlColDefinition } from "@models/database.model";
import { Logger } from "@utils/logger";
import { inject, injectable } from "inversify";
import { ColumnValue, Connection, ParameterOptions, Request, TediousType, TYPES } from "tedious";

export interface SqlParameter {
  name: string;
  type: TediousType;
  value: any;
  options?: ParameterOptions;
}

export interface SqlQueryOptions {
  timeout?: number;
}

@injectable()
export class SqlBaseRepository {
  constructor(@inject("config") private config: IConfig, @inject(Logger) private logger: Logger) { }

  async init(): Promise<void> {
    if (this.config.db.generateSchema) {
      await this.createDb()
      await this.createSchema(this.config.db.generateSchemaForce);
    }
  }

  async connect(dbName?: string): Promise<Connection> {
    this.logger.info("Attempt to connect to SQL Database...");
    return new Promise((res, rej) => {
      const { host, name, password, port, user, trustServerCertificate } = this.config.db;
      const connection = new Connection({
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
          database: dbName || name,
          port,
          trustServerCertificate,
        },
      });
      connection.connect((error: Error) => {
        if (error) {
          this.logger.info("Failed to connect to SQL database.", { error });
          rej(error);
        } else {
          this.logger.info("SQL database connected.");
          res(connection);
        }
      });
    });
  }

  async createDb() {
    const connection = await this.connect('master');
    const req = new Request(`CREATE DATABASE ${this.config.db.name}`, (error) => {
      if (error) {
        this.logger.error('Failed to create db', this.config.db);
      }
    });
    await connection.execSql(req);
    this.closeConnection(req, connection);
  }

  async createSchema(force?: boolean) {
    this.logger.info("Generating SQL Schema...");
    const sqlSchema = Database.Schema.Tables.map((table) => this.createTable(table.name, table.cols, force)).join("\n");
    this.logger.debug("About to create SQL schema:");
    this.logger.info(sqlSchema);
    try {
      await this.executeQuery(sqlSchema);
      this.logger.info("Database schema created.");
    } catch (error) {
      this.logger.error("Failed to create database schema.", { error, force });
    }
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
      .map((col) => `FOREIGN KEY (${col.name}) REFERENCES ${col.fk.foreignTable}(${col.fk.foreignCol}),`);
    const sql = `
      ${force ? dropSql : ""}
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${name}' and xtype='U')
        CREATE TABLE ${name} (
          ${cols
        .map(
          (col) => `${col.name} ${col.type} ${col.notNull ? "NOT NULL" : ""} ${col.identity ? "IDENTITY(1,1)" : ""}`
        )
        .join(",\n\t")},
          ${pks?.length ? `CONSTRAINT PK_${name} PRIMARY KEY(${pks}),` : ""}
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

  async list<T>(tableName: string, fields?: string[], orderBy = "Id", size = 100, offset = 0): Promise<T[]> {
    const sql = `
      SELECT ${fields || "*"} FROM [${tableName}]
      ORDER BY ${orderBy}
      OFFSET ${offset} ROWS FETCH NEXT ${size} ROWS ONLY
    `;
    return await this.executeQuery(sql);
  }

  async count(tableName: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) AS count FROM [${tableName}]
    `;
    const res = await this.executeQuery<{count: number}>(sql);
    return res[0].count;
  }

  // async existBy(tableName: string, field)

  async executeQuery<T>(sql: string, params?: SqlParameter[], options?: SqlQueryOptions): Promise<T[]> {
    const connection = await this.connect();
    return new Promise((res, rej) => {
      var req = new Request(sql, (error, rowCount, rows) => {
        if (error) {
          // reject
          this.logger.error("SqlBaseRepository.executeQuery: Failed to execute SQL query", { error, sql });
          rej(error);
        }
        this.logger.info(`SqlBaseRepository.executeQuery: ${rowCount} rows affected`);
      });
      let rows = [];
      req.on("row", (cols) => {
        const row = {};
        cols.forEach((c) => (row[c.metadata.colName] = c.value));
        rows.push(row);
      });
      req.on("requestCompleted", () => res(rows));
      params?.forEach((param) => req.addParameter.apply(req, param));

      if (options?.timeout) {
        req.setTimeout(options.timeout);
      }
      this.logger.debug("Executing sql query....");
      this.logger.debug(sql);
      connection.execSql(req);
      this.closeConnection(req, connection);
    });
  }

  private closeConnection(request: Request, connection: Connection) {
    // Close the connection after the final event emitted by the request, after the callback passes
    request.on("requestCompleted", () => {
      connection.close();
      this.logger.debug("Closed database connection.");
    });
  }
}
