import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationChannelsDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  slack?: boolean;

  @IsOptional()
  @IsBoolean()
  webPush?: boolean;
}

export interface NotificationPreferencesDto {
  overdueFollowupEnabled: boolean;
  delayMinutes: number;
  slackChannelId: string | null;
  channels: {
    email: boolean;
    slack: boolean;
    webPush: boolean;
  };
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  overdueFollowupEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  delayMinutes?: number;

  @IsOptional()
  @IsString()
  slackChannelId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  channels?: NotificationChannelsDto;
}
