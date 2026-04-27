/**
 * Activity Log Types
 * Track all user actions in the system
 */

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'view';

export type ActivityResource =
  | 'personnel'
  | 'user'
  | 'medical-result'
  | 'auth'
  | 'asset';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: ActivityAction;
  resource: ActivityResource;
  resourceId?: string;
  description: string;
  timestamp: Date | string;
  metadata?: Record<string, any>;
}

export interface CreateActivityLogDTO {
  userId: string;
  userName: string;
  userEmail: string;
  action: ActivityAction;
  resource: ActivityResource;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface ActivityLogFilters {
  userId?: string;
  action?: ActivityAction;
  resource?: ActivityResource;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}
