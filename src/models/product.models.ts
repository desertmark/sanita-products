export enum DiscountType {
  bonus = "bonus",
  cash = "cash",
}
export interface IDiscount {
  number: number;
  type: DiscountType;
  description: string;
  amount: number;
}

export interface IProduct {
  id: number;
  code: number;
  codeString: string;
  description: string;
  discounts: IDiscount[];
  utility: number;
  listPrice: number;
  vat: number;
  dolar: number;
  transport: number;
  categoryId?: number;
  card: number;
  cost: number;
  price: number;
  cardPrice: number;
  // Temp fields until discounts array can be used.
  bonus: number;
  bonus2: number;
  cashDiscount: number;
  cashDiscount2: number;
}

export interface IProducto {
  precio: number;
  bonif: number;
  bonif2: number;
  caja1: number;
  caja2: number;
  costo: number;
  utilidad: number;
  pl: number;
  iva: number;
  dolar: number;
  flete: number;
  codigo: string;
  descripcion: string;
  rubro: string;
  tarjeta: number;
}

export interface IProductJSON {
  code: string;
  description: string;
  price: number;
  bonus: number;
  bonus2: number;
  cashDiscount: number;
  cashDiscount2: number;
  cost: number;
  utility: number;
  listPrice: number;
  vat: number;
  dolar: number;
  transport: number;
  categoryDescription: string;
  card: number;
}

export interface IGuidoliProduct {
  Código: number;
  Descripción: number;
  Precio: string;
  Bonif1: string;
  Bonif2: string;
  ["Neto Final con IVA"]: string;
  ["Precio Cliente con Margen"]: string;
  Estado: " ";
}

/**
 * File Header:
 * Código | Descripción | Precio | Bonif1 |	Bonif2 | Neto Final con IVA | Precio Cliente con Margen | Estado
 * To avoid troubles with words with special sybmols like `Código` get the values and extract by order.
 */
export class GuidoliProduct {
  public codigo: number;
  public precio: number;
  public bonificacion: number;
  public bonificacion2: number;

  constructor(product: IGuidoliProduct) {
    const values = Object.values(product);
    this.codigo = parseInt(values[0].replace(/[.]/g, ""));
    this.precio = parseFloat(values[2]);
    this.bonificacion = parseFloat(values[3]);
    this.bonificacion2 = parseFloat(values[4]);
    this.bonificacion = (this.bonificacion || 0) / 100;
    this.bonificacion2 = (this.bonificacion2 || 0) / 100;
  }
}

/**
 * Database Product Record after it was parsed.
 */
export type IDbProduct = Omit<IProduct, "discounts">;

/**
 * Db Product that is not yet inserted to the database thus, the lack of id and discounts.
 */
export type IDbInsertProduct = Omit<IDbProduct, "id">;
export type IDbUpdateProduct = Pick<IProduct, "listPrice" | "code">;

/**
 * Product app entity to insert, thus the lack of id.
 */
export type IInsertProduct = Omit<IProduct, "id">;

export interface ProductResponse {
  items: Omit<IProduct, "discount">[];
  total: number;
}
