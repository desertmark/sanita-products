import { Database } from "@models/database.model";
import { IDiscount, IProduct } from "@models/product.models";
import { CommonUtils, SqlHelper } from "@utils/common.utils";
import { ProductMapper } from "@utils/product.utils";
import { inject, injectable } from "inversify";
import { SqlBaseRepository } from "./sql-base.repository";
import fs from "fs";
import { orderBy } from "lodash";
// const _filter = require("lodash/filter");
// const { queryFilter, categoryFilter } = require("./articles-filter-factory");
// const { DatabaseError } = require("../util/errors");
// const { get, omit, isEmpty } = require("lodash");

@injectable()
export class ProductsRepository {
  constructor(@inject(SqlBaseRepository) private baseRepository: SqlBaseRepository) {}

  async findById(productId: string) {
    return await this.baseRepository.findById(productId, Database.Tables.Products);
  }

  async list(): Promise<IProduct[]> {
    const products = await this.baseRepository.list<IProduct>(Database.Tables.Products);
    return products.map((prod) => CommonUtils.toCamelCaseRecord(prod));
  }

  async listByCode(codes: string[]): Promise<IProduct[]> {
    const sql = `
      SELECT * FROM ${Database.Tables.Products}
      WHERE Code IN (${codes})
    `;
    const products = await this.baseRepository.executeQuery(sql);
    return products.map((prod) => SqlHelper.toAppEntity(prod, Database.Tables.Products));
  }

  async count(): Promise<number> {
    return await this.baseRepository.count(Database.Tables.Products);
  }

  async listCodes(): Promise<number[]> {
    const items = await this.baseRepository.list<{ Code: string }>(Database.Tables.Products, ["Code"]);
    return items.map((item) => parseInt(item.Code));
  }

  async insertMany(products: Omit<IProduct, "id">[]): Promise<void> {
    const sql = `
      ${products
        .map((prod) => SqlHelper.insertTemplate(Database.Tables.Products, ProductMapper.toDbProduct(prod)))
        .join("")}
    `;
    await this.baseRepository.executeQuery(sql, null, { timeout: 60000 });
  }

  async updateManyByCode(products: Omit<IProduct, "id">[]): Promise<void> {
    const sql = `
    ${products
      .map((prod) => SqlHelper.updateTemplate(Database.Tables.Products, ProductMapper.toDbProduct(prod), "code"))
      .join(";")}
    `;
    fs.writeFileSync("./updateManyByCode.sql", sql);
    await this.baseRepository.executeQuery(sql, null, { timeout: 60000 });
  }

  async insertDiscount(productId: number, discount: IDiscount): Promise<void> {
    const sql = SqlHelper.insertTemplate(Database.Tables.Discounts, { productId, ...discount });
    await this.baseRepository.executeQuery(sql);
  }

  /**
   * Given a list of products with discounts it will insert all the discounts of every product.
   */
  async insertManyDiscounts(products: IProduct[]) {
    const sql = products.map((prod) =>
      prod.discounts.map((disc) => SqlHelper.insertTemplate(Database.Tables.Discounts, { productId: prod.id, ...disc })).join('')
    ).join('');
    await this.baseRepository.executeQuery(sql);
  }
}
