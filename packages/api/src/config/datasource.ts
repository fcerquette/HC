import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'node:path';

function buildOptions(): DataSourceOptions {
  return {
    type: (process.env.DB_TYPE as 'postgres') || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [join(__dirname, '..', 'modules', '**', 'entities', '*.{ts,js}')],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  };
}

let instance: DataSource | null = null;

export class ORM {
  static getInstance(): DataSource {
    if (!instance) instance = new DataSource(buildOptions());
    return instance;
  }

  static async connect(): Promise<DataSource> {
    const ds = ORM.getInstance();
    if (!ds.isInitialized) await ds.initialize();
    return ds;
  }
}

/** Export usado por @nestjs/typeorm (TypeOrmModule.forRoot). */
export const dataSourceOptions = buildOptions();
