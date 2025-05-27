import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import noteService from "../../services/noteService";
import apiClient from "@/services/api/apiClient";
import {
  createMockNote,
  createMockNotesResponse,
  createMockNoteResponse,
  createMockFoldersResponse,
  createMockFolderCreateResponse,
  createMockFolderDeleteResponse,
  createMockFolderRenameResponse,
  createErrorResponse,
} from "../setup/testUtils";

// Mock the API client
jest.mock("@/services/api/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

describe("noteService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Note CRUD Operations", () => {
    describe("getNotes", () => {
      it("should fetch all notes without filters", async () => {
        // Arrange
        const mockResponse = createMockNotesResponse();
        apiClient.get.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.getNotes();

        // Assert
        expect(apiClient.get).toHaveBeenCalledWith("/api/notes", {
          params: {},
        });
        expect(result).toEqual(mockResponse);
      });

      it("should fetch notes with filters", async () => {
        // Arrange
        const filters = { folder: "Work", limit: 10 };
        const mockResponse = createMockNotesResponse();
        apiClient.get.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.getNotes(filters);

        // Assert
        expect(apiClient.get).toHaveBeenCalledWith("/api/notes", {
          params: filters,
        });
        expect(result).toEqual(mockResponse);
      });

      it("should handle API errors when fetching notes", async () => {
        // Arrange
        const error = createErrorResponse("Failed to fetch notes");
        apiClient.get.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.getNotes()).rejects.toThrow(
          "Failed to fetch notes"
        );
        expect(apiClient.get).toHaveBeenCalledWith("/api/notes", {
          params: {},
        });
      });
    });

    describe("getById", () => {
      it("should fetch a single note by ID", async () => {
        // Arrange
        const noteId = "note-123";
        const mockResponse = createMockNoteResponse();
        apiClient.get.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.getById(noteId);

        // Assert
        expect(apiClient.get).toHaveBeenCalledWith(`/api/notes/${noteId}`);
        expect(result).toEqual(mockResponse);
      });

      it("should handle 404 error when note not found", async () => {
        // Arrange
        const noteId = "nonexistent-note";
        const error = createErrorResponse("Note not found", 404);
        apiClient.get.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.getById(noteId)).rejects.toThrow(
          "Note not found"
        );
        expect(apiClient.get).toHaveBeenCalledWith(`/api/notes/${noteId}`);
      });
    });

    describe("create", () => {
      it("should create a new note", async () => {
        // Arrange
        const noteData = {
          title: "New Note",
          content: "Note content",
          folder: "Work",
          tags: ["important"],
        };
        const mockResponse = createMockNoteResponse(createMockNote(noteData));
        apiClient.post.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.create(noteData);

        // Assert
        expect(apiClient.post).toHaveBeenCalledWith("/api/notes", noteData);
        expect(result).toEqual(mockResponse);
      });

      it("should handle validation errors when creating note", async () => {
        // Arrange
        const noteData = { content: "Missing title" };
        const error = createErrorResponse("Title is required", 400);
        apiClient.post.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.create(noteData)).rejects.toThrow(
          "Title is required"
        );
        expect(apiClient.post).toHaveBeenCalledWith("/api/notes", noteData);
      });
    });

    describe("update", () => {
      it("should update an existing note", async () => {
        // Arrange
        const noteId = "note-123";
        const updateData = {
          title: "Updated Title",
          content: "Updated content",
        };
        const mockResponse = createMockNoteResponse(createMockNote(updateData));
        apiClient.patch.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.update(noteId, updateData);

        // Assert
        expect(apiClient.patch).toHaveBeenCalledWith(
          `/api/notes/${noteId}`,
          updateData
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle 404 error when updating nonexistent note", async () => {
        // Arrange
        const noteId = "nonexistent-note";
        const updateData = { title: "Updated Title" };
        const error = createErrorResponse("Note not found", 404);
        apiClient.patch.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.update(noteId, updateData)).rejects.toThrow(
          "Note not found"
        );
        expect(apiClient.patch).toHaveBeenCalledWith(
          `/api/notes/${noteId}`,
          updateData
        );
      });
    });

    describe("delete", () => {
      it("should delete a note", async () => {
        // Arrange
        const noteId = "note-123";
        const mockResponse = { data: { status: "success", data: null } };
        apiClient.delete.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.delete(noteId);

        // Assert
        expect(apiClient.delete).toHaveBeenCalledWith(`/api/notes/${noteId}`);
        expect(result).toEqual(mockResponse);
      });

      it("should handle 404 error when deleting nonexistent note", async () => {
        // Arrange
        const noteId = "nonexistent-note";
        const error = createErrorResponse("Note not found", 404);
        apiClient.delete.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.delete(noteId)).rejects.toThrow(
          "Note not found"
        );
        expect(apiClient.delete).toHaveBeenCalledWith(`/api/notes/${noteId}`);
      });
    });
  });

  describe("Folder Management", () => {
    describe("getFolders", () => {
      it("should fetch all folders", async () => {
        // Arrange
        const mockResponse = createMockFoldersResponse();
        apiClient.get.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.getFolders();

        // Assert
        expect(apiClient.get).toHaveBeenCalledWith("/api/notes/folders");
        expect(result).toEqual(mockResponse);
      });

      it("should handle API errors when fetching folders", async () => {
        // Arrange
        const error = createErrorResponse("Failed to fetch folders");
        apiClient.get.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.getFolders()).rejects.toThrow(
          "Failed to fetch folders"
        );
        expect(apiClient.get).toHaveBeenCalledWith("/api/notes/folders");
      });
    });

    describe("createFolder", () => {
      it("should create a new folder", async () => {
        // Arrange
        const folderName = "New Project";
        const mockResponse = createMockFolderCreateResponse(folderName);
        apiClient.post.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.createFolder(folderName);

        // Assert
        expect(apiClient.post).toHaveBeenCalledWith("/api/notes/folders", {
          name: folderName,
        });
        expect(result).toEqual(mockResponse);
      });

      it("should handle validation errors when creating folder", async () => {
        // Arrange
        const folderName = "";
        const error = createErrorResponse("Folder name is required", 400);
        apiClient.post.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.createFolder(folderName)).rejects.toThrow(
          "Folder name is required"
        );
        expect(apiClient.post).toHaveBeenCalledWith("/api/notes/folders", {
          name: folderName,
        });
      });

      it("should handle duplicate folder errors", async () => {
        // Arrange
        const folderName = "Work";
        const error = createErrorResponse("Folder already exists", 400);
        apiClient.post.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.createFolder(folderName)).rejects.toThrow(
          "Folder already exists"
        );
        expect(apiClient.post).toHaveBeenCalledWith("/api/notes/folders", {
          name: folderName,
        });
      });
    });

    describe("deleteFolder", () => {
      it("should delete a folder", async () => {
        // Arrange
        const folderName = "Old Project";
        const mockResponse = createMockFolderDeleteResponse(folderName);
        apiClient.delete.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.deleteFolder(folderName);

        // Assert
        expect(apiClient.delete).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(folderName)}`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle special characters in folder name", async () => {
        // Arrange
        const folderName = "Project #1 & More";
        const mockResponse = createMockFolderDeleteResponse(folderName);
        apiClient.delete.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.deleteFolder(folderName);

        // Assert
        expect(apiClient.delete).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(folderName)}`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle 404 error when deleting nonexistent folder", async () => {
        // Arrange
        const folderName = "Nonexistent Folder";
        const error = createErrorResponse("Folder not found", 404);
        apiClient.delete.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.deleteFolder(folderName)).rejects.toThrow(
          "Folder not found"
        );
        expect(apiClient.delete).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(folderName)}`
        );
      });

      it("should handle protected folder errors", async () => {
        // Arrange
        const folderName = "General";
        const error = createErrorResponse(
          "Cannot delete the General folder",
          400
        );
        apiClient.delete.mockRejectedValue(error);

        // Act & Assert
        await expect(noteService.deleteFolder(folderName)).rejects.toThrow(
          "Cannot delete the General folder"
        );
        expect(apiClient.delete).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(folderName)}`
        );
      });
    });

    describe("renameFolder", () => {
      it("should rename a folder", async () => {
        // Arrange
        const oldName = "Old Name";
        const newName = "New Name";
        const mockResponse = createMockFolderRenameResponse(oldName, newName);
        apiClient.patch.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.renameFolder(oldName, newName);

        // Assert
        expect(apiClient.patch).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(oldName)}`,
          { name: newName }
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle special characters in folder names", async () => {
        // Arrange
        const oldName = "Project #1";
        const newName = "Project #2 & Updated";
        const mockResponse = createMockFolderRenameResponse(oldName, newName);
        apiClient.patch.mockResolvedValue(mockResponse);

        // Act
        const result = await noteService.renameFolder(oldName, newName);

        // Assert
        expect(apiClient.patch).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(oldName)}`,
          { name: newName }
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle 404 error when renaming nonexistent folder", async () => {
        // Arrange
        const oldName = "Nonexistent";
        const newName = "New Name";
        const error = createErrorResponse("Folder not found", 404);
        apiClient.patch.mockRejectedValue(error);

        // Act & Assert
        await expect(
          noteService.renameFolder(oldName, newName)
        ).rejects.toThrow("Folder not found");
        expect(apiClient.patch).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(oldName)}`,
          { name: newName }
        );
      });

      it("should handle protected folder errors", async () => {
        // Arrange
        const oldName = "General";
        const newName = "New General";
        const error = createErrorResponse(
          "Cannot rename the General folder",
          400
        );
        apiClient.patch.mockRejectedValue(error);

        // Act & Assert
        await expect(
          noteService.renameFolder(oldName, newName)
        ).rejects.toThrow("Cannot rename the General folder");
        expect(apiClient.patch).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(oldName)}`,
          { name: newName }
        );
      });

      it("should handle duplicate folder name errors", async () => {
        // Arrange
        const oldName = "Project A";
        const newName = "Work"; // Assuming Work folder already exists
        const error = createErrorResponse(
          "A folder with this name already exists",
          400
        );
        apiClient.patch.mockRejectedValue(error);

        // Act & Assert
        await expect(
          noteService.renameFolder(oldName, newName)
        ).rejects.toThrow("A folder with this name already exists");
        expect(apiClient.patch).toHaveBeenCalledWith(
          `/api/notes/folders/${encodeURIComponent(oldName)}`,
          { name: newName }
        );
      });
    });
  });
});
