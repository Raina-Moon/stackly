import { RecurrenceFrequency } from '../../../entities/recurring-schedule.entity';

export class CreateRecurringScheduleDto {
  title: string;
  description?: string;
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  startDate: Date;
  endDate?: Date;
  occurrences?: number;
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  duration?: number;
  color?: string;
  excludedDates?: string[];
  userId: string;
}
