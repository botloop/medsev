/**
 * Calendar of Activities Types
 */

export const ACTIVITY_TYPES = [
  'Medical Exam',
  'Training',
  'Meeting',
  'Inspection',
  'Deployment',
  'Event',
  'Holiday',
  'Other',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

export interface CalendarActivity {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  date: string;        // ISO date string (YYYY-MM-DD)
  endDate?: string;    // for multi-day events
  time?: string;       // HH:MM
  location?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateCalendarActivityDTO {
  title: string;
  description?: string;
  type: ActivityType;
  date: string;
  endDate?: string;
  time?: string;
  location?: string;
}
