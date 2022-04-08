require("module-alias/register");
import "reflect-metadata";
import axios, { AxiosInstance } from "axios";
import { Server } from "http";
import { serverBuilder } from "../../config/server";
import { IProduct, ProductResponse } from "../../models/product.models";
import { SqlBaseRepository } from "@repositories/sql-base.repository";
import FormData from "form-data";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ProductsManager } from "@managers/products.manager";
import { ProductsRepository } from "@repositories/products.repository";
import { ProductCalculator } from "@utils/product.utils";

describe("Products E2E test", () => {
  jest.setTimeout(300000);
  let server: Server;
  let client: AxiosInstance;
  let baseRepository: SqlBaseRepository;

  const deleteProducts = async () => {
    await baseRepository.executeQuery<any>(`DELETE FROM DISCOUNTS`);
    await baseRepository.executeQuery<any>(`DELETE FROM PRODUCTS`);
  };

  beforeAll(async () => {
    const serverInfo = await serverBuilder();
    server = serverInfo.server;
    baseRepository = serverInfo.container.get(SqlBaseRepository);
    client = axios.create({
      baseURL: "http://localhost:3001",
    });
  });

  afterAll(async () => {
    server.close();
    await deleteProducts();
  });

  describe("Test List products: GET: /products", () => {
    it("Should return the list of products", async () => {
      // Act
      const res = await client.get<ProductResponse>("/products");
      // Assert
      expect(typeof res.data?.total).toBe("number");
      expect(res.data?.items[0]).toHaveProperty("id");
      expect(res.data?.items[0]).toHaveProperty("code");
      expect(res.data?.items[0]).toHaveProperty("codeString");
      expect(res.data?.items[0]).toHaveProperty("description");
      expect(res.data?.items[0]).toHaveProperty("card");
      expect(res.data?.items[0]).toHaveProperty("cardPrice");
      expect(res.data?.items[0]).toHaveProperty("categoryId");
      expect(res.data?.items[0]).toHaveProperty("cost");
      expect(res.data?.items[0]).toHaveProperty("dolar");
      expect(res.data?.items[0]).toHaveProperty("listPrice");
      expect(res.data?.items[0]).toHaveProperty("price");
      expect(res.data?.items[0]).toHaveProperty("transport");
      expect(res.data?.items[0]).toHaveProperty("utility");
      expect(res.data?.items[0]).toHaveProperty("vat");
      expect(res.status).toBe(200);
    });
  });

  describe("Test MDB upload", () => {
    it("Should insert all file's products into the DB", async () => {
      // Arrange
      await deleteProducts();
      const expectedResult = [
        {
          // Id: expect.anything(),
          Description: "Producto 1",
          Code: "99999901",
          CodeString: "99.99.99.01",
          // Utility: expect.anything(),
          // ListPrice: expect.anything(),
          // Vat: expect.anything(),
          // Dolar: expect.anything(),
          // Transport: expect.anything(),
          // CategoryId: expect.anything(),
          // Card: expect.anything(),
          // Cost: expect.anything(),
          // Price: expect.anything(),
          // CardPrice: expect.anything(),
        },
        {
          // Id: expect.anything(),
          Description: "Producto 2",
          Code: "99999902",
          CodeString: "99.99.99.02",
          // Utility: expect.anything(),
          // ListPrice: expect.anything(),
          // Vat: expect.anything(),
          // Dolar: expect.anything(),
          // Transport: expect.anything(),
          // CategoryId: expect.anything(),
          // Card: expect.anything(),
          // Cost: expect.anything(),
          // Price: expect.anything(),
          // CardPrice: expect.anything(),
        },
        {
          // Id: expect.anything(),
          Description: "Producto 3",
          Code: "99999903",
          CodeString: "99.99.99.03",
          // Utility: expect.anything(),
          // ListPrice: expect.anything(),
          // Vat: expect.anything(),
          // Dolar: expect.anything(),
          // Transport: expect.anything(),
          // CategoryId: expect.anything(),
          // Card: expect.anything(),
          // Cost: expect.anything(),
          // Price: expect.anything(),
          // CardPrice: expect.anything(),
        },
      ];
      const form = new FormData();
      const file = readFileSync(resolve("src", "__tests__", "data", "insert.mdb"));
      form.append("file", file);
      // Act
      const res = await client.post("/products/mdb", form, {
        headers: {
          ...form.getHeaders(),
        },
      });
      // Assert
      await sleep(3000);
      const dbRes = await baseRepository.executeQuery<any>(
        "SELECT * FROM PRODUCTS WHERE Code in (99999901, 99999902, 99999903)"
      );
      expect(dbRes[0]).toEqual(expect.objectContaining(expectedResult[0]));
      expect(dbRes[1]).toEqual(expect.objectContaining(expectedResult[1]));
      expect(dbRes[2]).toEqual(expect.objectContaining(expectedResult[2]));
      expect(res.status).toBe(204);
    });

    it.each([
      [
        "update and insert",
        [
          {
            // Id: expect.anything(),
            Description: "Producto Updated 1",
            Code: "99999901",
            CodeString: "99.99.99.01",
            Utility: 0.3,
            ListPrice: 56.19,
            Vat: 0.21,
            Dolar: 6.42,
            Transport: 0.14,
            // CategoryId: expect.anything(),
            Card: 0.23,
            Cost: 38.51,
            Price: 101,
            CardPrice: ProductCalculator.cardPrice(101, 0.23),
          },
          {
            // Id: expect.anything(),
            Description: "Producto Updated 2",
            Code: "99999902",
            CodeString: "99.99.99.02",
            Utility: 0.3,
            ListPrice: 56.19,
            Vat: 0.21,
            Dolar: 6.42,
            Transport: 0.14,
            // CategoryId: expect.anything(),
            Card: 0.23,
            Cost: 38.51,
            Price: 202,
            CardPrice: ProductCalculator.cardPrice(202, 0.23),
          },
          {
            // Id: expect.anything(),
            Description: "Producto Updated 3",
            Code: "99999903",
            CodeString: "99.99.99.03",
            Utility: 0.3,
            ListPrice: 56.19,
            Vat: 0.21,
            Dolar: 6.42,
            Transport: 0.14,
            // CategoryId: expect.anything(),
            Card: 0.23,
            Cost: 38.51,
            Price: 303,
            CardPrice: ProductCalculator.cardPrice(303, 0.23),
          },
          {
            // Id: expect.anything(),
            Description: "Producto 4",
            Code: "99999904",
            CodeString: "99.99.99.04",
            Utility: 0.3,
            ListPrice: 56.19,
            Vat: 0.21,
            Dolar: 6.42,
            Transport: 0.14,
            // CategoryId: expect.anything(),
            Card: 0.23,
            Cost: 38.51,
            Price: 400,
            CardPrice: ProductCalculator.cardPrice(400, 0.23),
          },
        ],
        "upsert.mdb",
      ],
    ])("Should %p all file's products into the DB", async (_msg, expectedResult, fileName) => {
      // Arrange
      await deleteProducts();
      await baseRepository.executeQuery<any>(
        `INSERT INTO PRODUCTS (Code, CodeString, Description) VALUES (${expectedResult[0].Code}, '${expectedResult[0].CodeString}', 'Exitent Product')`
      );
      const insertManySpy = jest.spyOn(ProductsRepository.prototype, "insertMany");
      const updateManyByCodeSpy = jest.spyOn(ProductsRepository.prototype, "updateManyByCode");
      // Act
      const form = new FormData();
      const file = readFileSync(resolve("src", "__tests__", "data", fileName));
      form.append("file", file);
      const res = await client.post("/products/mdb", form, {
        headers: {
          ...form.getHeaders(),
        },
      });
      // Assert
      await sleep(5000);
      // const codes = expectedResult.map((p) => p.Code);
      const dbRes = await baseRepository.executeQuery<any>(`SELECT * FROM PRODUCTS ORDER BY CODE`);
      expect(dbRes.length).toEqual(expectedResult.length);
      expectedResult.forEach((item, index) => {
        expect(dbRes[index]).toEqual(expect.objectContaining(item));
      });
      expect(res.status).toBe(204);
      expect(insertManySpy).toHaveBeenCalled();
      expect(updateManyByCodeSpy).toHaveBeenCalled();
    });
  });
});

async function sleep(time: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => res(), time);
  });
}
