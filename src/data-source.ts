import { DataSource } from 'typeorm';
import "reflect-metadata";

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'resources/db/db.sqlite',
  synchronize: true,
  logging: false,
  entities: ['entities/**/*.ts',],
  migrations: ['resources/db/migrations/**/*.ts'],
  subscribers: [],
});