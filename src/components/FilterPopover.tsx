import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Priority, Status } from '@/types';
import { PRIORITY, STATUS } from '@/constants';
import { Button } from './ui/button';

type Props = Readonly<{
  trigger: React.ReactNode;
  filterPriorities: Priority[];
  setFilterPriorities: (priorities: Priority[]) => void;
  filterStatuses: Status[];
  setFilterStatuses: (statuses: Status[]) => void;
}>;

export function FilterPopover({
  trigger,
  filterPriorities,
  setFilterPriorities,
  filterStatuses,
  setFilterStatuses,
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
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
