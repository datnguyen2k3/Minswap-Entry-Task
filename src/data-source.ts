import { DataSource } from 'typeorm';
import "reflect-metadata";
import {PREFIX_PATH} from "./common/types";

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: PREFIX_PATH + 'resources/db/db.sqlite',
  synchronize: true,
  logging: false,
  entities: [PREFIX_PATH + 'entities/**/*.ts',],
  migrations: [PREFIX_PATH + 'resources/db/migrations/**/*.ts'],
  subscribers: [],
});

