import { Priority, Status } from './types';

export const STATUS: Record<Status, string> = {
  not_started: 'Todo',
  in_progress: 'In Progress',
  completed: 'Done',
};

export const PRIORITY: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};