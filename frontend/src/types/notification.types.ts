export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  BID_ACCEPTED = 'BID_ACCEPTED',
  HELPER_ASSIGNED = 'HELPER_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  OTHER = 'OTHER',
}

export interface Notification {
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId: string | null;
  relatedThreadId: string | null;
  relatedBidId: string | null;
  metadata: any;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}


