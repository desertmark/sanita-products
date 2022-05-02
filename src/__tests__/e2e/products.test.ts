require("module-alias/register");
import "reflect-metadata";
import axios, { AxiosInstance } from "axios";
import { Server } from "http";
import { serverBuilder } from "../../config/server";
import { DiscountType, IDbInsertProduct, IDiscount, IProduct, ProductResponse } from "../../models/product.models";
import { SqlBaseRepository } from "@repositories/sql-base.repository";
import FormData from "form-data";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ProductsManager } from "@managers/products.manager";
import { ProductsRepository } from "@repositories/products.repository";
import { ProductCalculator } from "@utils/product.utils";
import { SqlHelper } from "@utils/common.utils";
import { Database } from "@models/database.model";
import { v4 as uuidv4 } from "uuid";
function productFactory(): IDbInsertProduct {
  return {
    code: 1,
    codeString: "00.00.00.01",
    description: `Test-description-${uuidv4()}`,
    utility: 0.21,
    listPrice: 0.21,
    vat: 0.21,
    dolar: 0.21,
    transport: 0.21,
    categoryId: 1,
    card: 0.21,
    cost: 0.21,
    price: 0.21,
    cardPrice: 0.21,
    // Temp fields until discounts array can be used.
    bonus: 0.21,
    bonus2: 0.21,
    cashDiscount: 0.21,
    cashDiscount2: 0.21,
  };
}

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
      // Arrange
      await deleteProducts();
      const products = [productFactory(), productFactory()];
      const discountLists: IDiscount[][] = [
        [
          { amount: 0.21, description: "Bonificacion", number: 1, type: DiscountType.bonus },
          { amount: 0.21, description: "Bonificacion 2", number: 2, type: DiscountType.bonus },
          { amount: 0.21, description: "Descuento de caja", number: 1, type: DiscountType.cash },
          { amount: 0.21, description: "Descuento de caja 2", number: 2, type: DiscountType.cash },
        ],
        [
          { amount: 0.21, description: "Bonificacion", number: 1, type: DiscountType.bonus },
          { amount: 0.21, description: "Bonificacion 2", number: 2, type: DiscountType.bonus },
          { amount: 0.21, description: "Descuento de caja", number: 1, type: DiscountType.cash },
          { amount: 0.21, description: "Descuento de caja 2", number: 2, type: DiscountType.cash },
        ],
      ];
      await baseRepository.executeQuery(SqlHelper.insertTemplate(Database.Tables.Products, products[0]));
      await baseRepository.executeQuery(SqlHelper.insertTemplate(Database.Tables.Products, products[1]));
      // Act
      const res = await client.get<ProductResponse>("/products");

      // Assert
      res.data.items.forEach((item, i) => {
        const product = products[i];
        Object.keys(product).forEach((k) => {
          expect(item).toHaveProperty(k, product[k]);
        });

        expect(item.discounts).toEqual(expect.arrayContaining(discountLists[i]));
      });
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
