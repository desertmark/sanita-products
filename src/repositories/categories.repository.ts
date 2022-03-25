import { ICategory } from "@models/category.models";
import { Database } from "@models/database.model";
import { inject, injectable } from "inversify";
import { CommonUtils, SqlHelper } from "@utils/common.utils";
import { SqlBaseRepository } from "./sql-base.repository";

@injectable()
export class CategoriesRepository {
  constructor(@inject(SqlBaseRepository) private baseRepository: SqlBaseRepository) {}

  async insertCategories(categories: Omit<ICategory, "id">[]) {
    const sql = `
      ${categories.map((cat) => SqlHelper.insertTemplate(Database.Tables.Categories, cat)).join("")}
    `;
    await this.baseRepository.executeQuery(sql, null, { timeout: 60000 });
  }

  async list(): Promise<ICategory[]> {
    const categories = await this.baseRepository.list<ICategory>(Database.Tables.Categories);
    return categories.map((cat) => CommonUtils.toCamelCaseRecord(cat));
  }
}
