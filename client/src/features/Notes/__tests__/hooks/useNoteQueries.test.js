import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useNotesQuery,
  useNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useFoldersQuery,
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useRenameFolderMutation,
  noteKeys,
} from "../../hooks/useNoteQueries";
import noteService from "../../services/noteService";
import {
  createMockNote,
  createMockNotes,
  createMockFolders,
  createMockNotesResponse,
  createMockNoteResponse,
  createMockFoldersResponse,
  createMockFolderCreateResponse,
  createMockFolderDeleteResponse,
  createMockFolderRenameResponse,
  createErrorResponse,
} from "../setup/testUtils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock the noteService
jest.mock("../../services/noteService", () => ({
  __esModule: true,
  default: {
    getNotes: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getFolders: jest.fn(),
    createFolder: jest.fn(),
    deleteFolder: jest.fn(),
    renameFolder: jest.fn(),
  },
}));

// Mock localStorage for user auth
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Create a wrapper for testing hooks with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useNoteQueries hooks", () => {
  const mockUserId = "user-123";
  const mockAuthStorage = {
    state: {
      user: { id: mockUserId },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockAuthStorage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("noteKeys", () => {
    it("should generate correct query keys for user", () => {
      const userId = "user-123";

      expect(noteKeys.all(userId)).toEqual(["notes", userId]);
      expect(noteKeys.lists(userId)).toEqual(["notes", userId, "list"]);
      expect(noteKeys.list(userId, { folder: "Work" })).toEqual([
        "notes",
        userId,
        "list",
        { filters: { folder: "Work" } },
      ]);
      expect(noteKeys.details(userId)).toEqual(["notes", userId, "detail"]);
      expect(noteKeys.detail(userId, "note-123")).toEqual([
        "notes",
        userId,
        "detail",
        "note-123",
      ]);
      expect(noteKeys.folders(userId)).toEqual(["notes", userId, "folders"]);
    });
  });

  describe("useNotesQuery", () => {
    it("should fetch notes without filters", async () => {
      // Arrange
      const mockNotes = createMockNotes(3);
      const mockResponse = createMockNotesResponse(mockNotes);
      noteService.getNotes.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useNotesQuery(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.getNotes).toHaveBeenCalledWith();
      expect(result.current.data).toEqual(mockNotes);
    });

    it("should fetch notes with folder filter", async () => {
      // Arrange
      const mockResponse = createMockNotesResponse(createMockNotes(5)); // Server returns all
      noteService.getNotes.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useNotesQuery({ folder: "Work" }), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.getNotes).toHaveBeenCalledWith();
      // Should filter client-side for "Work" folder
      expect(result.current.data.every((note) => note.folder === "Work")).toBe(
        true
      );
    });

    it("should apply limit filter", async () => {
      // Arrange
      const mockNotes = createMockNotes(5);
      const mockResponse = createMockNotesResponse(mockNotes);
      noteService.getNotes.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useNotesQuery({ limit: 3 }), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(3);
    });

    it("should not fetch notes when user is not authenticated", async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useNotesQuery(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(noteService.getNotes).not.toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      // Arrange
      const error = createErrorResponse("Failed to fetch notes");
      noteService.getNotes.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useNotesQuery(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  describe("useNoteQuery", () => {
    it("should fetch a note by id", async () => {
      // Arrange
      const mockNote = createMockNote();
      const mockResponse = createMockNoteResponse(mockNote);
      noteService.getById.mockResolvedValue(mockResponse);
      const noteId = "note-123";

      // Act
      const { result } = renderHook(() => useNoteQuery(noteId), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.getById).toHaveBeenCalledWith(noteId);
      expect(result.current.data).toEqual(mockNote);
    });

    it("should not fetch if id is not provided", async () => {
      // Act
      const { result } = renderHook(() => useNoteQuery(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(noteService.getById).not.toHaveBeenCalled();
    });

    it("should not fetch if user is not authenticated", async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useNoteQuery("note-123"), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(noteService.getById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateNoteMutation", () => {
    it("should create a note successfully", async () => {
      // Arrange
      const mockNote = createMockNote();
      const noteData = {
        title: "New Note",
        content: "Note content",
        folder: "Work",
        tags: ["important"],
      };
      const mockResponse = createMockNoteResponse(mockNote);
      noteService.create.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useCreateNoteMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(noteData);
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.create).toHaveBeenCalledWith(noteData);
      expect(result.current.data).toEqual(mockNote);
    });

    it("should handle creation errors", async () => {
      // Arrange
      const noteData = { content: "Missing title" };
      const error = createErrorResponse("Title is required");
      noteService.create.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useCreateNoteMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(noteData);
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  describe("useUpdateNoteMutation", () => {
    it("should update a note successfully", async () => {
      // Arrange
      const noteId = "note-123";
      const updateData = { title: "Updated Title", content: "Updated content" };
      const mockNote = createMockNote({ _id: noteId, ...updateData });
      const mockResponse = createMockNoteResponse(mockNote);
      noteService.update.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useUpdateNoteMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: noteId, data: updateData });
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.update).toHaveBeenCalledWith(noteId, updateData);
      expect(result.current.data).toEqual(mockNote);
    });

    it("should handle update errors", async () => {
      // Arrange
      const noteId = "nonexistent-note";
      const updateData = { title: "Updated Title" };
      const error = createErrorResponse("Note not found", 404);
      noteService.update.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useUpdateNoteMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: noteId, data: updateData });
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  describe("useDeleteNoteMutation", () => {
    it("should delete a note successfully", async () => {
      // Arrange
      const noteId = "note-123";
      const mockResponse = { data: { success: true } };
      noteService.delete.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useDeleteNoteMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(noteId);
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.delete).toHaveBeenCalledWith(noteId);
      expect(result.current.data).toEqual({ success: true });
    });

    it("should handle delete errors", async () => {
      // Arrange
      const noteId = "nonexistent-note";
      const error = createErrorResponse("Note not found", 404);
      noteService.delete.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useDeleteNoteMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(noteId);
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  describe("useFoldersQuery", () => {
    it("should fetch folders successfully", async () => {
      // Arrange
      const mockFolders = createMockFolders();
      const mockResponse = createMockFoldersResponse(mockFolders);
      noteService.getFolders.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useFoldersQuery(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.getFolders).toHaveBeenCalledWith();
      expect(result.current.data).toEqual(mockFolders);
    });

    it("should not fetch folders when user is not authenticated", async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useFoldersQuery(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(noteService.getFolders).not.toHaveBeenCalled();
    });

    it("should handle API errors with fallback to default folder", async () => {
      // Arrange - Both notes and folders endpoints fail
      const notesError = createErrorResponse("Failed to fetch notes");
      const foldersError = createErrorResponse("Failed to fetch folders");
      noteService.getNotes.mockRejectedValue(notesError);
      noteService.getFolders.mockRejectedValue(foldersError);

      // Act
      const { result } = renderHook(() => useFoldersQuery(), {
        wrapper: createWrapper(),
      });

      // Assert - Should fallback to default folder instead of throwing error
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(["General"]);
      expect(noteService.getNotes).toHaveBeenCalled();
      expect(noteService.getFolders).toHaveBeenCalled();
    });
  });

  describe("useCreateFolderMutation", () => {
    it("should create a folder successfully", async () => {
      // Arrange
      const folderName = "New Project";
      const mockResponse = createMockFolderCreateResponse(folderName);
      noteService.createFolder.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useCreateFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(folderName);
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.createFolder).toHaveBeenCalledWith(folderName);
      expect(result.current.data).toEqual({
        folder: folderName,
        welcomeNote: mockResponse.data.note,
      });
    });

    it("should handle folder creation errors", async () => {
      // Arrange
      const folderName = "";
      const error = createErrorResponse("Folder name is required");
      noteService.createFolder.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useCreateFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(folderName);
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });

    it("should handle duplicate folder errors", async () => {
      // Arrange
      const folderName = "Work";
      const error = createErrorResponse("Folder already exists");
      noteService.createFolder.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useCreateFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(folderName);
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  describe("useDeleteFolderMutation", () => {
    it("should delete a folder successfully", async () => {
      // Arrange
      const folderName = "Old Project";
      const mockResponse = createMockFolderDeleteResponse(folderName);
      noteService.deleteFolder.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useDeleteFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(folderName);
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.deleteFolder).toHaveBeenCalledWith(folderName);
      expect(result.current.data).toEqual({
        folderName,
        message: mockResponse.data.message,
      });
    });

    it("should handle folder deletion errors", async () => {
      // Arrange
      const folderName = "Nonexistent Folder";
      const error = createErrorResponse("Folder not found", 404);
      noteService.deleteFolder.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useDeleteFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(folderName);
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });

    it("should handle protected folder errors", async () => {
      // Arrange
      const folderName = "General";
      const error = createErrorResponse("Cannot delete the General folder");
      noteService.deleteFolder.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useDeleteFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(folderName);
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  describe("useRenameFolderMutation", () => {
    it("should rename a folder successfully", async () => {
      // Arrange
      const oldName = "Old Name";
      const newName = "New Name";
      const mockResponse = createMockFolderRenameResponse(oldName, newName);
      noteService.renameFolder.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useRenameFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ oldName, newName });
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(noteService.renameFolder).toHaveBeenCalledWith(oldName, newName);
      expect(result.current.data).toEqual({
        oldName,
        newName,
        message: mockResponse.data.message,
      });
    });

    it("should handle folder rename errors", async () => {
      // Arrange
      const oldName = "Nonexistent";
      const newName = "New Name";
      const error = createErrorResponse("Folder not found", 404);
      noteService.renameFolder.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useRenameFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ oldName, newName });
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });

    it("should handle protected folder errors", async () => {
      // Arrange
      const oldName = "General";
      const newName = "New General";
      const error = createErrorResponse("Cannot rename the General folder");
      noteService.renameFolder.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useRenameFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ oldName, newName });
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });

    it("should handle duplicate folder name errors", async () => {
      // Arrange
      const oldName = "Project A";
      const newName = "Work";
      const error = createErrorResponse(
        "A folder with this name already exists"
      );
      noteService.renameFolder.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useRenameFolderMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ oldName, newName });
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });
});
