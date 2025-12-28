import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Board } from './entities/board.entity';
import { Column } from './entities/column.entity';
import { Card } from './entities/card.entity';
import { Schedule } from './entities/schedule.entity';
import { RecurringSchedule } from './entities/recurring-schedule.entity';
import { BoardMember } from './entities/board-member.entity';
import { AuthModule } from './modules/auth/auth.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { SchedulesModule } from './modules/schedules/schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log('[DB ENV CHECK]', {
          DB_HOST: configService.get('DB_HOST'),
          DB_PORT: configService.get('DB_PORT'),
          DB_USERNAME: configService.get('DB_USERNAME'),
          DB_PASSWORD: configService.get('DB_PASSWORD'),
          DB_NAME: configService.get('DB_NAME'),
        });
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'stackly'),
          password: configService.get('DB_PASSWORD', 'stackly_dev_password'),
          database: configService.get('DB_NAME', 'stackly'),
          autoLoadEntities: true,
          synchronize: configService.get('NODE_ENV') !== 'production',
          entities: [User, Board, Column, Card, Schedule, RecurringSchedule, BoardMember],
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
    }),
    AuthModule,
    KanbanModule,
    SchedulesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
