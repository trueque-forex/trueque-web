// src/types/pg.d.ts
declare module 'pg' {
  export class Pool {
    constructor(opts?: any);
    query(text: string, params?: any[]): Promise<{ rows: any[] }>;
    connect?(): Promise<any>;
    end?(): Promise<void>;
  }
  export type PoolConfig = any;
}