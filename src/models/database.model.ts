import { TediousType, TYPES } from "tedious";
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
export class Database {
  public static readonly Tables = {
    Products: "Products",
    Categories: "Categories",
  };

  public static Schema = {
    Tables: [
      {
        name: Database.Tables.Products,
        cols: [
          {
            name: "Id",
            type: TYPES.Int.name,
            identity: true,
            notNull: true,
            pk: true,
          },
          {
            name: "Description",
            type: `${TYPES.VarChar.name}(255)`,
          },
        ] as SqlColDefinition[],
      },
    ],
  };
}
