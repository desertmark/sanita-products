import { IConfig } from "@config/config";
import { IDbInsertProduct, IGuidoliProduct, IInsertProduct, IProduct } from "@models/product.models";
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
    @inject("config") private config: IConfig
  ) {}

  async list(): Promise<IProduct[]> {
    const products = await this.products.list();
    return products.map(ProductMapper.fromDbToProduct);
  }

  async listByCode(codes: string[]): Promise<IProduct[]> {
    const products = await this.products.listByCode(codes);
    return products.map(ProductMapper.fromDbToProduct);
  }

  async insertMany(products: Omit<IProduct, "id">[]) {
    await this.bulkManager.processByChunk(
      products,
      async (products: Omit<IProduct, "id">[]) => {
        // Insert products
        await this.products.insertMany(products);
        // Usage of discounts table is not completed, flag disabled until it does.
        if (this.config.useDiscountsTable) {
          await this.insertDiscounts(products);
        }
      },
      {
        operationName: "products-manager.insertMany",
        chunkSize: 2000,
      }
    );
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

  /**
   * It will persist the products discounts into the discounts table
   * @param insertedProducts products with set id.
   * @param products products with discounts.
   */
  private async insertDiscounts(products: IInsertProduct[]) {
    // Read inserted products to get IDs
    const codes = products.map((p) => p.code.toString());
    const insertedProducts = await this.listByCode(codes);
    // Join IDs and discounts.
    insertedProducts.forEach((insertedProduct) => {
      const productWithDiscounts = products.find((p) => p.code === insertedProduct.code);
      insertedProduct.discounts = productWithDiscounts?.discounts;
    });
    // Insert discounts.
    await this.products.insertManyDiscounts(insertedProducts);
  }
}
