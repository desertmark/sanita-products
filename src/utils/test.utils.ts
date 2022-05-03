require("module-alias/register");
import "reflect-metadata";
import { readFileSync } from "fs";
import { resolve } from "path";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import { AxiosInstance } from "axios";
import { IDbInsertProduct } from "../models/product.models";
import { SqlBaseRepository } from "../repositories/sql-base.repository";

export const deleteProducts = async (baseRepository: SqlBaseRepository) => {
  await baseRepository.executeQuery<any>(`DELETE FROM DISCOUNTS`);
  await baseRepository.executeQuery<any>(`DELETE FROM PRODUCTS`);
};

export async function postFile(client: AxiosInstance, url: string, fileName: string, fileFieldName = "file") {
  const form = new FormData();
  const file = readFileSync(resolve("src", "__tests__", "data", fileName));
  form.append(fileFieldName, file);
  return await client.post(url, form, {
    headers: {
      ...form.getHeaders(),
    },
  });
}

export function productFactory(codeString = "00.00.00.01", overrides = {}): IDbInsertProduct {
  const code = parseInt(codeString.replace(/\./g, ""));
  return {
    code,
    codeString,
    description: `Test-description-${uuidv4()}`,
    utility: 0.21,
    listPrice: 5,
    vat: 0.21,
    dolar: 0.21,
    transport: 0.21,
    // categoryId: 1,
    card: 0.21,
    cost: 0.21,
    price: 0.21,
    cardPrice: 0.21,
    // Temp fields until discounts array can be used.
    bonus: 0.1,
    bonus2: 0.1,
    cashDiscount: 0.1,
    cashDiscount2: 0.1,
    ...overrides,
  };
}
