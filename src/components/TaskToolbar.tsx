import { CustomFieldFilter, Priority, Status } from '@/types';
import { FilterPopover } from './FilterPopover';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  RiArrowGoBackFill,
  RiArrowGoForwardFill,
  RiFilterFill,
  RiFilterLine,
} from 'react-icons/ri';
import { useTaskContext } from '@/context/TaskContext';

type Props = Readonly<{
  filterTitle: string;
  setFilterTitle: (title: string) => void;
  filterPriorities: Priority[];
  setFilterPriorities: (priorities: Priority[]) => void;
  filterStatuses: Status[];
  setFilterStatuses: (statuses: Status[]) => void;
  customFieldFilters: CustomFieldFilter;
  setCustomFieldFilters: (filters: CustomFieldFilter) => void;
  hidePriorityFilter?: boolean;
}>;

export default function TaskToolbar({
  filterPriorities,
  setFilterPriorities,
  filterStatuses,
  setFilterStatuses,
  customFieldFilters,
  setCustomFieldFilters,
  filterTitle,
  setFilterTitle,
  hidePriorityFilter,
}: Props) {
  const {
    state: { customFields },
    canUndo,
    canRedo,
    undo,
    redo,
  } = useTaskContext();

  const filterCount =
    filterPriorities.length +
    filterStatuses.length +
    Object.keys(customFieldFilters).length;

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <Input
        className="max-w-md"
        placeholder="Search task"
        value={filterTitle}
        onChange={e => setFilterTitle(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          aria-label="Undo button"
          disabled={!canUndo}
          onClick={undo}>
          <RiArrowGoBackFill />
        </Button>
        <Button
          variant="secondary"
          aria-label="Redo button"
          disabled={!canRedo}
          onClick={redo}>
          <RiArrowGoForwardFill />
        </Button>
        <FilterPopover
          trigger={
            <Button variant="outline" aria-label="Filter button">
              {filterCount > 0 ? <RiFilterFill /> : <RiFilterLine />}
            </Button>
          }
          hidePriorityFilter={hidePriorityFilter}
          filterPriorities={filterPriorities}
          setFilterPriorities={setFilterPriorities}
          filterStatuses={filterStatuses}
          setFilterStatuses={setFilterStatuses}
          customFields={customFields}
          customFieldFilters={customFieldFilters}
          setCustomFieldFilters={setCustomFieldFilters}
        />
      </div>
    </div>
  );
}
