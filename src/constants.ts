import { Priority, Status } from './types';

export const STATUS: Record<Status, string> = {
  not_started: 'Todo',
  in_progress: 'In Progress',
  completed: 'Done',
};

export const PRIORITY: Record<Priority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};