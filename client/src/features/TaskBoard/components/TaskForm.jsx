import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Loader2 } from "lucide-react";
import taskService from "@/services/api/taskService";
import { statusMap } from "../taskUtils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const TaskForm = ({ onSubmit, initialData = null, selectedColumnId = null, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([
    { value: "Todo", label: "Todo" },
    { value: "Doing", label: "Doing" },
    { value: "Done", label: "Done" },
  ]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Initialize form data
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    priority: initialData?.priority || "Medium",
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate)
      : "",
    tags: initialData?.tags || [],
    status: initialData?.status || "Todo",
  });

  // Set initial status based on selected column
  useEffect(() => {
    if (selectedColumnId && !initialData) {
      // For standard columns, map ID to status using statusMap
      if (statusMap[selectedColumnId]) {
        setFormData(prev => ({ ...prev, status: statusMap[selectedColumnId] }));
      } else if (selectedColumnId.startsWith('custom-')) {
        // For custom columns, use the column ID as status
        setFormData(prev => ({ ...prev, status: selectedColumnId }));
        
        // Add custom column to available statuses if not already present
        const customStatusExists = availableStatuses.some(status => status.value === selectedColumnId);
        if (!customStatusExists) {
          setAvailableStatuses(prev => [
            ...prev, 
            { 
              value: selectedColumnId, 
              label: `Custom (${selectedColumnId.split('-')[1]})` 
            }
          ]);
        }
      }
    }
  }, [selectedColumnId, initialData, availableStatuses]);

  // Get all unique statuses from local storage
  useEffect(() => {
    const savedCustomColumns = localStorage.getItem('customColumns');
    if (savedCustomColumns) {
      try {
        const customCols = JSON.parse(savedCustomColumns);
        
        // Create a set of all statuses (standard + custom)
        const statusSet = new Set([
          ...availableStatuses.map(s => s.value),
          ...customCols.map(col => col.id)
        ]);
        
        // Convert to array of status objects
        const allStatuses = Array.from(statusSet).map(status => {
          // Check if it's a standard status
          const stdStatus = availableStatuses.find(s => s.value === status);
          if (stdStatus) return stdStatus;
          
          // Otherwise, it's a custom status
          const customCol = customCols.find(col => col.id === status);
          return {
            value: status,
            label: customCol ? customCol.title : `Custom (${status.split('-')[1]})`
          };
        });
        
        setAvailableStatuses(allStatuses);
      } catch (err) {
        console.error("Error parsing custom columns:", err);
      }
    }
  }, []);

  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
    setCalendarOpen(false);
  };

  const handleTagInput = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    // Prepare data for submission
    const submissionData = {
      ...formData,
      // Format date if it exists
      dueDate: formData.dueDate ? formData.dueDate : undefined,
    };

    setIsLoading(true);
    try {
      // If we have initialData with an ID, it's an update
      if (initialData?._id) {
        const updatedTask = await taskService.update(initialData._id, submissionData);
        onSubmit(updatedTask);
      } else {
        // Otherwise it's a new task
        const newTask = await taskService.create(submissionData);
        onSubmit(newTask);
      }
    } catch (err) {
      console.error("Error saving task:", err);
      setError(
        err.response?.data?.message || "Failed to save task. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Task title"
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            placeholder="Task description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              {availableStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Due Date
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex justify-between items-center text-left font-normal h-10"
              >
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  {formData.dueDate ? (
                    format(formData.dueDate, "PPP")
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </span>
                {formData.dueDate && (
                  <X
                    className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({ ...prev, dueDate: "" }));
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.dueDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Tags
          </label>
          <div className="rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <div className="flex flex-wrap gap-2 p-2">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Type and press Enter to add tags"
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[120px] h-8"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Press Enter to add a tag
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : initialData ? (
              "Update Task"
            ) : (
              "Create Task"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TaskForm;
