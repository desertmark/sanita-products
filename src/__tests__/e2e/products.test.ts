require("module-alias/register");
import "reflect-metadata";
import axios, { AxiosInstance } from 'axios';
import { Server } from 'http';
import { serverBuilder } from '../../config/server';
import { IProduct, ProductResponse } from '../../models/product.models';
import { SqlBaseRepository } from "@repositories/sql-base.repository";
import FormData from "form-data";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Products E2E test", () => {
    jest.setTimeout(300000);
    let server: Server;
    let client: AxiosInstance;
    let baseRepository: SqlBaseRepository;
    let productsToDelete = [99999901, 99999902, 99999903];
    beforeAll(async () => {
        const serverInfo = await serverBuilder();
        server = serverInfo.server;
        baseRepository = serverInfo.container.get(SqlBaseRepository);
        client = axios.create({
            baseURL: 'http://localhost:3001'
        });
    });

    afterAll(async () => {
        await server.close();
        await baseRepository.executeQuery<any>(`DELETE FROM PRODUCTS WHERE Code in (${productsToDelete.join()})`);
    });

    describe("Test List products: GET: /products", () => {
        it("Should return the list of products", async () => {
            // Act
            const res = await client.get<ProductResponse>('/products');
            // Assert
            expect(typeof res.data?.total).toBe('number');
            expect(res.data?.items[0]).toHaveProperty("id");
            expect(res.data?.items[0]).toHaveProperty("code");
            expect(res.data?.items[0]).toHaveProperty("codeString")
            expect(res.data?.items[0]).toHaveProperty("description")
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
        it.only("Should insert all file's products into the DB", async () => {
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
                }
            ]
            const form = new FormData();
            const file = readFileSync(resolve('src', '__tests__', 'data', 'insert.mdb'));
            form.append('file', file);
            // Act
            const res = await client.post('/products/mdb', form, {
                headers: {
                    ...form.getHeaders(),
                }
            });
            // Assert
            await sleep(3000);
            const dbRes = await baseRepository.executeQuery<any>("SELECT * FROM PRODUCTS WHERE Code in (99999901, 99999902, 99999903)");
            expect(dbRes[0]).toEqual(expect.objectContaining(expectedResult[0]));
            expect(dbRes[1]).toEqual(expect.objectContaining(expectedResult[1]));
            expect(dbRes[2]).toEqual(expect.objectContaining(expectedResult[2]));
            expect(res.status).toBe(204);
        })
    });
});



async function sleep(time: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(() => res(), time);
    })
}