import { RecurrenceFrequency } from '../../../entities/recurring-schedule.entity';

export class UpdateRecurringScheduleDto {
  title?: string;
  description?: string;
  frequency?: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  startDate?: Date;
  endDate?: Date;
  occurrences?: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  color?: string;
  excludedDates?: string[];
}
