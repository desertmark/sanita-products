import { inject } from "inversify";
import { controller, httpGet } from "inversify-express-utils";
import { ProductsRepository } from "@repositories/products.repository";

@controller("/products")
export class ProductsController {
  constructor(@inject(ProductsRepository) private products: ProductsRepository) {}

  @httpGet("/")
  async list(): Promise<any> {
    try {
      return await this.products.list();
    } catch (error) {
      console.error("Failed to list products.", error);
    }
  }
}
