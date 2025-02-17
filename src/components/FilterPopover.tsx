import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Priority, Status, CustomField } from '@/types';
import { PRIORITY, STATUS } from '@/constants';
import { Button } from './ui/button';

type CustomFieldFilter = Record<string, string | number | boolean>;

type Props = Readonly<{
  trigger: React.ReactNode;
  filterPriorities: Priority[];
  setFilterPriorities: (priorities: Priority[]) => void;
  filterStatuses: Status[];
  setFilterStatuses: (statuses: Status[]) => void;
  customFieldFilters: CustomFieldFilter;
  setCustomFieldFilters: (filters: CustomFieldFilter) => void;
  customFields: CustomField[];
}>;

export function FilterPopover({
  trigger,
  filterPriorities,
  setFilterPriorities,
  filterStatuses,
  setFilterStatuses,
  customFieldFilters,
  setCustomFieldFilters,
  customFields,
}: Props) {
  const statusOptions: Status[] = ['not_started', 'in_progress', 'completed'];
  const priorityOptions: Priority[] = [
    'none',
    'low',
    'medium',
    'high',
    'urgent',
  ];

  function handleFilterStatusChange(value: Status, checked: boolean) {
    if (checked) {
      setFilterStatuses([...filterStatuses, value]);
    } else {
      setFilterStatuses(filterStatuses.filter(v => v !== value));
    }
  }

  function handleFilterPriorityChange(value: Priority, checked: boolean) {
    if (checked) {
      setFilterPriorities([...filterPriorities, value]);
    } else {
      setFilterPriorities(filterPriorities.filter(v => v !== value));
    }
  }

  function onClear() {
    setFilterPriorities([]);
    setFilterStatuses([]);
    setCustomFieldFilters({});
  }

  return (
    <Popover>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="grid gap-4">
          <header className="flex justify-between items-center">
            <h2 className="font-medium leading-none">Filters</h2>
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          </header>
          <div className="flex flex-col gap-4">
            {/* Status Filters */}
            <fieldset>
              <legend className="mb-2 font-medium">Status</legend>
              <div className="flex flex-wrap gap-y-1.5 gap-x-3">
                {statusOptions.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filterStatuses.includes(status)}
                      onCheckedChange={checked =>
                        handleFilterStatusChange(status, checked as boolean)
                      }
                    />
                    <label htmlFor={`status-${status}`}>{STATUS[status]}</label>
                  </div>
                ))}
              </div>
            </fieldset>
            {/* Priority Filters */}
            <fieldset>
              <legend className="mb-2 font-medium">Priority</legend>
              <div className="flex flex-wrap gap-y-1.5 gap-x-3">
                {priorityOptions.map(priority => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filterPriorities.includes(priority)}
                      onCheckedChange={checked =>
                        handleFilterPriorityChange(priority, checked as boolean)
                      }
                    />
                    <label htmlFor={`priority-${priority}`}>
                      {PRIORITY[priority]}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Custom Field Filters */}
            {customFields.length > 0 && (
              <div className="flex flex-col gap-4">
                {customFields.map(field => (
                  <div key={field.name} className="flex flex-col">
                    <label className="font-medium mb-2" htmlFor={field.name}>
                      {field.name}
                    </label>
                    {(field.type === 'text' || field.type === 'number') && (
                      <Input
                        id={field.name}
                        type={field.type === 'text' ? 'text' : 'number'}
                        placeholder={`Filter by ${field.name}`}
                        value={
                          customFieldFilters[field.name] !== undefined
                            ? String(customFieldFilters[field.name])
                            : ''
                        }
                        onChange={e =>
                          setCustomFieldFilters({
                            ...customFieldFilters,
                            [field.name]: e.target.value,
                          })
                        }
                      />
                    )}
                    {field.type === 'checkbox' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`custom-${field.name}`}
                          checked={!!customFieldFilters[field.name]}
                          onCheckedChange={checked =>
                            setCustomFieldFilters({
                              ...customFieldFilters,
                              [field.name]: checked,
                            })
                          }
                        />
                        <label htmlFor={`custom-${field.name}`}>
                          {field.name}
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
