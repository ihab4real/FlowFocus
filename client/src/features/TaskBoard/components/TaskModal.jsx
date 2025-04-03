import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskForm from "./TaskForm";

const TaskModal = ({ isOpen, onClose, initialData = null, selectedColumnId = null, onSubmit }) => {
  const handleSubmit = (taskData) => {
    onSubmit(taskData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>
        <TaskForm
          initialData={initialData}
          selectedColumnId={selectedColumnId}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
