import { useState, useCallback } from 'react';
import { PRIORITY, STATUS } from '../constants';
import type { Task } from '../types';
import TaskActions from './TaskActions';
import { TaskModal } from './TaskModal';
import { useTaskContext } from '@/context/TaskContext';
import { DeleteTaskAlertDialog } from './DeleteTaskAlertDialog';

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

export default function TaskList() {
  const {
    state: { tasks },
    dispatch,
  } = useTaskContext();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

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

  return (
    <>
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
                Title
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Priority
              </th>
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
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
    </>
  );
}
