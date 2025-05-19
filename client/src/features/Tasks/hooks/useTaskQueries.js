import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import taskService from "../services/taskService";

/**
 * Task query keys for proper cache management
 */
export const taskKeys = {
  all: ["tasks"],
  lists: () => [...taskKeys.all, "list"],
  list: (filters) => [...taskKeys.lists(), { filters }],
  details: () => [...taskKeys.all, "detail"],
  detail: (id) => [...taskKeys.details(), id],
};

/**
 * Hook for fetching all tasks with optional filters
 */
export const useTasksQuery = (filters = {}) => {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      const response = await taskService.getTasks(filters);
      return response.data;
    },
  });
};

/**
 * Hook for fetching a single task by ID
 */
export const useTaskQuery = (id) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const response = await taskService.getById(id);
      return response.data;
    },
    enabled: !!id, // Only run query if id exists
  });
};

/**
 * Hook for creating a new task
 */
export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await taskService.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all task lists to refresh data
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook for updating an existing task
 */
export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await taskService.update(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the specific task and all task lists
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook for deleting a task
 */
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await taskService.delete(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      // Invalidate the specific task and all task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook for moving a task to a different status
 */
export const useMoveTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await taskService.moveTask(id, status);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the specific task and all task lists
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};
