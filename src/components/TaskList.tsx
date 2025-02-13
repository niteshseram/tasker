import { useState, useCallback } from 'react';
import {
  TiArrowSortedDown,
  TiArrowSortedUp,
  TiArrowUnsorted,
} from 'react-icons/ti';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilterFill,
  RiFilterLine,
} from 'react-icons/ri';

import { PRIORITY, STATUS } from '../constants';
import type { Task } from '../types';
import TaskActions from './TaskActions';
import { TaskModal } from './TaskModal';
import { useTaskContext } from '@/context/TaskContext';
import { Input } from '@/components/ui/input';
import { useSortedTasks } from '@/components/hooks/useSortedTasks';
import { DeleteTaskAlertDialog } from './DeleteTaskAlertDialog';
import { useTaskFilters } from './hooks/ustFilterTasks';
import { Button } from './ui/button';
import { FilterPopover } from './FilterPopover';
import { usePagination } from './hooks/usePagination';
import PageSizeSelector from './PageSizeSelector';

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskRow({ task, onEdit, onDelete }: TaskRowProps) {
  return (
    <tr className="border border-gray-200 text-black">
      <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">
        {task.title}
      </th>
      <td className="px-6 py-4">{STATUS[task.status]}</td>
      <td className="px-6 py-4">{PRIORITY[task.priority]}</td>
      <td className="px-6 py-4 text-right">
        <TaskActions task={task} onDelete={onDelete} onEdit={onEdit} />
      </td>
    </tr>
  );
}

function TableHeader({
  label,
  isSorted,
  sortDirection,
  onClick,
}: {
  label: string;
  isSorted: boolean;
  sortDirection: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <button className="flex gap-1.5 items-center" onClick={onClick}>
      {label}
      {isSorted ? (
        sortDirection === 'asc' ? (
          <TiArrowSortedUp className="text-xs" />
        ) : (
          <TiArrowSortedDown className="text-xs" />
        )
      ) : (
        <TiArrowUnsorted className="text-xs" />
      )}
    </button>
  );
}

export default function TaskList() {
  const {
    state: { tasks },
    dispatch,
  } = useTaskContext();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [sort, setSort] = useState<{
    field: keyof Task | null;
    direction: 'asc' | 'desc';
  }>({ field: null, direction: 'asc' });

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const handleDelete = useCallback((task: Task) => {
    setDeletingTask(task);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletingTask) {
      dispatch({ type: 'DELETE_TASK', payload: deletingTask.id });
      setDeletingTask(null);
    }
  }, [deletingTask, dispatch]);

  const handleCloseModal = useCallback(() => {
    setEditingTask(null);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeletingTask(null);
  }, []);

  const {
    filterTitle,
    setFilterTitle,
    filterPriorities,
    setFilterPriorities,
    filterStatuses,
    setFilterStatuses,
    filteredTasks,
  } = useTaskFilters(tasks);

  const sortedTasks = useSortedTasks(filteredTasks, sort);

  // Use the pagination hook with the sorted tasks
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData: paginatedTasks,
    nextPage,
    prevPage,
    changePageSize,
  } = usePagination(sortedTasks, 3);
  console.log(paginatedTasks);

  console.log(tasks.length, pageSize);
  const filterCount = filterPriorities.length + filterStatuses.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Input
          className="max-w-md"
          placeholder="Search task"
          value={filterTitle}
          onChange={e => setFilterTitle(e.target.value)}
        />
        <FilterPopover
          trigger={
            <Button variant="outline">
              {filterCount > 0 ? <RiFilterFill /> : <RiFilterLine />}
            </Button>
          }
          filterPriorities={filterPriorities}
          setFilterPriorities={setFilterPriorities}
          filterStatuses={filterStatuses}
          setFilterStatuses={setFilterStatuses}
        />
      </div>
      <div className="overflow-x-auto sm:rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-400">
          <colgroup>
            <col />
            <col style={{ width: '8rem' }} />
            <col style={{ width: '8rem' }} />
            <col style={{ width: '5rem' }} />
          </colgroup>
          <thead className="text-gray-700 bg-gray-200 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3">
                <TableHeader
                  label="Title"
                  isSorted={sort.field === 'title'}
                  sortDirection={sort.direction}
                  onClick={() =>
                    setSort({
                      field: 'title',
                      direction:
                        sort.field === 'title' && sort.direction === 'asc'
                          ? 'desc'
                          : 'asc',
                    })
                  }
                />
              </th>
              <th scope="col" className="px-6 py-3">
                <TableHeader
                  label="Status"
                  isSorted={sort.field === 'status'}
                  sortDirection={sort.direction}
                  onClick={() =>
                    setSort({
                      field: 'status',
                      direction:
                        sort.field === 'status' && sort.direction === 'asc'
                          ? 'desc'
                          : 'asc',
                    })
                  }
                />
              </th>
              <th scope="col" className="px-6 py-3">
                <TableHeader
                  label="Priority"
                  isSorted={sort.field === 'priority'}
                  sortDirection={sort.direction}
                  onClick={() =>
                    setSort({
                      field: 'priority',
                      direction:
                        sort.field === 'priority' && sort.direction === 'asc'
                          ? 'desc'
                          : 'asc',
                    })
                  }
                />
              </th>
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <tr>
                <td className="px-6 py-4 text-center" colSpan={4}>
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {tasks.length > pageSize ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full size-10 flex items-center justify-center"
              onClick={prevPage}
              disabled={currentPage === 1}>
              <RiArrowLeftSLine className="size-8 shrink-0" />
            </Button>
            <span className="mx-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full size-10 flex items-center justify-center"
              onClick={nextPage}
              disabled={currentPage === totalPages}>
              <RiArrowRightSLine className="size-8 shrink-0" />
            </Button>
          </div>
        ) : (
          <div />
        )}
        <PageSizeSelector changePageSize={changePageSize} pageSize={pageSize} />
      </div>

      {editingTask && (
        <TaskModal open={true} task={editingTask} onClose={handleCloseModal} />
      )}
      {deletingTask && (
        <DeleteTaskAlertDialog
          open={true}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
