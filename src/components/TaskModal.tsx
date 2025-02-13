import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Priority, Status, Task } from '@/types';
import { PRIORITY, STATUS } from '@/constants';
import { useTaskContext } from '@/context/TaskContext';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  task?: Task;
}>;

export function TaskModal({ open, onClose, task }: Props) {
  const { dispatch } = useTaskContext();
  const statusOptions: Status[] = ['not_started', 'in_progress', 'completed'];
  const priorityOptions: Priority[] = [
    'none',
    'low',
    'medium',
    'high',
    'urgent',
  ];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Task>({
    defaultValues: task || {
      title: '',
      priority: 'none',
      status: 'not_started',
    },
  });

  const onSubmit = (data: Task) => {
    if (task) {
      dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, task: data } });
    } else {
      dispatch({ type: 'ADD_TASK', payload: data });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Task Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <Input
              {...register('title', { required: 'Title is required' })}
              required
              id="task-title"
              placeholder="Enter task title"
              className="mt-1"
            />
            {errors.title && (
              <span className="text-red-500 text-sm">
                {errors.title.message}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Task Status */}
            <div className="flex-1">
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select onValueChange={onChange} value={value}>
                    <SelectTrigger id="task-status" className="mt-1 w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem value={status} key={status}>
                          {STATUS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Task Priority */}
            <div className="flex-1">
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select onValueChange={onChange} value={value}>
                    <SelectTrigger id="task-priority" className="mt-1 w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(priority => (
                        <SelectItem value={priority} key={priority}>
                          {PRIORITY[priority]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
