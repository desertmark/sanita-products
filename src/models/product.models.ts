export interface IDiscount {
  description: string;
  amount: number;
}

export interface IProduct {
  id: number;
  code: number;
  codeString: String;
  description: String;
  discounts: IDiscount[];
  utility: number;
  listPrice: number;
  vat: number;
  dolar: number;
  transport: number;
  categoryId: number;
  card: number;
  cost: number;
  price: number;
  cardPrice: number;
}
