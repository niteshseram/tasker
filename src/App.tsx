import { useState } from 'react';

import Navbar from '@/components/Navbar';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import { Button } from '@/components/ui/button';
import { CustomFieldsModal } from './components/CustomFieldsModal';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { View } from './types';

function App() {
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openCustomFieldsModal, setOpenCustomFieldsModal] = useState(false);
  const [view, setView] = useState<View>('list');

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="container sm:px-0 px-4 mx-auto flex flex-col gap-4 flex-1 overflow-hidden py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Tasks</h1>
            <Tabs
              defaultValue={view}
              onValueChange={value => setView(value as View)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="board">Kanban</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {view === 'list' && (
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setOpenTaskModal(true)}>
                Add Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenCustomFieldsModal(true)}>
                Custom fields
              </Button>
            </div>
          )}
        </div>
        <TaskList view={view} />
      </div>

      {openTaskModal && (
        <TaskModal
          open={openTaskModal}
          onClose={() => setOpenTaskModal(false)}
        />
      )}
      <CustomFieldsModal
        open={openCustomFieldsModal}
        onClose={() => setOpenCustomFieldsModal(false)}
      />
    </div>
  );
}

export default App;
