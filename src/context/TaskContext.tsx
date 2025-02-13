import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from 'react';
import type { Task } from '@/types';

type Action =
  | { type: 'LOAD_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; task: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string };

interface State {
  tasks: Task[];
}

const initialState: State = {
  tasks: [],
};

function taskReducer(state: State, action: Action): State {
  let newState: State;

  switch (action.type) {
    case 'LOAD_TASKS':
      newState = {
        ...state,
        tasks: action.payload,
      };
      break;
    case 'ADD_TASK':
      newState = {
        ...state,
        tasks: [
          ...state.tasks,
          { ...action.payload, id: Date.now().toString() },
        ],
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
      const { tasks } = JSON.parse(savedState);
      dispatch({ type: 'LOAD_TASKS', payload: tasks });
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    localStorage.setItem('taskState', JSON.stringify({ tasks: state.tasks }));
  }, [state.tasks, isInitialized]);

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
