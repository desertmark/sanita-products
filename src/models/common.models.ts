import { SqlParameter } from "@repositories/sql-base.repository";

export class BulkStatus {
  public inProgress: boolean = false;
  public completed: number = 0;
  public total: number = 0;
  public processed: number = 0;

  constructor(public operationName: string) {}
}
export type ProcessCallBack<T, R = any> = (items: T[]) => Promise<R>;

export interface PaginatedParams<T> {
  page?: number;
  size?: number;
  filters?: T;
  sort?: string;
}

export interface SqlListWhereClause {
  whereClause: string;
  sqlParams: SqlParameter[];
}
