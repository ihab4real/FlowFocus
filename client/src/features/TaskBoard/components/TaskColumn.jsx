import React from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useDrop } from "react-dnd";
import TaskCard from "./TaskCard";
import { ItemTypes } from "../constants";

// TaskColumn component - serves as a drop target for tasks
function TaskColumn({ id, title, tasks, getPriorityColor, onMoveTask }) {
  // Set up drop target
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item) => {
      // Only move if the column is different
      if (item.columnId !== id) {
        onMoveTask(item.id, id);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`flex-shrink-0 w-72 rounded-lg p-2 ${
        isOver ? "bg-[#6C63FF]/10" : "bg-muted"
      } transition-colors duration-200`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{title}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 min-h-[100px]">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task._id || task.id}
              task={task}
              columnId={id}
              getPriorityColor={getPriorityColor}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground text-sm border border-dashed border-muted-foreground/30 rounded-md p-4">
            <p>No tasks yet</p>
            <p>Tasks will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskColumn;
