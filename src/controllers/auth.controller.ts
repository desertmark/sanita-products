import { ILoginRequest } from "@models/auth.model";
import { inject } from "inversify";
import { controller, httpPost, requestBody } from "inversify-express-utils";
import { AuthRepository } from "@repositories/auth.repository";

@controller("/auth")
export class AuthController {
  constructor(@inject(AuthRepository) private authRepository: AuthRepository) {}

  @httpPost("/login")
  async login(
    @requestBody() { username, password }: ILoginRequest
  ): Promise<{accessToken: string, userInfo: any}> {
    try {
      const tokenSet = await this.authRepository.login(username, password);
      const userInfo = await this.authRepository.userInfo(tokenSet);
      return {
        accessToken: tokenSet.access_token,
        userInfo,
      }
    } catch (error) {
      console.error("Failed to login", error);
    }
  }
}
