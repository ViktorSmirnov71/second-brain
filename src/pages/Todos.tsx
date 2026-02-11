import { TaskList } from "@/components/todos/TaskList";
import { TodoChat } from "@/components/todos/TodoChat";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function Todos() {
  return (
    <div className="flex flex-1 min-h-0 h-full">
      {/* Desktop: side-by-side layout */}
      <div className="hidden md:flex flex-1 min-h-0">
        {/* Chat panel — 40% */}
        <div className="w-[40%] min-h-0 flex flex-col glass-panel rounded-lg m-2 mr-1">
          <TodoChat />
        </div>

        {/* Divider */}
        <div className="w-px bg-white/[0.06] my-4" />

        {/* Task list — 60% */}
        <div className="w-[60%] min-h-0 flex flex-col glass-panel rounded-lg m-2 ml-1">
          <TaskList />
        </div>
      </div>

      {/* Mobile: tab switcher */}
      <div className="flex flex-col flex-1 min-h-0 md:hidden">
        <Tabs defaultValue="tasks" className="flex flex-col flex-1 min-h-0">
          <div className="px-4 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="tasks" className="flex-1">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                Chat
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="tasks"
            className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden"
          >
            <TaskList />
          </TabsContent>

          <TabsContent
            value="chat"
            className="flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden"
          >
            <TodoChat />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
