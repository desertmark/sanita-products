import "reflect-metadata";
import { Server } from "http";
import { SqlBaseRepository } from "../../repositories/sql-base.repository";
import { Sanita, serverBuilder } from "../../config/server";
import { CommonUtils, SqlHelper } from "../../utils/common.utils";
import { Database } from "../../models/database.model";
import { deleteProducts, postFile, productFactory } from "../../utils/test.utils";
import axios, { AxiosInstance } from "axios";
import { config } from "../../config/config";
import { merge } from "lodash";

describe("Products XLS E2E", () => {
  jest.setTimeout(300000);
  let baseRepository: SqlBaseRepository;
  let client: AxiosInstance;
  let sanita: Sanita;

  beforeAll(async () => {
    sanita = await serverBuilder(merge(config, { db: { name: "products_xls" } }));
    baseRepository = sanita.container.get(SqlBaseRepository);
    client = axios.create({
      baseURL: "http://localhost:3001",
    });
    await deleteProducts(baseRepository);
  });

  afterAll(async () => await sanita.stop());

  describe("Test XLS upload", () => {
    it("Should update DB with xls information", async () => {
      // File Values
      const fileData = {
        listPrice: 10,
        bonus: 0.4,
        bonus2: 0,
      };

      // Arrange
      const products = [productFactory("00.00.00.01"), productFactory("00.00.00.02")];
      await baseRepository.executeQuery(SqlHelper.insertTemplate(Database.Tables.Products, products[0]));
      await baseRepository.executeQuery(SqlHelper.insertTemplate(Database.Tables.Products, products[1]));
      const keysToAssert = ["bonus", "bonus2", "listPrice"];
      // Act
      const response = await postFile(client, "/products/xls", "bulk-update.xls");

      // Assert
      const res = await baseRepository.list(Database.Tables.Products);
      products.forEach((product, i) => {
        keysToAssert.forEach((k) => {
          const dbProduct = CommonUtils.toCamelCaseRecord(res[i]);
          expect(dbProduct).toHaveProperty(k, fileData[k]);
        });
      });
      expect(response.status).toBe(204);
    });
  });
});
