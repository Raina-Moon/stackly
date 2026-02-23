import { ScheduleStatus, ScheduleType } from '../../../entities/schedule.entity';

export class UpdateScheduleDto {
  title?: string;
  description?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  isAllDay?: boolean;
  color?: string;
  reminders?: {
    minutes: number;
    method: 'email' | 'notification';
  }[];
  cardId?: string;
}
