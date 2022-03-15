import { ILoginRequest } from "@models/auth.model";
import { inject } from "inversify";
import { controller, httpPost, requestBody } from "inversify-express-utils";
import { TokenSet } from "openid-client";
import { AuthRepository } from "@repositories/auth.repository";

@controller("/auth")
export class AuthController {
  constructor(@inject(AuthRepository) private authRepository) {}

  @httpPost("/login")
  async login(
    @requestBody() { username, password }: ILoginRequest
  ): Promise<TokenSet> {
    try {
      return await this.authRepository.login(username, password);
    } catch (error) {
      console.error("Failed to login", error);
    }
  }
}
