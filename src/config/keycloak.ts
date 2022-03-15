import { IConfig } from "./config";
import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import { Credentials } from "@keycloak/keycloak-admin-client/lib/utils/auth";
import { BaseClient, Issuer } from "openid-client";
import axios from "axios";

export async function kcClientFactory(config: IConfig) {
  try {
    const { base_url, realm_name, token_expiration } = config.auth;
    const kcClient = new KeycloakAdminClient({
      baseUrl: base_url,
      realmName: realm_name,
    });
    return kcClient;
  } catch (error) {
    const msg =
      "Error on kcClientFactory: Failed to create openid-client. Verify auth configurations are set or set correctly.";
    this.logger.error(msg, error);
    throw Error(error);
  }
}

export async function kcAdminClientFactory(config: IConfig) {
  try {
    const { client_id, client_secret, token_expiration } = config.auth;
    const kcAdminClient = await kcClientFactory(config);
    const credentials: Credentials = {
      clientId: client_id,
      clientSecret: client_secret,
      grantType: "client_credentials",
    };

    await kcAdminClient.auth(credentials);
    if (token_expiration > 0) {
      setInterval(
        () => kcAdminClient.auth(credentials),
        token_expiration * 1000
      );
    }
    return kcAdminClient;
  } catch (error) {
    const msg =
      "Error on kcAdminClientFactory: Failed to create openid-client. Verify auth configurations are set or set correctly.";
    console.error(msg, error);
    throw Error(error);
  }
}

export async function openIdClientFactory(
  config: IConfig
): Promise<BaseClient> {
  try {
    const { client_id, client_secret, issuer_uri } = config.auth;
    const issuer = await Issuer.discover(issuer_uri);
    const client = new issuer.Client({
      client_id,
      client_secret,
    });
    return client;
  } catch (error) {
    const msg =
      "Error on openIdClientFactory: Failed to create openid-client. Verify auth configurations are set or set correctly.";
    console.error(msg, error, config);
    throw Error(error);
  }
}

export async function publicKeyFactory(config: IConfig): Promise<string> {
  try {
    const res = await axios.get(config.auth?.issuer_uri as string);
    return formatPublicKey(res.data?.public_key);
  } catch (error) {
    console.error("Error on AuthDal.loadPublicKey", error);
  }
}

/**
 * Given a public key it gives the bgin/end public key format.
 * e.g:
 * ```
 * -----BEGIN PUBLIC KEY-----
 * {public-key}
 * -----END PUBLIC KEY-----
 * ```
 * @param pk
 */
const formatPublicKey = (pk: string): string => `-----BEGIN PUBLIC KEY-----
${pk}
-----END PUBLIC KEY-----`;
