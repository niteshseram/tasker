import { useState } from 'react';
import {
  TiArrowSortedDown,
  TiArrowSortedUp,
  TiArrowUnsorted,
} from 'react-icons/ti';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';

import { PRIORITY, STATUS } from '@/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { CustomField, Task } from '@/types';
import PageSizeSelector from '../PageSizeSelector';
import TaskActions from '../TaskActions';
import { useTaskContext } from '@/context/TaskContext';
import { useSortedTasks } from '@/components/hooks/useSortedTasks';
import { useTaskFilters } from '../hooks/ustFilterTasks';
import { usePagination } from '../hooks/usePagination';
import { cn } from '@/lib/utils';
import TaskToolbar from '../TaskToolbar';

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  customFields: CustomField[];
  handleSelectTask: (taskId: number) => void;
  selectedTaskIds: number[];
}

function TaskRow({
  task,
  customFields,
  onEdit,
  onDelete,
  handleSelectTask,
  selectedTaskIds,
}: TaskRowProps) {
  return (
    <motion.tr
      layout
      className={cn(
        'border-b border-gray-200 text-black',
        selectedTaskIds.includes(task.id) && 'bg-slate-50'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeIn' }}>
      <th scope="row" className="px-6 py-4">
        <Checkbox
          checked={selectedTaskIds.includes(task.id)}
          onCheckedChange={() => handleSelectTask(task.id)}
        />
      </th>
      <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">
        {task.title}
      </th>
      <td className="px-6 py-4">{STATUS[task.status]}</td>
      <td className="px-6 py-4">{PRIORITY[task.priority]}</td>
      {customFields.map(field => (
        <td className="px-6 py-4">
          {task[field.name] === '' ? '-' : String(task[field.name])}
        </td>
      ))}
      <td>
        {selectedTaskIds.length === 0 && (
          <TaskActions task={task} onDelete={onDelete} onEdit={onEdit} />
        )}
      </td>
    </motion.tr>
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

type Props = Readonly<{
  selectedTaskIds: number[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<number[]>>;
  setOpenTaskModal: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenDeleteAlertDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleEdit: (task: Task) => void;
  handleDelete: (task: Task) => void;
}>;

export default function ListView({
  selectedTaskIds,
  setSelectedTaskIds,
  setOpenTaskModal,
  setOpenDeleteAlertDialog,
  handleEdit,
  handleDelete,
}: Props) {
  const {
    state: { tasks, customFields },
  } = useTaskContext();

  const [sort, setSort] = useState<{
    field: keyof Task | null;
    direction: 'asc' | 'desc';
  }>({ field: null, direction: 'asc' });

  function handleSelectTask(taskId: number) {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  }

  function handleSelectAllTasks() {
    if (selectedTaskIds.length === paginatedTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(paginatedTasks.map(task => task.id));
    }
  }

  const {
    filterTitle,
    setFilterTitle,
    filterPriorities,
    setFilterPriorities,
    filterStatuses,
    setFilterStatuses,
    filteredTasks,
    customFieldFilters,
    setCustomFieldFilters,
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
  } = usePagination(sortedTasks, 10);

  const bulkToolbar = (
    <div className="flex items-center justify-between gap-2 min-h-10 flex-wrap">
      <div className="flex items-center gap-0.5">
        <div className="text-sm">
          <span className="font-medium">{selectedTaskIds.length}</span> selected
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSelectedTaskIds([])}>
          <RiCloseLine />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenTaskModal(true)}>
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpenDeleteAlertDialog(true)}>
          Delete
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {selectedTaskIds.length > 0 ? (
        bulkToolbar
      ) : (
        <TaskToolbar
          filterTitle={filterTitle}
          setFilterTitle={setFilterTitle}
          filterPriorities={filterPriorities}
          setFilterPriorities={setFilterPriorities}
          filterStatuses={filterStatuses}
          setFilterStatuses={setFilterStatuses}
          customFieldFilters={customFieldFilters}
          setCustomFieldFilters={setCustomFieldFilters}
        />
      )}
      <div className="overflow-x-auto sm:rounded-lg overflow-auto border border-gray-200">
        <table className="w-full text-sm text-left rtl:text-right text-gray-400">
          <col style={{ width: '40px' }} />
          <colgroup>
            <col />
            <col style={{ width: '8rem' }} />
            <col style={{ width: '8rem' }} />
            {customFields.map(() => (
              <col style={{ width: '8rem' }} />
            ))}
            <col style={{ width: '5rem' }} />
          </colgroup>
          <thead className="text-gray-700 bg-gray-200 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3">
                <Checkbox
                  checked={selectedTaskIds.length === paginatedTasks.length}
                  onCheckedChange={handleSelectAllTasks}
                />
              </th>
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
              {customFields
                .map(field => field.name)
                .map(field => (
                  <th scope="col" className="px-6 py-3">
                    <TableHeader
                      label={field}
                      isSorted={sort.field === field}
                      sortDirection={sort.direction}
                      onClick={() =>
                        setSort({
                          field,
                          direction:
                            sort.field === field && sort.direction === 'asc'
                              ? 'desc'
                              : 'asc',
                        })
                      }
                    />
                  </th>
                ))}
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginatedTasks.length > 0 ? (
                paginatedTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    customFields={customFields}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    handleSelectTask={handleSelectTask}
                    selectedTaskIds={selectedTaskIds}
                  />
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4 text-center" colSpan={4}>
                    No tasks found
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-1.5 sticky bottom-0 pt-16">
        {sortedTasks.length > pageSize ? (
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
    </div>
  );
}
