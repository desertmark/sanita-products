import { inject, injectable } from "inversify";
import { writeFileSync, readFileSync, unlink, unlinkSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { execSync } from "child_process";
import axios from "axios";
import FormData from "form-data";
import { IConfig } from "@config/config";
export class IFile {
  data: Buffer;
  name: string;
}
export interface ParseServiceResponseBody<T = any> {
  data: T;
  type: string;
}
@injectable()
export class ParseManager {
  constructor(@inject("config") private config: IConfig) {}
  async mdbToJson<T>(file: IFile, tableName: string): Promise<T> {
    const path = uuidv4();
    try {
      writeFileSync(path, file.data);
      execSync(`mdb-json ${path} ${tableName} > out.json`);
      // NOTE: out.json content are bunch of independent object each row in one line but they are not inside an array.
      const text = readFileSync("out.json").toString();
      /**
       * Before we parse we need to edit content to be a valid array JSON we can parse.
       * Add a , at the end of every line by replacing `}` with `},`. Pop the last `,` and `\n` using `slice(0,-2)` all of this inside `[...]`
       */
      const jsonString = `[${text.replace(/}/g, "},").slice(0, -2)}]`;
      const json = JSON.parse(jsonString);
      return json as T;
    } catch (error) {
      console.error("Failed to parse mdb to json", { error, file, tableName });
      throw error;
    } finally {
      unlinkSync(path);
    }
  }

  async xlsToJson<T>(file: IFile, headerIndex: number): Promise<T> {
    try {
      const form = new FormData();
      form.append("file", file.data, file.name);
      form.append("headerIndex", headerIndex);
      const res = await axios.post<ParseServiceResponseBody<T>>(this.config.parseServiceUrl, form, {
        headers: {
          ...form.getHeaders(),
        },
      });
      return res.data.data;
    } catch (error) {
      console.error("Failed to parse xls to json", { error, file, headerIndex });
    }
  }
}
