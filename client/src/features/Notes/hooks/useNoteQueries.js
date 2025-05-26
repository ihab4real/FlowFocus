import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import noteService from "../services/noteService";
import { toast } from "react-hot-toast";
import { DEFAULT_FOLDER } from "../utils/constants";

/**
 * Note query keys for proper cache management
 */
export const noteKeys = {
  all: ["notes"],
  lists: () => [...noteKeys.all, "list"],
  list: (filters) => [...noteKeys.lists(), { filters }],
  details: () => [...noteKeys.all, "detail"],
  detail: (id) => [...noteKeys.details(), id],
  folders: () => [...noteKeys.all, "folders"],
};

/**
 * Hook for fetching all notes with optional filters
 * Note: Server returns all notes, client-side filtering is applied
 */
export const useNotesQuery = (filters = {}) => {
  return useQuery({
    queryKey: noteKeys.list(filters),
    queryFn: async () => {
      const response = await noteService.getNotes(); // Server doesn't support filters yet
      let notes = response.data.notes || [];

      // Apply client-side filtering
      if (filters.folder) {
        notes = notes.filter((note) => note.folder === filters.folder);
      }

      if (filters.limit) {
        notes = notes.slice(0, filters.limit);
      }

      return notes;
    },
    staleTime: 30 * 1000, // 30 seconds - notes don't change as frequently
    networkMode: "online",
  });
};

/**
 * Hook for fetching a single note by ID
 */
export const useNoteQuery = (id) => {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: async () => {
      const response = await noteService.getById(id);
      return response.data.note;
    },
    enabled: !!id, // Only run query if id exists
    staleTime: 60 * 1000, // 1 minute - individual notes are accessed less frequently
  });
};

/**
 * Hook for creating a new note
 */
export const useCreateNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await noteService.create(data);
      return response.data.note;
    },
    onSuccess: (newNote) => {
      // Invalidate all note lists to refresh data
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // Optionally add the new note to existing cache for immediate UI update
      queryClient.setQueryData(
        noteKeys.list({ folder: newNote.folder }),
        (oldData) => {
          if (oldData) {
            return [newNote, ...oldData];
          }
          return [newNote];
        }
      );

      toast.success("Note created");
    },
    onError: (error) => {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    },
  });
};

/**
 * Hook for updating an existing note
 */
export const useUpdateNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await noteService.update(id, data);
      return response.data.note;
    },
    onSuccess: (updatedNote, variables) => {
      // Update the specific note in cache
      queryClient.setQueryData(noteKeys.detail(variables.id), updatedNote);

      // Update the note in all list caches
      queryClient.setQueriesData({ queryKey: noteKeys.lists() }, (oldData) => {
        if (oldData) {
          return oldData.map((note) =>
            note._id === variables.id ? updatedNote : note
          );
        }
        return oldData;
      });

      // Show success message only for explicit saves (when title is updated)
      if (variables.data.title) {
        toast.success("Note saved");
      }
    },
    onError: (error) => {
      console.error("Error updating note:", error);
      toast.error("Failed to save note");
    },
  });
};

/**
 * Hook for deleting a note
 */
export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await noteService.delete(id);
      return response.data;
    },
    onSuccess: (_, noteId) => {
      // Remove the note from all caches
      queryClient.removeQueries({ queryKey: noteKeys.detail(noteId) });

      // Remove from all list caches
      queryClient.setQueriesData({ queryKey: noteKeys.lists() }, (oldData) => {
        if (oldData) {
          return oldData.filter((note) => note._id !== noteId);
        }
        return oldData;
      });

      toast.success("Note deleted");
    },
    onError: (error) => {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    },
  });
};

/**
 * Hook for fetching all folders
 */
export const useFoldersQuery = () => {
  return useQuery({
    queryKey: noteKeys.folders(),
    queryFn: async () => {
      const response = await noteService.getFolders();
      const serverFolders = response?.data?.folders || [];

      // Always ensure DEFAULT_FOLDER is included and comes first
      const folders = [DEFAULT_FOLDER];
      serverFolders.forEach((folder) => {
        if (folder !== DEFAULT_FOLDER && !folders.includes(folder)) {
          folders.push(folder);
        }
      });

      return folders;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - folders change less frequently
    // Initialize with localStorage data while fetching
    initialData: () => {
      try {
        const savedFolders = localStorage.getItem("note-folders");
        if (savedFolders) {
          const parsed = JSON.parse(savedFolders);
          // Ensure DEFAULT_FOLDER is always first
          if (!parsed.includes(DEFAULT_FOLDER)) {
            return [DEFAULT_FOLDER, ...parsed];
          }
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing saved folders:", e);
      }
      return [DEFAULT_FOLDER];
    },
  });
};

/**
 * Hook for creating a new folder
 */
export const useCreateFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name) => {
      const response = await noteService.createFolder(name);
      return { folder: name, welcomeNote: response.data.note };
    },
    onSuccess: ({ folder, welcomeNote }) => {
      // Update folders cache
      queryClient.setQueryData(noteKeys.folders(), (oldFolders) => {
        const currentFolders = oldFolders || [DEFAULT_FOLDER];
        const updatedFolders = currentFolders.includes(folder)
          ? currentFolders
          : [...currentFolders, folder];
        // Save to localStorage for persistence
        localStorage.setItem("note-folders", JSON.stringify(updatedFolders));
        return updatedFolders;
      });

      // Add welcome note to the new folder's note list
      if (welcomeNote) {
        queryClient.setQueryData(noteKeys.list({ folder }), [welcomeNote]);
      }

      // Invalidate note lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      toast.success(`Folder "${folder}" created`);
    },
    onError: (error) => {
      console.error("Error creating folder:", error);
      toast.error(error.response?.data?.message || "Failed to create folder");
    },
  });
};

/**
 * Hook for deleting a folder
 */
export const useDeleteFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name) => {
      const response = await noteService.deleteFolder(name);
      return { folderName: name, message: response.data.data.message };
    },
    onSuccess: ({ folderName, message }) => {
      // Update folders cache
      queryClient.setQueryData(noteKeys.folders(), (oldFolders) => {
        const currentFolders = oldFolders || [DEFAULT_FOLDER];
        const updatedFolders = currentFolders.filter((f) => f !== folderName);
        // Ensure DEFAULT_FOLDER is always present (server restriction)
        if (!updatedFolders.includes(DEFAULT_FOLDER)) {
          updatedFolders.unshift(DEFAULT_FOLDER);
        }
        // Save to localStorage for persistence
        localStorage.setItem("note-folders", JSON.stringify(updatedFolders));
        return updatedFolders;
      });

      // Remove all queries related to this folder
      queryClient.removeQueries({
        queryKey: noteKeys.list({ folder: folderName }),
      });

      // Invalidate all note lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      toast.success(message || `Folder "${folderName}" deleted`);
    },
    onError: (error) => {
      console.error("Error deleting folder:", error);
      toast.error(error.response?.data?.message || "Failed to delete folder");
    },
  });
};

/**
 * Hook for renaming a folder
 */
export const useRenameFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldName, newName }) => {
      const response = await noteService.renameFolder(oldName, newName);
      return { oldName, newName, message: response.data.data.message };
    },
    onSuccess: ({ oldName, newName, message }) => {
      // Update folders cache
      queryClient.setQueryData(noteKeys.folders(), (oldFolders) => {
        const currentFolders = oldFolders || [DEFAULT_FOLDER];
        const updatedFolders = currentFolders.map((f) =>
          f === oldName ? newName : f
        );
        // Save to localStorage for persistence
        localStorage.setItem("note-folders", JSON.stringify(updatedFolders));
        return updatedFolders;
      });

      // Update notes in the renamed folder
      queryClient.setQueriesData({ queryKey: noteKeys.lists() }, (oldData) => {
        if (oldData) {
          return oldData.map((note) => ({
            ...note,
            folder: note.folder === oldName ? newName : note.folder,
          }));
        }
        return oldData;
      });

      // Move the cache from old folder to new folder
      const oldFolderData = queryClient.getQueryData(
        noteKeys.list({ folder: oldName })
      );
      if (oldFolderData) {
        queryClient.setQueryData(
          noteKeys.list({ folder: newName }),
          oldFolderData
        );
        queryClient.removeQueries({
          queryKey: noteKeys.list({ folder: oldName }),
        });
      }

      toast.success(message || `Folder renamed to "${newName}"`);
    },
    onError: (error) => {
      console.error("Error renaming folder:", error);
      toast.error(error.response?.data?.message || "Failed to rename folder");
    },
  });
};
