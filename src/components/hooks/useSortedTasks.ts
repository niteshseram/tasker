import { useMemo } from 'react';
import type { Priority, Status, Task } from '@/types';

export function useSortedTasks(
  tasks: Task[],
  sort: {
    field: keyof Task | null;
    direction: 'asc' | 'desc';
  }
): Task[] {
  return useMemo(() => {
    const { field, direction } = sort;
    if (!field) return tasks;

    return [...tasks].sort((a, b) => {
      let aValue: string | number = a[field];
      let bValue: string | number = b[field];

      // Use custom ordering for priority and status
      if (field === 'priority') {
        const priorityOrder: Priority[] = ['low', 'medium', 'high'];
        aValue = priorityOrder.indexOf(a[field]);
        bValue = priorityOrder.indexOf(b[field]);
      } else if (field === 'status') {
        const statusOrder: Status[] = [
          'not_started',
          'in_progress',
          'completed',
        ];
        aValue = statusOrder.indexOf(a[field]);
        bValue = statusOrder.indexOf(b[field]);
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return direction === "asc"
          ? aValue === bValue
            ? 0
            : aValue
              ? -1
              : 1
          : aValue === bValue
            ? 0
            : aValue
              ? 1
              : -1
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sort]);
}
