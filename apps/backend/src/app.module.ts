import { Module } from '@nestjs/common';
import { resolve } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Board } from './entities/board.entity';
import { Column } from './entities/column.entity';
import { Card } from './entities/card.entity';
import { Schedule } from './entities/schedule.entity';
import { RecurringSchedule } from './entities/recurring-schedule.entity';
import { BoardMember } from './entities/board-member.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Friend } from './entities/friend.entity';
import { AuthModule } from './modules/auth/auth.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { FriendsModule } from './modules/friends/friends.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), '..', '..', '.env'),
        resolve(process.cwd(), '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const synchronize =
          configService.get('DB_SYNC') === 'true' ||
          configService.get('NODE_ENV') !== 'production';

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl:
              configService.get('DB_SSL') === 'false'
                ? false
                : { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize,
            entities: [
              User,
              Board,
              Column,
              Card,
              Schedule,
              RecurringSchedule,
              BoardMember,
              RefreshToken,
              Friend,
            ],
            logging: configService.get('NODE_ENV') === 'development',
          };
        }

        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          ssl:
            configService.get('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
          autoLoadEntities: true,
          synchronize,
          entities: [
            User,
            Board,
            Column,
            Card,
            Schedule,
            RecurringSchedule,
            BoardMember,
            RefreshToken,
            Friend,
          ],
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
    }),
    AuthModule,
    KanbanModule,
    SchedulesModule,
    RealtimeModule,
    FriendsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
