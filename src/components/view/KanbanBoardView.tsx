import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Priority, Task } from '@/types';
import { PRIORITY, STATUS } from '@/constants';
import { RiDeleteBin2Line, RiEdit2Line } from 'react-icons/ri';
import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import TaskToolbar from '../TaskToolbar';
import { useTaskFilters } from '../hooks/ustFilterTasks';

const priorityColumns: Priority[] = ['low', 'medium', 'high'];

function SortableTaskCard({
  task,
  handleDelete,
  handleEdit,
}: {
  task: Task;
  handleDelete: (task: Task) => void;
  handleEdit: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2">
        <CardHeader className="p-4 cursor-grab">
          <CardTitle className="text-lg">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p>Status: {STATUS[task.status]}</p>
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit task"
              onClick={() => handleEdit(task)}>
              <RiEdit2Line className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete task"
              onClick={() => handleDelete(task)}>
              <RiDeleteBin2Line className="size-4 text-red-400" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// TaskCard for overlay while dragging
function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardHeader className="p-4 cursor-grab">
        <CardTitle className="text-lg">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p>Status: {STATUS[task.status]}</p>
      </CardContent>
    </Card>
  );
}

function Column({
  priority,
  taskIds,
  handleDelete,
  handleEdit,
  tasks,
}: {
  priority: Priority;
  taskIds: number[];
  handleDelete: (task: Task) => void;
  handleEdit: (task: Task) => void;
  tasks: Task[];
}) {
  const columnTasks = taskIds
    .map(id => tasks.find(task => task.id === id))
    .filter(Boolean) as Task[];

  return (
    <div className="bg-gray-100 p-4 rounded-lg min-w-[300px] h-full w-full flex-1 overflow-hidden">
      <h3 className="font-bold mb-4">{PRIORITY[priority]}</h3>
      <div className="overflow-y-auto h-full flex-1 pb-6">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {columnTasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              handleDelete={handleDelete}
              handleEdit={handleEdit}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

type Props = Readonly<{
  handleDelete: (task: Task) => void;
  handleEdit: (task: Task) => void;
}>;

export default function KanbanBoard({ handleDelete, handleEdit }: Props) {
  const { state, dispatch } = useTaskContext();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize empty arrays for each status if not present in kanbanOrder
  const kanbanOrder = { ...state.kanbanOrder };
  priorityColumns.forEach(priority => {
    if (!kanbanOrder[priority]) {
      kanbanOrder[priority] = state.tasks
        .filter(task => task.priority === priority)
        .map(task => task.id);
    }
  });

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { id } = event.active;
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      setActiveTask(task);
    }
  }

  // Handle drag end for sorting within column
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    if (activeId === overId) return;

    // Find which column the task is in
    let taskColumn: Priority | null = null;
    for (const priority of priorityColumns) {
      if (kanbanOrder[priority]?.includes(activeId)) {
        taskColumn = priority;
        break;
      }
    }

    if (!taskColumn) return;

    // Find the indices of both tasks
    const activeIndex = kanbanOrder[taskColumn].indexOf(activeId);
    const overIndex = kanbanOrder[taskColumn].indexOf(overId);

    if (activeIndex !== -1 && overIndex !== -1) {
      // Create a new array with the updated order
      const newTasksOrder = arrayMove(
        kanbanOrder[taskColumn],
        activeIndex,
        overIndex
      );

      const updatedKanbanOrder = {
        ...kanbanOrder,
        [taskColumn]: newTasksOrder,
      };

      dispatch({
        type: 'UPDATE_KANBAN_ORDER',
        payload: updatedKanbanOrder,
      });
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
  } = useTaskFilters(state.tasks);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <TaskToolbar
        hidePriorityFilter={true}
        filterTitle={filterTitle}
        setFilterTitle={setFilterTitle}
        filterPriorities={filterPriorities}
        setFilterPriorities={setFilterPriorities}
        filterStatuses={filterStatuses}
        setFilterStatuses={setFilterStatuses}
        customFieldFilters={customFieldFilters}
        setCustomFieldFilters={setCustomFieldFilters}
      />
      <DndContext
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto h-full flex-1">
          {priorityColumns.map(priority => (
            <Column
              key={priority}
              priority={priority}
              handleDelete={handleDelete}
              handleEdit={handleEdit}
              taskIds={kanbanOrder[priority] || []}
              tasks={filteredTasks}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
