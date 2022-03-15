import path from "path";
import { config as dotenv } from "dotenv";
const rootPath = path.resolve(__dirname, "../", "../");
const envPath = path.resolve(rootPath, ".env");
dotenv({ path: envPath });

const {
  DB_ADDR,
  DB_PORT,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  AUTH_BASE_URL,
  AUTH_CLIENT_ID,
  AUTH_CLIENT_SECRET,
  AUTH_REALM_NAME,
  PORT,
  HOST,
  DB_GENERATE_SCHEMA,
  DB_GENERATE_SCHEMA_FORCE,
} = process.env;

export abstract class IConfig {
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    generateSchema: boolean;
    generateSchemaForce: boolean;
  };
  auth: {
    client_id: string;
    client_secret: string;
    base_url: string;
    realm_name: string;
    token_expiration: number;
    issuer_uri: string;
  };
  server: {
    port?: number;
    host?: string;
  };
}

export const config: IConfig = {
  db: {
    host: DB_ADDR || "localhost",
    port: parseInt(DB_PORT) || 1433,
    user: DB_USER || "sa",
    password: DB_PASSWORD,
    name: DB_DATABASE || "sanita",
    generateSchema: DB_GENERATE_SCHEMA === "true",
    generateSchemaForce: DB_GENERATE_SCHEMA_FORCE === "true",
  },
  auth: {
    client_id: AUTH_CLIENT_ID,
    client_secret: AUTH_CLIENT_SECRET,
    base_url: AUTH_BASE_URL,
    realm_name: AUTH_REALM_NAME,
    token_expiration: 60 * 60,
    issuer_uri: `${AUTH_BASE_URL}/realms/${"master"}`,
  },
  server: {
    port: parseInt(PORT) || 80,
    host: HOST || "localhost",
  },
};
