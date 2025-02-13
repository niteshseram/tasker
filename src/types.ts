export type Status = 'not_started' | 'in_progress' | 'completed';

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type Task = Readonly<{
  id: string;
  title: string;
  status: Status;
  priority: Priority;
}>;