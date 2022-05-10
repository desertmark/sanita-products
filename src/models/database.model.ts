import { TYPES } from "tedious";
export interface SqlTableDefinition {
  name: string;
  cols: SqlColDefinition[];
}
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
  parser?: Function;
}

const Int = TYPES.Int.name;
const String = `${TYPES.VarChar.name}(255)`;
const Decimal = `${TYPES.Decimal.name}(10,2)`;
const Money = TYPES.Money.name;

export class Database {
  public static readonly Tables = {
    Products: "Products",
    Categories: "Categories",
    Discounts: "Discounts",
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
          { name: "Code", type: BigInt.name, parser: parseInt },
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
          // Should be temporary fields until Discounts table can be used.
          { name: "Bonus", type: Decimal },
          { name: "Bonus2", type: Decimal },
          { name: "CashDiscount", type: Decimal },
          { name: "CashDiscount2", type: Decimal },
        ],
      },
      {
        name: Database.Tables.Discounts,
        cols: [
          { name: "ProductId", type: Int, fk: { foreignCol: "Id", foreignTable: Database.Tables.Products }, pk: true },
          { name: "Number", type: Int, pk: true },
          { name: "Type", type: String, notNull: true },
          { name: "Description", type: String },
          { name: "Amount", type: Decimal, notNull: true },
        ],
      },
    ] as SqlTableDefinition[],
  };

  static getTableColumn(tableName: string, columName: string): SqlColDefinition {
    return Database.Schema.Tables.find((t) => t.name == tableName)?.cols?.find(
      (c) => c.name.toLowerCase() === columName?.toLowerCase()
    );
  }

  static sanitizeColumnName(tableName: string, columName: string) {
    return this.getTableColumn(tableName, columName)?.name;
  }
}
