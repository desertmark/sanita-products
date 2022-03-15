import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import { inject, injectable } from "inversify";
import { BaseClient, TokenSet } from "openid-client";
import jwt from "jsonwebtoken";
import { UserInfo } from "@models/user-info.model";

@injectable()
export class AuthRepository {
  constructor(
    @inject("openid") private userClient: BaseClient,
    @inject("kcPublicKey") private publicKey: string
  ) {}

  async login(username: string, password: string): Promise<TokenSet> {
    return await this.userClient.grant({
      grant_type: "password",
      username,
      password,
    });
  }

  async authorize(context) {
    // TODO: check roles and groups
    return await this.verifyToken(context.accessToken);
  }

  verifyToken(accessToken: string): UserInfo {
    try {
      const payload = jwt.verify(accessToken, this.publicKey, {
        algorithms: ["RS256"],
      });
      return new UserInfo(payload);
    } catch (error) {
      console.error("Failed to authenticate user", error);
      throw error;
    }
  }
}
