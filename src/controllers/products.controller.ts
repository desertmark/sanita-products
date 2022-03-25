import { inject } from "inversify";
import { controller, httpGet, httpPost, request, response } from "inversify-express-utils";
import { ProductsRepository } from "@repositories/products.repository";
import { Response } from "express";
import { Request } from "tedious";
import { IFile, ParseManager } from "@managers/parse.manager";
import { CategoriesRepository } from "@repositories/categories.repository";
import { GuidoliProduct, IGuidoliProduct, IProducto } from "@models/product.models";
import { CategoryMapper } from "@utils/category.utils";
import { ProductMapper } from "@utils/product.utils";
import { ProductsManager } from "@managers/products.manager";

type RequestWithFile = Request & { files?: Record<string, any> };

@controller("/products")
export class ProductsController {
  constructor(
    @inject(CategoriesRepository) private categories: CategoriesRepository,
    @inject(ProductsRepository) private products: ProductsRepository,
    @inject(ProductsManager) private productManager: ProductsManager,
    @inject(ParseManager) private parseManager: ParseManager
  ) {}

  @httpGet("/")
  async list(): Promise<any> {
    try {
      return await this.products.list();
    } catch (error) {
      console.error("Failed to list products.", error);
    }
  }

  @httpPost("/mdb")
  async mdb(@request() req: RequestWithFile, @response() res: Response): Promise<any> {
    // TODO: Move to manager.
    try {
      // Arrange Data
      const productos = await this.parseManager.mdbToJson<IProducto[]>(req.files.file as IFile, "lista");
      const productJsonList = productos.map(ProductMapper.toProductJSON);
      const categories = CategoryMapper.extractCategories(productJsonList);
      res.sendStatus(204);
      // Insert
      await this.categories.insertCategories(categories);
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
      this.productManager.updateManyFromGuidoliProducts(json);
      res.send(204);
    } catch (error) {
      console.error("Failed to parse xls.", error);
    }
  }
}
