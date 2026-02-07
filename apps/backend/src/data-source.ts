import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// .env.local 또는 .env 파일 로드
config({ path: '.env.local' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
        ssl:
          process.env.DB_SSL === 'false'
            ? false
            : { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl:
          process.env.DB_SSL === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false,
  logging: true,
});
