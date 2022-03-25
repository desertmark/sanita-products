import { ICategory } from "@models/category.models";
import {
  DiscountType,
  IDbProduct,
  IDbUpdateProduct,
  IDiscount,
  IGuidoliProduct,
  IProduct,
  IProductJSON,
  IProducto,
} from "@models/product.models";
import { camelCase, pick } from "lodash";
import sumBy from "lodash/sumBy";
import { CommonUtils } from "./common.utils";
import { Database } from "@models/database.model";
export class ProductMapper {
  static toProductList(productJsonList: IProductJSON[], categories: ICategory[]): Omit<IProduct, "id">[] {
    const products = productJsonList.map((json) => {
      const category = categories.find((cat) => cat.description === json.categoryDescription);
      return this.toProduct(json, category.id);
    });
    return products;
  }

  static toProductJSON(producto: IProducto): IProductJSON {
    return {
      code: producto.codigo,
      description: producto.descripcion,
      price: producto.precio,
      bonus: producto.bonif,
      bonus2: producto.bonif2,
      cashDiscount: producto.caja1,
      cashDiscount2: producto.caja2,
      cost: producto.costo,
      utility: producto.utilidad,
      listPrice: producto.pl,
      vat: producto.iva,
      dolar: producto.dolar,
      transport: producto.flete,
      categoryDescription: CommonUtils.capitalize(CommonUtils.cleanSpaces(producto.rubro)) || "No description",
      card: producto.tarjeta,
    };
  }

  static toProduct(productJson: IProductJSON, categoryId?: number): Omit<IProduct, "id"> {
    return {
      ...productJson,
      categoryId,
      description: CommonUtils.capitalize(CommonUtils.cleanSpaces(productJson.description)) || "No description",
      codeString: productJson.code,
      code: parseInt(productJson.code.replace(/[.]/g, "")),
      card: productJson.card / 100,
      transport: productJson.transport / 100,
      utility: +(productJson.utility - 1).toFixed(2),
      vat: productJson.vat / 100,
      discounts: [
        {
          number: 1,
          type: DiscountType.bonus,
          description: "Bonificacion",
          amount: productJson.bonus / 100,
        },
        {
          number: 2,
          type: DiscountType.bonus,
          description: "Bonificacion 2",
          amount: productJson.bonus2 / 100,
        },
        {
          number: 1,
          type: DiscountType.cash,
          description: "Descuento de caja",
          amount: productJson.cashDiscount / 100,
        },
        {
          number: 2,
          type: DiscountType.cash,
          description: "Descuento de caja 2",
          amount: productJson.cashDiscount2 / 100,
        },
      ],
      cardPrice: ProductCalculator.cardPrice(productJson.price, productJson.card),
    };
  }

  static toDbProduct(product: Omit<IProduct, "id">): IDbProduct {
    const productTable = Database.Schema.Tables.find((t) => t.name === Database.Tables.Products);
    const colNames = productTable.cols.map((col) => camelCase(col.name));
    return pick(product, colNames) as IDbProduct;
  }

  static toDbUpdateProduct(guidoliProduct: IGuidoliProduct): IDbUpdateProduct {
    const values = Object.values(guidoliProduct);
    return {
      code: parseInt(values[0].replace(/[.]/g, "")),
      listPrice: parseFloat(values[2]),
    };
    // bonificacion = parseFloat(values[3]);
    //   bonificacion2 = parseFloat(values[4]);
    //   bonificacion = (this.bonificacion || 0) / 100;
    //   bonificacion2 = (this.bonificacion2 || 0) / 100;
  }
}

export class ProductCalculator {
  static cost(listPrice: number, vat: number, discounts: IDiscount[] = []): number {
    const totalDiscount: number = sumBy(discounts, (d) => d.amount);
    const cost = (listPrice * (1 + vat - totalDiscount)).toFixed(2);
    return parseFloat(cost);
  }

  static price(cost: number, utility: number, transport: number): number {
    return parseFloat((cost * (1 + utility + transport)).toFixed(2));
  }

  static cardPrice(price: number, card: number): number {
    return parseFloat((price * (1 + card)).toFixed(2));
  }
}
