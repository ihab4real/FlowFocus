import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import noteService from "../services/noteService";
import { toast } from "react-hot-toast";
import { DEFAULT_FOLDER } from "../utils/constants";

/**
 * Helper function to get current user ID from auth storage
 * @returns {string|null} User ID or null if not authenticated
 */
const getCurrentUserId = () => {
  try {
    const authStorage = JSON.parse(localStorage.getItem("auth-storage"));
    return authStorage?.state?.user?.id || null;
  } catch (e) {
    console.error("Error getting current user ID:", e);
    return null;
  }
};

/**
 * Helper function to get user-specific localStorage key for folders
 * @returns {string|null} User-specific key or null if no user
 */
const getFoldersStorageKey = () => {
  const userId = getCurrentUserId();
  return userId ? `note-folders-${userId}` : null;
};

/**
 * Note query keys for proper cache management
 * All keys are user-specific to prevent data leakage between users
 */
export const noteKeys = {
  all: (userId) => ["notes", userId],
  lists: (userId) => [...noteKeys.all(userId), "list"],
  list: (userId, filters) => [...noteKeys.lists(userId), { filters }],
  details: (userId) => [...noteKeys.all(userId), "detail"],
  detail: (userId, id) => [...noteKeys.details(userId), id],
  folders: (userId) => [...noteKeys.all(userId), "folders"],
};

/**
 * Hook for fetching all notes with optional filters
 * Note: Server returns all notes, client-side filtering is applied
 */
export const useNotesQuery = (filters = {}) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: noteKeys.list(userId, filters),
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
    enabled: !!userId, // Only run query if user is authenticated
    staleTime: 30 * 1000, // 30 seconds - notes don't change as frequently
    networkMode: "online",
  });
};

/**
 * Hook for fetching a single note by ID
 */
export const useNoteQuery = (id) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: noteKeys.detail(userId, id),
    queryFn: async () => {
      const response = await noteService.getById(id);
      return response.data.note;
    },
    enabled: !!id && !!userId, // Only run query if id exists and user is authenticated
    staleTime: 60 * 1000, // 1 minute - individual notes are accessed less frequently
  });
};

/**
 * Hook for creating a new note
 */
export const useCreateNoteMutation = () => {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async (data) => {
      const response = await noteService.create(data);
      return response.data.note;
    },
    onSuccess: (newNote) => {
      if (!userId) return;

      // Invalidate all note lists to refresh data
      queryClient.invalidateQueries({ queryKey: noteKeys.lists(userId) });

      // Optionally add the new note to existing cache for immediate UI update
      queryClient.setQueryData(
        noteKeys.list(userId, { folder: newNote.folder }),
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
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await noteService.update(id, data);
      return response.data.note;
    },
    onSuccess: (updatedNote, variables) => {
      if (!userId) return;

      // Update the specific note in cache
      queryClient.setQueryData(
        noteKeys.detail(userId, variables.id),
        updatedNote
      );

      // Update the note in all list caches
      queryClient.setQueriesData(
        { queryKey: noteKeys.lists(userId) },
        (oldData) => {
          if (oldData) {
            return oldData.map((note) =>
              note._id === variables.id ? updatedNote : note
            );
          }
          return oldData;
        }
      );

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
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async (id) => {
      const response = await noteService.delete(id);
      return response.data;
    },
    onSuccess: (_, noteId) => {
      if (!userId) return;

      // Remove the note from all caches
      queryClient.removeQueries({ queryKey: noteKeys.detail(userId, noteId) });

      // Remove from all list caches
      queryClient.setQueriesData(
        { queryKey: noteKeys.lists(userId) },
        (oldData) => {
          if (oldData) {
            return oldData.filter((note) => note._id !== noteId);
          }
          return oldData;
        }
      );

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
 * This hook derives folders from notes data for better performance and consistency
 */
export const useFoldersQuery = () => {
  const userId = getCurrentUserId();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: noteKeys.folders(userId),
    queryFn: async () => {
      // First, try to get folders from existing notes cache
      const cachedNotes = queryClient.getQueriesData({
        queryKey: noteKeys.lists(userId),
      });

      let allNotes = [];

      // Collect all notes from different cache entries
      cachedNotes.forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          allNotes.push(...data);
        }
      });

      // If no cached notes, fetch fresh notes
      if (allNotes.length === 0) {
        try {
          const response = await noteService.getNotes();
          allNotes = response.data.notes || [];
        } catch (error) {
          console.error("Error fetching notes:", error);
          // Fallback to server folders endpoint
          try {
            const response = await noteService.getFolders();
            const serverFolders = response?.data?.folders || [];

            const folders = [DEFAULT_FOLDER];
            serverFolders.forEach((folder) => {
              if (folder !== DEFAULT_FOLDER && !folders.includes(folder)) {
                folders.push(folder);
              }
            });
            return folders;
          } catch (fallbackError) {
            console.error("Error fetching folders:", fallbackError);
            return [DEFAULT_FOLDER];
          }
        }
      }

      // Extract unique folders from notes
      const folderSet = new Set();
      allNotes.forEach((note) => {
        if (note.folder) {
          folderSet.add(note.folder);
        }
      });

      // Convert to array and ensure DEFAULT_FOLDER is first
      const folders = [DEFAULT_FOLDER];
      Array.from(folderSet).forEach((folder) => {
        if (folder !== DEFAULT_FOLDER && !folders.includes(folder)) {
          folders.push(folder);
        }
      });

      // Save the derived folders to localStorage for persistence
      const storageKey = getFoldersStorageKey();
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(folders));
        } catch (e) {
          console.error("Error saving folders to localStorage:", e);
        }
      }

      return folders;
    },
    enabled: !!userId, // Only run query if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes - folders change less frequently
    // Initialize with localStorage data while fetching
    initialData: () => {
      try {
        const storageKey = getFoldersStorageKey();
        if (storageKey) {
          const savedFolders = localStorage.getItem(storageKey);
          if (savedFolders && savedFolders !== "null") {
            const parsed = JSON.parse(savedFolders);
            // Only use if it's a valid array with more than just DEFAULT_FOLDER
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Ensure DEFAULT_FOLDER is always first
              if (!parsed.includes(DEFAULT_FOLDER)) {
                return [DEFAULT_FOLDER, ...parsed];
              }
              return parsed;
            }
          }
        }
      } catch (e) {
        console.error("Error parsing saved folders:", e);
      }
      return undefined; // Return undefined to trigger queryFn
    },
  });
};

/**
 * Hook for creating a new folder
 */
export const useCreateFolderMutation = () => {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async (name) => {
      const response = await noteService.createFolder(name);
      return { folder: name, welcomeNote: response.data.note };
    },
    onSuccess: ({ folder, welcomeNote }) => {
      if (!userId) return;

      // Update folders cache
      queryClient.setQueryData(noteKeys.folders(userId), (oldFolders) => {
        const currentFolders = oldFolders || [DEFAULT_FOLDER];
        const updatedFolders = currentFolders.includes(folder)
          ? currentFolders
          : [...currentFolders, folder];
        // Save to localStorage for persistence
        const storageKey = getFoldersStorageKey();
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(updatedFolders));
        }
        return updatedFolders;
      });

      // Add welcome note to the new folder's note list
      if (welcomeNote) {
        queryClient.setQueryData(noteKeys.list(userId, { folder }), [
          welcomeNote,
        ]);
      }

      // Invalidate note lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: noteKeys.lists(userId) });

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
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async (name) => {
      const response = await noteService.deleteFolder(name);
      return { folderName: name, message: response.data.message };
    },
    onSuccess: ({ folderName, message }) => {
      if (!userId) return;

      // Update folders cache
      queryClient.setQueryData(noteKeys.folders(userId), (oldFolders) => {
        const currentFolders = oldFolders || [DEFAULT_FOLDER];
        const updatedFolders = currentFolders.filter((f) => f !== folderName);
        // Ensure DEFAULT_FOLDER is always present (server restriction)
        if (!updatedFolders.includes(DEFAULT_FOLDER)) {
          updatedFolders.unshift(DEFAULT_FOLDER);
        }
        // Save to localStorage for persistence
        const storageKey = getFoldersStorageKey();
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(updatedFolders));
        }
        return updatedFolders;
      });

      // Remove all queries related to this folder
      queryClient.removeQueries({
        queryKey: noteKeys.list(userId, { folder: folderName }),
      });

      // Invalidate all note lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: noteKeys.lists(userId) });

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
  const userId = getCurrentUserId();

  return useMutation({
    mutationFn: async ({ oldName, newName }) => {
      const response = await noteService.renameFolder(oldName, newName);
      return { oldName, newName, message: response.data.message };
    },
    onSuccess: ({ oldName, newName, message }) => {
      if (!userId) return;

      // Update folders cache
      queryClient.setQueryData(noteKeys.folders(userId), (oldFolders) => {
        const currentFolders = oldFolders || [DEFAULT_FOLDER];
        const updatedFolders = currentFolders.map((f) =>
          f === oldName ? newName : f
        );
        // Save to localStorage for persistence
        const storageKey = getFoldersStorageKey();
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(updatedFolders));
        }
        return updatedFolders;
      });

      // Update notes in the renamed folder
      queryClient.setQueriesData(
        { queryKey: noteKeys.lists(userId) },
        (oldData) => {
          if (oldData) {
            return oldData.map((note) => ({
              ...note,
              folder: note.folder === oldName ? newName : note.folder,
            }));
          }
          return oldData;
        }
      );

      // Move the cache from old folder to new folder
      const oldFolderData = queryClient.getQueryData(
        noteKeys.list(userId, { folder: oldName })
      );
      if (oldFolderData) {
        queryClient.setQueryData(
          noteKeys.list(userId, { folder: newName }),
          oldFolderData
        );
        queryClient.removeQueries({
          queryKey: noteKeys.list(userId, { folder: oldName }),
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
