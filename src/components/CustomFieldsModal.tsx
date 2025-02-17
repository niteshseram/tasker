import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
import { useTaskContext } from '@/context/TaskContext';
import { CustomField, CustomFieldType } from '@/types';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

const FIELD_TYPES: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  checkbox: 'Checkbox',
};

export function CustomFieldsModal({ open, onClose }: Props) {
  const { state, dispatch } = useTaskContext();
  const types: CustomFieldType[] = ['text', 'number', 'checkbox'];
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomField>({
    defaultValues: {
      name: '',
      type: 'text',
    },
  });

  const onSubmit = (data: CustomField) => {
    const { name, type } = data;
    dispatch({ type: 'ADD_CUSTOM_FIELD', payload: { name, type } });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Custom fields</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <form className="flex space-x-2" onSubmit={handleSubmit(onSubmit)}>
            {/* Field name */}
            <div className="w-full">
              <Input
                {...register('name', {
                  required: 'Name is required',
                  // Check if field name already exists
                  validate: value =>
                    !state.customFields.some(
                      field => field.name.toLowerCase() === value.toLowerCase()
                    ) || 'Field name already exists',
                })}
                required
                id="task-title"
                placeholder="Enter field name"
                className="w-full"
              />
              {errors.name && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </span>
              )}
            </div>
            <Controller
              name="type"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select onValueChange={onChange} value={value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map(type => (
                      <SelectItem value={type} key={type}>
                        {FIELD_TYPES[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Button type="submit">Add</Button>
          </form>
          <div className="space-y-2">
            {state.customFields.map((field: CustomField) => (
              <div
                key={field.name}
                className="flex justify-between items-center">
                <span>
                  {field.name} ({FIELD_TYPES[field.type]})
                </span>
                <Button
                  variant="destructive"
                  onClick={() =>
                    dispatch({
                      type: 'REMOVE_CUSTOM_FIELD',
                      payload: field.name,
                    })
                  }>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
