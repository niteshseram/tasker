import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { CustomField, Task } from '@/types';
import { mockData } from '@/data';

// Delta represents just the change that was made
type Delta = {
  actionType: string;
  payload: unknown;
  inverse: () => Action; // Function to undo this action
};

type Action =
  | { type: 'LOAD_STATE'; payload: State }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: number; task: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: number }
  | { type: 'ADD_CUSTOM_FIELD'; payload: CustomField }
  | { type: 'REMOVE_CUSTOM_FIELD'; payload: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'BULK_DELETE_TASKS'; payload: number[] }
  | { type: 'BULK_RESTORE_TASKS'; payload: Task[] }
  | {
      type: 'BULK_UPDATE_TASKS';
      payload: { updates: Record<number, Partial<Task>> };
    }
  | { type: 'UPDATE_KANBAN_ORDER'; payload: Record<string, number[]> };

// KanbanOrder represents the order of tasks per status column
interface KanbanOrder {
  [priority: string]: number[]; // Array of task IDs in display order
}

interface State {
  tasks: Task[];
  customFields: CustomField[];
  kanbanOrder: KanbanOrder;
}

interface HistoryState {
  past: Delta[];
  present: State;
  future: Delta[];
}

const MAX_HISTORY_LENGTH = 50; // Limit history to last 50 operations

const initialState: State = {
  tasks: mockData,
  customFields: [],
  kanbanOrder: {}, // Initialize empty kanban order
};

const initialHistoryState: HistoryState = {
  past: [],
  present: initialState,
  future: [],
};

function createInverseAction(
  action: Action,
  state: State,
  resultingState: State
): Delta | null {
  switch (action.type) {
    case 'ADD_TASK': {
      // Find the task we just added in the resulting state by comparing
      const addedTask = resultingState.tasks.find(
        t =>
          t.id === action.payload.id ||
          (action.payload.id === undefined &&
            JSON.stringify(t) ===
              JSON.stringify({ ...action.payload, id: t.id }))
      );

      if (!addedTask) return null;

      return {
        actionType: 'ADD_TASK',
        payload: addedTask,
        inverse: () => ({ type: 'DELETE_TASK', payload: addedTask.id }),
      };
    }

    case 'UPDATE_TASK': {
      const originalTask = state.tasks.find(t => t.id === action.payload.id);
      if (!originalTask) return null;

      // Store only the changed fields for the inverse action
      const changedFields: Record<string, unknown> = {};
      for (const key in action.payload.task) {
        if (key in originalTask) {
          changedFields[key] = originalTask[key];
        }
      }

      return {
        actionType: 'UPDATE_TASK',
        payload: action.payload,
        inverse: () => ({
          type: 'UPDATE_TASK',
          payload: {
            id: action.payload.id,
            task: changedFields as Partial<Task>,
          },
        }),
      };
    }

    case 'BULK_UPDATE_TASKS': {
      const { updates } = action.payload;
      const ids = Object.keys(updates).map(Number);
      const updatedTasks = state.tasks.filter(task => ids.includes(task.id));
      if (updatedTasks.length === 0) return null;

      return {
        actionType: 'BULK_UPDATE_TASKS',
        payload: { updates },
        inverse: () => {
          return {
            type: 'BULK_UPDATE_TASKS',
            payload: {
              updates: updatedTasks.reduce((acc, task) => {
                acc[task.id] = task;
                return acc;
              }, {} as Record<number, Task>),
            },
          };
        },
      };
    }

    case 'DELETE_TASK': {
      const taskToDelete = state.tasks.find(t => t.id === action.payload);
      if (!taskToDelete) return null;

      return {
        actionType: 'DELETE_TASK',
        payload: action.payload,
        inverse: () => ({ type: 'ADD_TASK', payload: taskToDelete }),
      };
    }

    case 'BULK_DELETE_TASKS': {
      // Collect all tasks that will be deleted
      const tasksToDelete = state.tasks.filter(t =>
        action.payload.includes(t.id)
      );

      if (tasksToDelete.length === 0) return null;

      return {
        actionType: 'BULK_DELETE_TASKS',
        payload: tasksToDelete.map(task => task.id),
        inverse: () => ({
          type: 'BULK_RESTORE_TASKS',
          payload: tasksToDelete,
        }),
      };
    }

    case 'BULK_RESTORE_TASKS': {
      return {
        actionType: 'BULK_RESTORE_TASKS',
        payload: action.payload,
        inverse: () => ({
          type: 'BULK_DELETE_TASKS',
          payload: action.payload.map(task => task.id),
        }),
      };
    }

    case 'ADD_CUSTOM_FIELD':
      return {
        actionType: 'ADD_CUSTOM_FIELD',
        payload: action.payload,
        inverse: () => ({
          type: 'REMOVE_CUSTOM_FIELD',
          payload: action.payload.name,
        }),
      };

    case 'REMOVE_CUSTOM_FIELD': {
      const fieldToRemove = state.customFields.find(
        f => f.name === action.payload
      );
      if (!fieldToRemove) return null;

      return {
        actionType: 'REMOVE_CUSTOM_FIELD',
        payload: action.payload,
        inverse: () => ({
          type: 'ADD_CUSTOM_FIELD',
          payload: fieldToRemove,
        }),
      };
    }

    case 'UPDATE_KANBAN_ORDER': {
      return {
        actionType: 'UPDATE_KANBAN_ORDER',
        payload: action.payload,
        inverse: () => ({
          type: 'UPDATE_KANBAN_ORDER',
          payload: state.kanbanOrder,
        }),
      };
    }

    default:
      return null;
  }
}

function taskReducer(state: HistoryState, action: Action): HistoryState {
  // Handle undo
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state;

    const lastAction = state.past[state.past.length - 1];
    const inverse = lastAction.inverse();

    // Apply the inverse action to get the previous state
    const reducer = (s: State, a: Action): State => applyAction(s, a);
    const previousState = reducer(state.present, inverse);

    return {
      past: state.past.slice(0, state.past.length - 1),
      present: previousState,
      future: [lastAction, ...state.future].slice(0, MAX_HISTORY_LENGTH),
    };
  }

  // Handle redo
  if (action.type === 'REDO') {
    if (state.future.length === 0) return state;

    const nextAction = state.future[0];
    const actionToApply = {
      type: nextAction.actionType,
      payload: nextAction.payload,
    } as Action;

    // Apply the action to get the next state
    const reducer = (s: State, a: Action): State => applyAction(s, a);
    const nextState = reducer(state.present, actionToApply);

    return {
      past: [...state.past, nextAction].slice(-MAX_HISTORY_LENGTH),
      present: nextState,
      future: state.future.slice(1),
    };
  }

  // Handle LOAD_STATE separately as it resets history
  if (action.type === 'LOAD_STATE') {
    return {
      past: [],
      present: action.payload,
      future: [],
    };
  }

  // For other actions, apply them and update history
  const newPresent = applyAction(state.present, action);

  // Create inverse action for history - now passing both states
  const delta = createInverseAction(action, state.present, newPresent);

  if (!delta) {
    // If we can't create an inverse (like for LOAD_STATE), just return current state
    return {
      ...state,
      present: newPresent,
      future: [], // Clear future on new actions
    };
  }

  return {
    past: [...state.past, delta].slice(-MAX_HISTORY_LENGTH),
    present: newPresent,
    future: [], // Clear future on new actions
  };
}

// Initialize kanban order from existing tasks
function initializeKanbanOrder(tasks: Task[]): KanbanOrder {
  const order: KanbanOrder = {};
  tasks.forEach(task => {
    if (!order[task.status]) {
      order[task.status] = [];
    }
    order[task.status].push(task.id);
  });
  return order;
}

// Helper function to apply an action to state without history management
function applyAction(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'ADD_TASK': {
      const task = {
        ...action.payload,
        id: action.payload.id != null ? action.payload.id : Date.now(),
      };

      // Update the kanban order to include the new task
      const updatedKanbanOrder = { ...state.kanbanOrder };
      if (!updatedKanbanOrder[task.status]) {
        updatedKanbanOrder[task.status] = [];
      }
      updatedKanbanOrder[task.status].unshift(task.id);

      return {
        ...state,
        tasks: [task, ...state.tasks],
        kanbanOrder: updatedKanbanOrder,
      };
    }

    case 'UPDATE_TASK': {
      const { id, task: updatedFields } = action.payload;
      const taskIndex = state.tasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return state;

      const oldTask = state.tasks[taskIndex];
      const newTask = { ...oldTask, ...updatedFields };

      // Handle status change by updating kanban order
      const updatedKanbanOrder = { ...state.kanbanOrder };
      if (updatedFields.status && oldTask.status !== updatedFields.status) {
        // Remove from old status
        updatedKanbanOrder[oldTask.status] = (
          updatedKanbanOrder[oldTask.status] || []
        ).filter(taskId => taskId !== id);

        // Add to new status
        if (!updatedKanbanOrder[updatedFields.status]) {
          updatedKanbanOrder[updatedFields.status] = [];
        }
        updatedKanbanOrder[updatedFields.status].push(id);
      }

      return {
        ...state,
        tasks: state.tasks.map(task => (task.id === id ? newTask : task)),
        kanbanOrder: updatedKanbanOrder,
      };
    }

    case 'BULK_UPDATE_TASKS': {
      const { updates } = action.payload;
      const ids = Object.keys(updates).map(Number);
      const updatedTasks = state.tasks.map(task => {
        if (ids.includes(task.id)) {
          return { ...task, ...updates[task.id] };
        }
        return task;
      });

      // Update kanban order for any status changes
      const updatedKanbanOrder = { ...state.kanbanOrder };
      ids.forEach(id => {
        const oldTask = state.tasks.find(t => t.id === id);
        const newStatus = updates[id]?.status;

        if (oldTask && newStatus && oldTask.status !== newStatus) {
          // Remove from old status
          updatedKanbanOrder[oldTask.status] = (
            updatedKanbanOrder[oldTask.status] || []
          ).filter(taskId => taskId !== id);

          // Add to new status
          if (!updatedKanbanOrder[newStatus]) {
            updatedKanbanOrder[newStatus] = [];
          }
          updatedKanbanOrder[newStatus].push(id);
        }
      });

      return {
        ...state,
        tasks: updatedTasks,
        kanbanOrder: updatedKanbanOrder,
      };
    }

    case 'DELETE_TASK': {
      const deletedTaskId = action.payload;
      const taskToDelete = state.tasks.find(task => task.id === deletedTaskId);

      if (!taskToDelete) return state;

      // Update kanban order
      const updatedKanbanOrder = { ...state.kanbanOrder };
      Object.keys(updatedKanbanOrder).forEach(status => {
        updatedKanbanOrder[status] = updatedKanbanOrder[status].filter(
          id => id !== deletedTaskId
        );
      });

      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== deletedTaskId),
        kanbanOrder: updatedKanbanOrder,
      };
    }

    case 'BULK_DELETE_TASKS': {
      const taskIdsToDelete = action.payload;

      // Update kanban order
      const updatedKanbanOrder = { ...state.kanbanOrder };
      Object.keys(updatedKanbanOrder).forEach(status => {
        updatedKanbanOrder[status] = updatedKanbanOrder[status].filter(
          id => !taskIdsToDelete.includes(id)
        );
      });

      return {
        ...state,
        tasks: state.tasks.filter(task => !taskIdsToDelete.includes(task.id)),
        kanbanOrder: updatedKanbanOrder,
      };
    }

    case 'BULK_RESTORE_TASKS': {
      const restoredTasks = action.payload;

      // Update kanban order
      const updatedKanbanOrder = { ...state.kanbanOrder };
      restoredTasks.forEach(task => {
        if (!updatedKanbanOrder[task.status]) {
          updatedKanbanOrder[task.status] = [];
        }
        updatedKanbanOrder[task.status].push(task.id);
      });

      return {
        ...state,
        tasks: [...restoredTasks, ...state.tasks],
        kanbanOrder: updatedKanbanOrder,
      };
    }

    case 'ADD_CUSTOM_FIELD': {
      // Create new tasks with the custom field initialized
      const updatedTasks = state.tasks.map(task => {
        // Create a mutable copy of the task
        const updatedTask = { ...task };

        // Initialize the new field with an appropriate default value
        updatedTask[action.payload.name] =
          action.payload.type === 'checkbox'
            ? false
            : action.payload.type === 'number'
            ? 0
            : '';

        return updatedTask as Task;
      });

      return {
        ...state,
        tasks: updatedTasks,
        customFields: [action.payload, ...state.customFields],
      };
    }

    case 'REMOVE_CUSTOM_FIELD': {
      // Create new tasks without the removed field
      const updatedTasks = state.tasks.map(task => {
        // Create a mutable copy of the task
        const updatedTask = { ...task };

        // Remove the field
        delete updatedTask[action.payload];

        return updatedTask as Task;
      });

      return {
        ...state,
        customFields: state.customFields.filter(
          field => field.name !== action.payload
        ),
        tasks: updatedTasks,
      };
    }

    case 'UPDATE_KANBAN_ORDER': {
      return {
        ...state,
        kanbanOrder: action.payload,
      };
    }

    default:
      return state;
  }
}

const TaskContext = createContext<
  | {
      state: State;
      dispatch: React.Dispatch<Action>;
      canUndo: boolean;
      canRedo: boolean;
      undo: () => void;
      redo: () => void;
    }
  | undefined
>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [historyState, dispatch] = useReducer(taskReducer, initialHistoryState);
  const [isInitialized, setIsInitialized] = useState(false);

  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('taskState');
    if (savedState) {
      try {
        const { tasks, customFields, kanbanOrder } = JSON.parse(savedState);
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            tasks: tasks || [],
            customFields: customFields || [],
            kanbanOrder: kanbanOrder || initializeKanbanOrder(tasks || []),
          },
        });
      } catch (error) {
        console.error('Error loading task state:', error);
      }
    } else {
      // Initialize kanban order if no saved state exists
      const initialKanbanOrder = initializeKanbanOrder(initialState.tasks);
      dispatch({
        type: 'UPDATE_KANBAN_ORDER',
        payload: initialKanbanOrder,
      });
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    if (historyState.present.tasks.length === 0) {
      localStorage.removeItem('taskState');
      return;
    }
    localStorage.setItem(
      'taskState',
      JSON.stringify({
        tasks: historyState.present.tasks,
        customFields: historyState.present.customFields,
        kanbanOrder: historyState.present.kanbanOrder,
      })
    );
  }, [historyState.present, isInitialized]);

  return (
    <TaskContext.Provider
      value={{
        state: historyState.present,
        dispatch,
        canUndo,
        canRedo,
        undo,
        redo,
      }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}