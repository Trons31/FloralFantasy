export type NotificationPayload = {
  url?: string;
  screen?: string;
  data?: Record<string, string>;
};

export type QueueNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  payload?: NotificationPayload;
  dedupeKey?: string;
  orderId?: string | null;
  availableAt?: Date;
  maxAttempts?: number;
};

export type QueueNotificationsResult = {
  notificationId: string;
  userId: string;
  sequence: number;
  status: string;
  deduped: boolean;
};

export type TransportDispatchResult = {
  channel: string;
  attempted: boolean;
  success: boolean;
  permanentFailure: boolean;
  providerMessageId?: string;
  error?: string;
};
