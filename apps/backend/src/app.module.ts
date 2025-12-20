import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'stackly',
      password: process.env.DB_PASSWORD || 'stackly_dev_password',
      database: process.env.DB_NAME || 'stackly_db',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // Only in development
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
