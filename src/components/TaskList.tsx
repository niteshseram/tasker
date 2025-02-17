import { Task, View } from '@/types';
import KanbanBoard from './view/KanbanBoardView';
import ListView from './view/ListView';
import { useCallback, useState } from 'react';
import TaskModal from './TaskModal';
import { DeleteTaskAlertDialog } from './DeleteTaskAlertDialog';
import { useTaskContext } from '@/context/TaskContext';

type Props = Readonly<{
  view: View;
}>;
export default function TaskList({ view }: Props) {
  const { dispatch } = useTaskContext();
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [openTaskModal, setOpenTaskModal] = useState<boolean>(false);
  const [openDeleteAlertDialog, setOpenDeleteAlertDialog] =
    useState<boolean>(false);

  const handleEdit = useCallback((task: Task) => {
    setSelectedTask(task);
    setOpenTaskModal(true);
  }, []);

  const handleDelete = useCallback((task: Task) => {
    setSelectedTask(task);
    setOpenDeleteAlertDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (selectedTaskIds.length > 0) {
      dispatch({ type: 'BULK_DELETE_TASKS', payload: selectedTaskIds });
      setSelectedTaskIds([]);
    } else if (selectedTask) {
      dispatch({ type: 'DELETE_TASK', payload: selectedTask.id });
      setSelectedTask(null);
    }
    setOpenDeleteAlertDialog(false);
  }, [dispatch, selectedTaskIds, selectedTask]);

  const handleCloseTaskModal = useCallback(() => {
    setOpenTaskModal(false);
    setSelectedTask(null);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setOpenDeleteAlertDialog(false);
    setSelectedTask(null);
  }, []);

  function onBulkEditTask(data: Partial<Task>) {
    dispatch({
      type: 'BULK_UPDATE_TASKS',
      payload: {
        updates: selectedTaskIds.reduce((acc, id) => {
          acc[id] = data;
          return acc;
        }, {} as Record<number, Partial<Task>>),
      },
    });
  }

  return (
    <>
      {view === 'list' ? (
        <ListView
          selectedTaskIds={selectedTaskIds}
          setSelectedTaskIds={setSelectedTaskIds}
          setOpenTaskModal={setOpenTaskModal}
          setOpenDeleteAlertDialog={setOpenDeleteAlertDialog}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      ) : (
        <KanbanBoard handleDelete={handleDelete} handleEdit={handleEdit} />
      )}
      {openTaskModal && (
        <TaskModal
          open={true}
          task={selectedTask}
          onClose={handleCloseTaskModal}
          isBulk={selectedTaskIds.length > 0}
          onBulkEdit={onBulkEditTask}
        />
      )}
      {openDeleteAlertDialog && (
        <DeleteTaskAlertDialog
          open={true}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}
