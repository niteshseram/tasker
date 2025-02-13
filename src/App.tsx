import Navbar from './components/Navbar';
import TaskList from './components/TaskList';

function App() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="container mx-auto flex flex-col gap-4 flex-1 overflow-y-auto py-4">
        <h1 className="text-xl font-bold">Tasks</h1>
        <TaskList />
      </div>
    </div>
  );
}

export default App;
