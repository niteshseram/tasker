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
  | { type: 'REDO' };

interface State {
  tasks: Task[];
  customFields: CustomField[];
}

interface HistoryState {
  past: Delta[];
  present: State;
  future: Delta[];
}

// Configuration
const MAX_HISTORY_LENGTH = 50; // Limit history to last 50 operations

const initialState: State = {
  tasks: mockData,
  customFields: [],
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

    case 'DELETE_TASK': {
      const taskToDelete = state.tasks.find(t => t.id === action.payload);
      if (!taskToDelete) return null;

      return {
        actionType: 'DELETE_TASK',
        payload: action.payload,
        inverse: () => ({ type: 'ADD_TASK', payload: taskToDelete }),
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

      return {
        ...state,
        tasks: [task, ...state.tasks],
      };
    }

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.task }
            : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };

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
      const { tasks, customFields } = JSON.parse(savedState);
      dispatch({
        type: 'LOAD_STATE',
        payload: { tasks: tasks || [], customFields: customFields || [] },
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