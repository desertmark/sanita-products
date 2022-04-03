import { ICategory } from "@models/category.models";
import { IGuidoliProduct, IProduct } from "@models/product.models";
import { CategoriesRepository } from "@repositories/categories.repository";
import { Logger } from "@utils/logger";
import { ProductMapper } from "@utils/product.utils";
import { inject, injectable } from "inversify";
import { BulkManager } from "./bulk.manager";

@injectable()
export class CategoriesManager {
  constructor(
    @inject(CategoriesRepository) private categories: CategoriesRepository,
    @inject(BulkManager) private bulkManager: BulkManager,
    @inject(Logger) private logger: Logger
  ) {}

  async upsertMany(categories: Omit<ICategory, "id">[]) {
    try {
      const dbCategories = await this.categories.list();
      const descriptions = dbCategories.map(c => c.description);
      const insertCategories = categories.filter((c) => !descriptions.includes(c.description));

      if (insertCategories?.length) {
        await this.categories.insertMany(insertCategories);
      }
      this.logger.info("Upsert categories completed :D");
    } catch (error) {
      this.logger.error("categories-manager.upsertMany:", error);
      throw error;
    }
  }
}
