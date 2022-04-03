import { Container, injectable } from "inversify";
import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import { IConfig, config } from "./config";
import { kcClientFactory, openIdClientFactory, publicKeyFactory } from "./keycloak";
import { BaseClient } from "openid-client";
import { HealthController } from "@controllers/health.controller";
import { AuthController } from "@controllers/auth.controller";
import { AuthRepository } from "@repositories/auth.repository";
import { SqlBaseRepository } from "@repositories/sql-base.repository";
import { ProductsController } from "@controllers/products.controller";
import { ProductsRepository } from "@repositories/products.repository";
import { ParseManager } from "@managers/parse.manager";
import { CategoriesRepository } from "@repositories/categories.repository";
import { ProductsManager } from "@managers/products.manager";
import { CategoriesManager } from "@managers/categories.manager";
import { BulkManager } from "@managers/bulk.manager";
import { Logger } from "@utils/logger";

export async function createContainer(): Promise<Container> {
  const container = new Container();
  // Utils
  container.bind<Logger>(Logger).toSelf();
  // Config
  container.bind<IConfig>("config").toConstantValue(config);

  // container.bind<KeycloakAdminClient>(KeycloakAdminClient).toConstantValue(await kcClientFactory(config));
  container.bind<BaseClient>("openid").toConstantValue(await openIdClientFactory(config));
  container.bind<string>("kcPublicKey").toConstantValue(await publicKeyFactory(config));

  // Repositories
  container.bind<SqlBaseRepository>(SqlBaseRepository).toSelf();
  await container.get<SqlBaseRepository>(SqlBaseRepository).init();

  container.bind<AuthRepository>(AuthRepository).toSelf();
  container.bind<ProductsRepository>(ProductsRepository).toSelf();
  container.bind<CategoriesRepository>(CategoriesRepository).toSelf();

  // Managers
  container.bind<ParseManager>(ParseManager).toSelf();
  container.bind<BulkManager>(BulkManager).toSelf();
  container.bind<ProductsManager>(ProductsManager).toSelf();
  container.bind<CategoriesManager>(CategoriesManager).toSelf();

  // Controllers
  container.bind<HealthController>(HealthController).toSelf();
  container.bind<AuthController>(AuthController).toSelf();
  container.bind<ProductsController>(ProductsController).toSelf();
  return container;
}
export default createContainer;
