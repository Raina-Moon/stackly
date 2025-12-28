import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
      entities: [User, Board, Column, Card, Schedule, RecurringSchedule, BoardMember],
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    KanbanModule,
    SchedulesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
