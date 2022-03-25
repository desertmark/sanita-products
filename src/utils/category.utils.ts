import { ICategory } from "@models/category.models";
import { IProductJSON } from "@models/product.models";
import uniq from "lodash/uniq";

export class CategoryMapper {
  static extractCategories(products: IProductJSON[]): Omit<ICategory, "id">[] {
    const categories = uniq(products.map((p) => p.categoryDescription));
    return categories.map((c) => {
      return {
        description: c,
      };
    });
  }
}
