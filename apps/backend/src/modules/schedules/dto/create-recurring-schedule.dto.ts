import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RecurrenceFrequency } from '../../../entities/recurring-schedule.entity';

export class CreateRecurringScheduleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  occurrences?: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'startTime must be in HH:MM or HH:MM:SS format',
  })
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'endTime must be in HH:MM or HH:MM:SS format',
  })
  endTime: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedDates?: string[];

  @IsUUID()
  userId: string;
}
