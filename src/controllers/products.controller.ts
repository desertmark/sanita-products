import { inject } from "inversify";
import { controller, httpGet, httpPost, queryParam, request, requestBody, response } from "inversify-express-utils";
import { ProductsRepository } from "@repositories/products.repository";
import { Response } from "express";
import { Request } from "tedious";
import { IFile, ParseManager } from "@managers/parse.manager";
import { CategoriesRepository } from "@repositories/categories.repository";
import { IGuidoliProduct, IProducto } from "@models/product.models";
import { CategoryMapper } from "@utils/category.utils";
import { ProductMapper } from "@utils/product.utils";
import { ProductsManager } from "@managers/products.manager";
import { CategoriesManager } from "@managers/categories.manager";

type RequestWithFile = Request & { files?: Record<string, any> };

@controller("/products")
export class ProductsController {
  constructor(
    @inject(CategoriesRepository) private categories: CategoriesRepository,
    @inject(ProductsRepository) private products: ProductsRepository,
    @inject(ProductsManager) private productManager: ProductsManager,
    @inject(CategoriesManager) private categoriesManager: CategoriesManager,
    @inject(ParseManager) private parseManager: ParseManager
  ) {}

  @httpGet("/")
  async list(@queryParam('page') page = '0', @queryParam('size') size = '20'): Promise<any> {
    try {
      const total = await this.products.count();
      const items = await this.productManager.list(parseInt(page), parseInt(size));
      return {
        total,
        items,
      };
    } catch (error) {
      console.error("Failed to list products.", error);
    }
  }

  @httpPost("/mdb")
  async mdb(@request() req: RequestWithFile, @response() res: Response): Promise<any> {
    try {
      // Arrange Data
      const productos = await this.parseManager.mdbToJson<IProducto[]>(req.files.file as IFile, "lista");
      const productJsonList = productos.map(ProductMapper.toProductJSON);
      const categories = CategoryMapper.extractCategories(productJsonList);
      res.sendStatus(204);
      // Insert
      await this.categoriesManager.upsertMany(categories);
      const insertedCategories = await this.categories.list();

      const products = ProductMapper.toProductList(productJsonList, insertedCategories);
      await this.productManager.upsertMany(products);
    } catch (error) {
      console.error("Failed to parse mdb.", error);
    }
  }
  @httpPost("/xls")
  async xls(@request() req: RequestWithFile, @response() res: Response): Promise<any> {
    try {
      const json = await this.parseManager.xlsToJson<IGuidoliProduct[]>(req.files.file as IFile, 3);
      res.send(204);
      await this.productManager.updateManyFromGuidoliProducts(json);
    } catch (error) {
      console.error("Failed to parse xls.", error);
    }
  }
}
