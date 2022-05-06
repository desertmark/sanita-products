import { Database, SqlTableDefinition } from "@models/database.model";
import { camelCase, update } from "lodash";
import { queryParam as inversifyQueryParamDecorator } from 'inversify-express-utils';

export class CommonUtils {
  static capitalize(str: string) {
    if (!str) {
      return undefined;
    }
    return str
      .toString()
      .toLowerCase()
      .replace(/\b[a-z]/g, (char) => char.toUpperCase());
  }

  static cleanSpaces(str: string) {
    if (!str) {
      return undefined;
    }
    return str.toString().trim().replace(/\s+/g, " ");
  }

  static parseFloatCustom(n: string) {
    return parseFloat(n.replace(",", "."));
  }

  static toCamelCaseRecord<T>(record: Record<string, any>): T {
    const camelRecord = {};
    Object.entries(record).forEach(([key, val]) => (camelRecord[camelCase(key)] = val));
    return camelRecord as T;
  }

  static getChunks<T>(array: T[], size = 10): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i = i + size) {
      let temp = [];
      for (let j = i; j < i + size && j < array.length; j++) {
        temp.push(array[j]);
      }
      chunks.push(temp);
    }
    return chunks;
  }
}

export class SqlHelper {
  static insertTemplate(table: string, record: Record<string, string | number>) {
    const fields = Object.keys(record).join();
    const values = Object.values(record).map(SqlHelper.toInsertValue).join();
    return `INSERT INTO ${table} (${fields}) VALUES (${values});`;
  }

  static updateTemplate<T extends Record<string, string | number>>(table: string, record: T, updateBy: keyof T) {
    const fields = Object.keys(record);
    return `
    UPDATE ${table}
    SET ${fields.map((field) => `${field} = ${SqlHelper.toInsertValue(record[field])}`)}
    WHERE ${updateBy} = ${SqlHelper.toInsertValue(record[updateBy])}
    `;
  }
  /**
   * Creates a MERGE Sql query to perform an UPSERT.
   * e.g:
   * ```sql
   * MERGE PRODUCTS AS [TARGET]
   * USING (SELECT CODE = 01010101, *) AS [SOURCE]
   *     ON [TARGET].CODE = [SOURCE].CODE
   * WHEN MATCHED THEN
   *     UPDATE SET [TARGET].DESCRIPTION = 'UPSERT'
   * WHEN NOT MATCHED THEN
   * INSERT (CODE, DESCRIPTION) VALUES ([SOURCE].CODE, [SOURCE].DESCRIPTION);
   * ```
   * @param table table to perform upsert
   * @param record record to insert update. e.g: `{ code: 01010101, description: 'Upsert' }`. Will use, code an description as columns, and values as insert/update values.
   * @param updateBy column name to perform the filter condition. e.g. `code`
   * @returns SQL Query as string.
   */
  static upsertTemplate<T extends Record<string, string | number>>(
    table: string,
    record: T,
    updateBy: keyof T
  ): string {
    const selectFields = Object.entries(record)
      .map(([field, value]) => `${field}=${SqlHelper.toInsertValue(value)}`)
      .join();
    const updateFields = Object.keys(record)
      .map((field) => `[Target].${field}=[Source].${field}`)
      .join();
    const insertFields = Object.keys(record).join();
    const insertValues = Object.values(record).map(SqlHelper.toInsertValue).join();
    return `
    MERGE ${table} as [Target]
    using (select ${selectFields}) as [Source]
        on [Target].${updateBy} = [Source].${updateBy}
    when matched THEN
        UPDATE SET ${updateFields}
    when not matched then
    INSERT (${insertFields}) VALUES (${insertValues});`;
  }

  static escapeQuotes(val) {
    return val.replace(/'/gm, "''");
  }

  static toInsertValue(value: string | number) {
    switch (typeof value) {
      case "string":
        return `'${SqlHelper.escapeQuotes(value)}'`;
      default:
        return value;
    }
  }

  /**
   * It will use the Database table definition column names and parsers to parse the recovered record from the database into an typescript entity
   * with camelCase keys.
   * @param dbRecord raw object recovered from sql query
   * @param tableName table name of the recovered object is coming from.
   */
  static toAppEntity<T extends Record<string, any>>(dbRecord: Record<string, string | number>, tableName: string): T {
    const entity = {};
    const table = Database.Schema.Tables.find((t) => t.name === tableName);
    table.cols.forEach((col) => {
      entity[col.name] = col?.parser ? col.parser(dbRecord[col.name]) : dbRecord[col.name];
    });
    return CommonUtils.toCamelCaseRecord(entity);
  }
}
