import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from 'react';
import type { CustomField, Task } from '@/types';
import { mockData } from '@/data';

type Action =
  | {
      type: 'LOAD_STATE';
      payload: State;
    }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: number; task: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: number }
  | { type: 'ADD_CUSTOM_FIELD'; payload: CustomField }
  | { type: 'REMOVE_CUSTOM_FIELD'; payload: string };

interface State {
  tasks: Task[];
  customFields: CustomField[];
}

const initialState: State = {
  tasks: mockData,
  customFields: [],
};

function taskReducer(state: State, action: Action): State {
  let newState: State;

  switch (action.type) {
    case 'LOAD_STATE':
      newState = action.payload;
      break;
    case 'ADD_TASK':
      newState = {
        ...state,
        tasks: [{ ...action.payload, id: Date.now() }, ...state.tasks],
      };
      break;
    case 'UPDATE_TASK':
      newState = {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.task }
            : task
        ),
      };
      break;
    case 'DELETE_TASK':
      newState = {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
      break;
    case 'ADD_CUSTOM_FIELD':
      newState = {
        tasks: state.tasks.map(task => {
          const cloneTask = { ...task };
          cloneTask[action.payload.name] =
            action.payload.type === 'checkbox'
              ? false
              : action.payload.type === 'number'
              ? 0
              : '';
          return cloneTask;
        }),
        customFields: [...state.customFields, action.payload],
      };
      break;
    case 'REMOVE_CUSTOM_FIELD':
      newState = {
        ...state,
        customFields: state.customFields.filter(
          field => field.name !== action.payload
        ),
        tasks: state.tasks.map(task => {
          const cloneTask = { ...task };
          delete cloneTask[action.payload];
          return cloneTask;
        }),
      };
      break;
    default:
      return state;
  }

  return {
    ...newState,
  };
}

const TaskContext = createContext<
  | {
      state: State;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

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
    if (state.tasks.length === 0) {
      localStorage.removeItem('taskState');
      return;
    }
    localStorage.setItem(
      'taskState',
      JSON.stringify({ tasks: state.tasks, customFields: state.customFields })
    );
  }, [state.tasks, state.customFields, isInitialized]);

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
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