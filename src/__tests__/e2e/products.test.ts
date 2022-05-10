require("module-alias/register");
import "reflect-metadata";
import axios, { AxiosInstance } from "axios";
import { Server } from "http";
import { Sanita, serverBuilder } from "../../config/server";
import { DiscountType, IDbInsertProduct, IDiscount, IProduct, ProductResponse } from "../../models/product.models";
import { SqlBaseRepository } from "@repositories/sql-base.repository";
import FormData from "form-data";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ProductsRepository } from "@repositories/products.repository";
import { ProductCalculator } from "@utils/product.utils";
import { CommonUtils, SqlHelper } from "@utils/common.utils";
import { Database } from "@models/database.model";
import { deleteProducts, postFile, productFactory, sleep } from "../../utils/test.utils";
import { config } from "@config/config";
import { merge } from "lodash";
let client: AxiosInstance;

describe("Products E2E test", () => {
  jest.setTimeout(300000);
  let baseRepository: SqlBaseRepository;
  let sanita: Sanita;
  beforeAll(async () => {
    const configOverrides = {
      server: {
        // Use a random free port
        port: 0,
      },
    };
    sanita = await serverBuilder(merge(config, configOverrides));
    baseRepository = sanita.container.get(SqlBaseRepository);
    client = axios.create({
      baseURL: `http://localhost:${sanita.port}`,
    });
    await deleteProducts(baseRepository);
  });

  afterAll(async () => {
    await sanita.stop();
  });

  afterEach(async () => await deleteProducts(baseRepository));

  describe("Test List products: GET: /products", () => {
    it("Should return the list of products", async () => {
      // Arrange
      const products = [productFactory(), productFactory()];
      const discountLists: IDiscount[][] = [
        [
          { amount: products[0].bonus, description: "Bonificacion", number: 1, type: DiscountType.bonus },
          { amount: products[0].bonus2, description: "Bonificacion 2", number: 2, type: DiscountType.bonus },
          { amount: products[0].cashDiscount, description: "Descuento de caja", number: 1, type: DiscountType.cash },
          { amount: products[0].cashDiscount2, description: "Descuento de caja 2", number: 2, type: DiscountType.cash },
        ],
        [
          { amount: products[1].bonus, description: "Bonificacion", number: 1, type: DiscountType.bonus },
          { amount: products[1].bonus2, description: "Bonificacion 2", number: 2, type: DiscountType.bonus },
          { amount: products[1].cashDiscount, description: "Descuento de caja", number: 1, type: DiscountType.cash },
          { amount: products[1].cashDiscount2, description: "Descuento de caja 2", number: 2, type: DiscountType.cash },
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
      expect(res.data.total).toBe(2);
    });

    describe("Test queryString paramters", () => {
      let products: IDbInsertProduct[];
      beforeEach(async () => {
        // Arrange
        products = [
          productFactory("00.00.00.01", { price: 1000 }),
          productFactory("00.00.00.02", { price: 900 }),
          productFactory("00.00.00.03", { price: 700 }),
          productFactory("00.00.00.04", { price: 800 }),
        ];
        await Promise.all(
          products.map((p) => baseRepository.executeQuery(SqlHelper.insertTemplate(Database.Tables.Products, p)))
        );
      });

      it("Should return products page by page", async () => {
        // Act
        const page0 = await client.get<ProductResponse>("/products?page=0&size=2");
        const page1 = await client.get<ProductResponse>("/products?page=1&size=2");
        // Assert
        expect(page0.data.items.length).toBe(2);
        expect(page1.data.items.length).toBe(2);
        expect(page0.data.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ codeString: "00.00.00.01" }),
            expect.objectContaining({ codeString: "00.00.00.02" }),
          ])
        );
        expect(page1.data.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ codeString: "00.00.00.03" }),
            expect.objectContaining({ codeString: "00.00.00.04" }),
          ])
        );
      });

      it("Should filter by codeString", async () => {
        // Act
        const res = await client.get<ProductResponse>("/products?codeString=00.00.00.03");
        // Assert
        expect(res.data.items.length).toBe(1);
        expect(res.data.items).toEqual(
          expect.arrayContaining([expect.objectContaining({ codeString: "00.00.00.03" })])
        );
      });

      it("Should filter by description", async () => {
        // Arrange
        const description = products[2].description;
        // Act
        const res = await client.get<ProductResponse>(`/products?description=${description}`);
        // Assert
        expect(res.data.items.length).toBe(1);
        expect(res.data.items).toEqual(expect.arrayContaining([expect.objectContaining({ description })]));
      });

      it("Should order by the price asc", async () => {
        // Act
        const res = await client.get<ProductResponse>(`/products?sort=price`);
        const [p1, p2, p3, p4] = res.data.items;
        // Assert
        expect(p1?.price).toBeLessThanOrEqual(p2?.price);
        expect(p2?.price).toBeLessThanOrEqual(p3?.price);
        expect(p3?.price).toBeLessThanOrEqual(p4?.price);
      });
    });
  });

  describe("Test MDB upload", () => {
    it("Should insert all file's products into the DB", async () => {
      // Arrange
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
