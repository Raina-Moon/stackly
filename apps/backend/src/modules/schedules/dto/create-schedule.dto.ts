import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleStatus, ScheduleType } from '../../../entities/schedule.entity';

class ScheduleReminderDto {
  @IsNotEmpty()
  minutes: number;

  @IsEnum(['email', 'notification'])
  method: 'email' | 'notification';
}

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ScheduleType)
  type?: ScheduleType;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleReminderDto)
  reminders?: ScheduleReminderDto[];

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  cardId?: string;
}
