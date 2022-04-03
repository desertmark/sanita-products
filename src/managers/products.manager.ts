import { IGuidoliProduct, IProduct } from "@models/product.models";
import { ProductsRepository } from "@repositories/products.repository";
import { Logger } from "@utils/logger";
import { ProductMapper } from "@utils/product.utils";
import { inject, injectable } from "inversify";
import { BulkManager } from "./bulk.manager";

@injectable()
export class ProductsManager {
  constructor(
    @inject(ProductsRepository) private products: ProductsRepository,
    @inject(BulkManager) private bulkManager: BulkManager,
    @inject(Logger) private logger: Logger,
  ) {}

  async insertMany(products: Omit<IProduct, "id">[]) {
    await this.bulkManager.processByChunk(products, this.products.insertMany.bind(this.products), {
      operationName: "products-manager.insertMany",
      chunkSize: 2000,
    });
  }

  async updateManyByCode(products: Omit<IProduct, "id">[]) {
    await this.bulkManager.processByChunk(products, this.products.updateManyByCode.bind(this.products), {
      operationName: "products-manager.updateManyByCode",
      chunkSize: 2000,
    });
  }

  async upsertMany(products: Omit<IProduct, "id">[]) {
    try {
      const dbCodes = await this.products.listCodes();
      const insertProducts = products.filter((p) => !dbCodes.includes(p.code));
      const updateProducts = products.filter((p) => dbCodes.includes(p.code));

      if (insertProducts?.length) {
        await this.insertMany(insertProducts);
      }
      if (updateProducts?.length) {
        await this.updateManyByCode(updateProducts);
      }
      this.logger.info("Upsert products completed :D");
    } catch (error) {
      this.logger.error("products-manager.upsertMany:", error);
      throw error;
    }
  }

  async updateManyFromGuidoliProducts(guidoliProducts: IGuidoliProduct[]) {
    const products = guidoliProducts.map((prod) => ProductMapper.toDbUpdateProduct(prod));
    this.bulkManager.processByChunk(products, this.products.updateManyByCode.bind(this.products), {
      operationName: "products-manager.updateManyFromGuidoliProducts",
      chunkSize: 1000,
    });
  }
}
