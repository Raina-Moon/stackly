export interface NotificationPreferencesDto {
  overdueFollowupEnabled: boolean;
  delayMinutes: number;
  channels: {
    email: boolean;
    slack: boolean;
    webPush: boolean;
  };
}

export class UpdateNotificationPreferencesDto {
  overdueFollowupEnabled?: boolean;
  delayMinutes?: number;
  channels?: Partial<NotificationPreferencesDto['channels']>;
}
