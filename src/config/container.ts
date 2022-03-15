import { Container, injectable } from "inversify";
import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import { IConfig, config } from "./config";
import { kcClientFactory, openIdClientFactory, publicKeyFactory } from "./keycloak";
import { BaseClient } from "openid-client";
import { HealthController } from "@controllers/health.controller";
import { AuthController } from "@controllers/auth.controller";
import { AuthRepository } from "@repositories/auth.repository";
import { SqlBaseRepository } from "@repositories/sql-base.repository";

export async function createContainer(): Promise<Container> {
  const container = new Container();

  // Config
  container.bind<IConfig>("config").toConstantValue(config);

  container.bind<KeycloakAdminClient>(KeycloakAdminClient).toConstantValue(await kcClientFactory(config));
  container.bind<BaseClient>("openid").toConstantValue(await openIdClientFactory(config));
  container.bind<string>("kcPublicKey").toConstantValue(await publicKeyFactory(config));

  // Repositories
  container.bind<SqlBaseRepository>(SqlBaseRepository).toSelf();
  await container.get<SqlBaseRepository>(SqlBaseRepository).init();

  container.bind<AuthRepository>(AuthRepository).toSelf();

  // Controllers
  container.bind<HealthController>(HealthController).toSelf();
  container.bind<AuthController>(AuthController).toSelf();
  return container;
}
export default createContainer;
