export type Status = 'not_started' | 'in_progress' | 'completed';

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type Task = Readonly<{
  id: number;
  title: string;
  status: Status;
  priority: Priority;
  [key: string]: any; // For custom fields
}>;

export type CustomFieldType = 'text' | 'number' | 'checkbox';

export type CustomField = Readonly<{
  name: string;
  type: CustomFieldType;
}>;