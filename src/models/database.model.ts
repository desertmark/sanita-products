import { TYPES } from "tedious";
export interface SqlColDefinition {
  name: string;
  type: string;
  notNull?: boolean;
  pk?: boolean;
  identity?: boolean;
  fk?: {
    foreignTable: string;
    foreignCol: string;
  };
}

const Int = TYPES.Int.name;
const String = `${TYPES.VarChar.name}(255)`;
const Decimal = `${TYPES.Decimal.name}(5,2)`;
const Money = TYPES.Money.name;
export class Database {
  public static readonly Tables = {
    Products: "Products",
    Categories: "Categories",
  };

  public static Schema = {
    Tables: [
      {
        name: Database.Tables.Categories,
        cols: [
          { name: "Id", type: Int, identity: true, notNull: true, pk: true },
          { name: "Description", type: String },
        ] as SqlColDefinition[],
      },
      {
        name: Database.Tables.Products,
        cols: [
          { name: "Id", type: Int, identity: true, notNull: true, pk: true },
          { name: "Description", type: String },
          { name: "Code", type: Int },
          { name: "CodeString", type: String },
          { name: "Utility", type: Decimal },
          { name: "ListPrice", type: Money },
          { name: "Vat", type: Decimal },
          { name: "Dolar", type: Money },
          { name: "Transport", type: Decimal },
          { name: "CategoryId", type: Int, fk: { foreignCol: "Id", foreignTable: Database.Tables.Categories } },
          { name: "Card", type: Decimal },
          { name: "Cost", type: Decimal },
          { name: "Price", type: Decimal },
          { name: "CardPrice", type: Money },
        ] as SqlColDefinition[],
      },
    ],
  };
}
