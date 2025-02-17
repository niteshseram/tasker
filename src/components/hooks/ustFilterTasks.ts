import { useState, useMemo } from 'react';
import type { Priority, Status, Task } from '@/types';

export function useTaskFilters(tasks: Task[]) {
  const [filterTitle, setFilterTitle] = useState('');
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<Status[]>([]);
  const [customFieldFilters, setCustomFieldFilters] = useState<
    Record<string, string | number | boolean>
  >({});

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesTitle = task.title
        .toLowerCase()
        .includes(filterTitle.toLowerCase());
      const matchesPriority =
        filterPriorities.length === 0 ||
        filterPriorities.includes(task.priority);
      const matchesStatus =
        filterStatuses.length === 0 || filterStatuses.includes(task.status);

      // Check custom field filters
      const matchesCustomFields = Object.entries(customFieldFilters).every(
        ([field, filterValue]) => {
          // If no filter is provided for this field, skip filtering it.
          if (
            filterValue === undefined ||
            filterValue === null ||
            filterValue === ''
          ) {
            return true;
          }

          const taskValue = task[field];

          // For number and boolean types, check strict equality.
          if (typeof taskValue === 'number') {
            return Number(taskValue) === Number(filterValue);
          }
          if (typeof taskValue === 'number' || typeof taskValue === 'boolean') {
            return Boolean(taskValue) === Boolean(filterValue);
          }

          // For strings, perform a case-insensitive substring match.
          if (typeof taskValue === 'string') {
            return taskValue
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          }

          // For other types, fallback to strict equality.
          return taskValue === filterValue;
        }
      );

      return (
        matchesTitle && matchesPriority && matchesStatus && matchesCustomFields
      );
    });
  }, [
    tasks,
    filterTitle,
    filterPriorities,
    filterStatuses,
    customFieldFilters,
  ]);

  return {
    filterTitle,
    setFilterTitle,
    filterPriorities,
    setFilterPriorities,
    filterStatuses,
    setFilterStatuses,
    customFieldFilters,
    setCustomFieldFilters,
    filteredTasks,
  };
}
