import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { RecurringSchedule } from '../../entities/recurring-schedule.entity';
import { ScheduleService } from './services/schedule.service';
import { RecurringScheduleService } from './services/recurring-schedule.service';
import { ScheduleController } from './controllers/schedule.controller';
import { RecurringScheduleController } from './controllers/recurring-schedule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, RecurringSchedule])],
  controllers: [ScheduleController, RecurringScheduleController],
  providers: [ScheduleService, RecurringScheduleService],
  exports: [ScheduleService, RecurringScheduleService],
})
export class SchedulesModule {}
