import { useState } from 'react';

import Navbar from '@/components/Navbar';
import TaskList from '@/components/TaskList';
import { TaskModal } from '@/components/TaskModal';
import { Button } from '@/components/ui/button';

function App() {
  const [openTaskModal, setOpenTaskModal] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="container sm:px-0 px-4 mx-auto flex flex-col gap-4 flex-1 overflow-y-auto py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Tasks</h1>
          <div>
            <Button
              variant="default"
              size="sm"
              onClick={() => setOpenTaskModal(true)}>
              Add Task
            </Button>
          </div>
        </div>
        <TaskList />
      </div>

      {openTaskModal && (
        <TaskModal
          open={openTaskModal}
          onClose={() => setOpenTaskModal(false)}
        />
      )}
    </div>
  );
}

export default App;
