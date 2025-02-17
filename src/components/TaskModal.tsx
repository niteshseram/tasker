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
import { Checkbox } from '@/components/ui/checkbox';
import type { Priority, Status, Task } from '@/types';
import { PRIORITY, STATUS } from '@/constants';
import { useTaskContext } from '@/context/TaskContext';

// Create a type that extends Task to allow for dynamic properties
type TaskFormData = {
  title: string;
  priority: Priority;
  status: Status;
  id?: number;
  [key: string]: string | number | boolean | undefined;
};

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  isBulk?: boolean;
  onBulkEdit?: (data: Partial<Task>) => void;
  defaultValues?: Partial<Task>;
}>;

export default function TaskModal({
  open,
  onClose,
  task,
  isBulk,
  onBulkEdit,
  defaultValues,
}: Props) {
  const { state, dispatch } = useTaskContext();
  const statusOptions: Status[] = ['not_started', 'in_progress', 'completed'];
  const priorityOptions: Priority[] = ['low', 'medium', 'high'];

  // Create default values for all fields, including custom fields
  function createDefaultValues(): TaskFormData {
    const values: TaskFormData = {
      title: task?.title || defaultValues?.title || '',
      priority: task?.priority || defaultValues?.priority || 'low',
      status: task?.status || defaultValues?.status || 'not_started',
      ...(task?.id !== undefined && { id: task.id }),
    };

    // Copy existing custom field values for editing, or initialize with defaults for new tasks
    state.customFields.forEach(field => {
      // Initialize with appropriate defaults based on field type
      if (field.type === 'checkbox') {
        values[field.name] = task?.[field.name] || false;
      } else if (field.type === 'number') {
        values[field.name] = task?.[field.name] || 0;
      } else {
        values[field.name] = task?.[field.name] || '';
      }
    });

    return values;
  }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Task>({
    defaultValues: createDefaultValues(),
  });

  function onSubmit(data: Task) {
    if (isBulk) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { title, ...taskWithoutTitle } = data;
      onBulkEdit?.(taskWithoutTitle);
    } else if (task) {
      dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, task: data } });
    } else {
      dispatch({ type: 'ADD_TASK', payload: data });
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? 'Bulk edit tasks' : task ? 'Edit Task' : 'New Task'}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Task Title */}
          {!isBulk && (
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
          )}

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

          <div className="mt-2 space-y-4">
            {state.customFields.map(field => (
              <div key={field.name}>
                {field.type === 'text' && (
                  <Input {...register(field.name)} placeholder={field.name} />
                )}
                {field.type === 'number' && (
                  <Input
                    type="number"
                    {...register(field.name)}
                    placeholder={field.name}
                  />
                )}
                {field.type === 'checkbox' && (
                  <div className="flex items-center">
                    <Controller
                      name={field.name}
                      control={control}
                      defaultValue={false}
                      render={({ field: { onChange, value } }) => (
                        <Checkbox
                          id={field.name}
                          checked={value}
                          onCheckedChange={checked => onChange(checked)}
                        />
                      )}
                    />
                    <label htmlFor={field.name} className="ml-2">
                      {field.name}
                    </label>
                  </div>
                )}
              </div>
            ))}
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
