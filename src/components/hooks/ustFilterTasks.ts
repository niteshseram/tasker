import { useState, useMemo } from 'react';
import type { Priority, Status, Task } from '@/types';

export function useTaskFilters(tasks: Task[]) {
  const [filterTitle, setFilterTitle] = useState('');
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<Status[]>([]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(
      task =>
        task.title.toLowerCase().includes(filterTitle.toLowerCase()) &&
        (filterPriorities.length === 0 ||
          filterPriorities.includes(task.priority)) &&
        (filterStatuses.length === 0 || filterStatuses.includes(task.status))
    );
  }, [tasks, filterTitle, filterPriorities, filterStatuses]);

  return {
    filterTitle,
    setFilterTitle,
    filterPriorities,
    setFilterPriorities,
    filterStatuses,
    setFilterStatuses,
    filteredTasks,
  };
}
