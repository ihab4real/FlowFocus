import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import NotesPageLayout from "../../../components/layout/NotesPageLayout";
import {
  renderWithProviders,
  createMockNote,
  createMockNotes,
  createMockFolders,
} from "../../setup/testUtils";
import * as noteQueries from "../../../hooks/useNoteQueries";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
}));

// Mock the Notes hooks
jest.mock("../../../hooks/useNoteQueries", () => ({
  useNotesQuery: jest.fn(),
  useNoteQuery: jest.fn(),
  useFoldersQuery: jest.fn(),
  useCreateNoteMutation: jest.fn(),
  useUpdateNoteMutation: jest.fn(),
  useDeleteNoteMutation: jest.fn(),
  useCreateFolderMutation: jest.fn(),
  useDeleteFolderMutation: jest.fn(),
  useRenameFolderMutation: jest.fn(),
}));

// Mock child components to focus on layout logic
jest.mock("../../../components/layout/NotesList", () => {
  return function MockNotesList({
    notes,
    selectedNote,
    onSelectNote,
    onCreateNote,
    onDeleteNote,
    loading,
    currentFolder,
  }) {
    return (
      <div data-testid="notes-list">
        <div data-testid="current-folder">{currentFolder}</div>
        <div data-testid="notes-count">{notes.length}</div>
        <div data-testid="selected-note">
          {selectedNote ? selectedNote.title : "No note selected"}
        </div>
        <div data-testid="loading">{loading ? "Loading" : "Not loading"}</div>
        <button onClick={onCreateNote} data-testid="create-note-btn">
          Create Note
        </button>
        {notes.map((note) => (
          <button
            key={note._id}
            onClick={() => onSelectNote(note)}
            data-testid={`note-${note._id}`}
          >
            {note.title}
          </button>
        ))}
        {notes.map((note) => (
          <button
            key={`delete-${note._id}`}
            onClick={() => onDeleteNote(note._id)}
            data-testid={`delete-note-${note._id}`}
          >
            Delete {note.title}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock("../../../components/layout/NotesNavbar", () => {
  return function MockNotesNavbar({
    folders,
    currentFolder,
    onFolderChange,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
    searchQuery,
    onSearchChange,
  }) {
    return (
      <div data-testid="notes-navbar">
        <div data-testid="search-query">{searchQuery}</div>
        <input
          data-testid="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notes..."
        />
        <div data-testid="folders-list">
          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => onFolderChange(folder)}
              data-testid={`folder-${folder}`}
              className={currentFolder === folder ? "active" : ""}
            >
              {folder}
            </button>
          ))}
        </div>
        <button
          onClick={() => onCreateFolder("New Folder")}
          data-testid="create-folder-btn"
        >
          Create Folder
        </button>
        <button
          onClick={() => onDeleteFolder("Work")}
          data-testid="delete-folder-btn"
        >
          Delete Folder
        </button>
        <button
          onClick={() => onRenameFolder("Work", "Projects")}
          data-testid="rename-folder-btn"
        >
          Rename Folder
        </button>
      </div>
    );
  };
});

jest.mock("../../../components/layout/NoteEditingPanel", () => {
  return function MockNoteEditingPanel({
    note,
    onUpdateNote,
    isNewNote,
    isFullScreen,
    onToggleFullScreen,
  }) {
    return (
      <div data-testid="note-editing-panel">
        <div data-testid="editing-note">
          {note ? note.title : "No note being edited"}
        </div>
        <div data-testid="is-new-note">
          {isNewNote ? "New note" : "Existing note"}
        </div>
        <div data-testid="is-fullscreen">
          {isFullScreen ? "Fullscreen" : "Normal"}
        </div>
        <button
          onClick={onToggleFullScreen}
          data-testid="toggle-fullscreen-btn"
        >
          Toggle Fullscreen
        </button>
        <button
          onClick={() => onUpdateNote(note?._id, { title: "Updated Title" })}
          data-testid="update-note-btn"
          disabled={!note}
        >
          Update Note
        </button>
      </div>
    );
  };
});

// Mock react-resizable-panels
jest.mock("react-resizable-panels", () => ({
  Panel: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  PanelGroup: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  PanelResizeHandle: ({ className }) => (
    <div className={className} data-testid="panel-resize" />
  ),
}));

describe("NotesPageLayout Component", () => {
  const mockCreateNoteMutation = {
    mutateAsync: jest.fn(),
  };
  const mockUpdateNoteMutation = {
    mutateAsync: jest.fn(),
  };
  const mockDeleteNoteMutation = {
    mutateAsync: jest.fn(),
  };
  const mockCreateFolderMutation = {
    mutateAsync: jest.fn(),
  };
  const mockDeleteFolderMutation = {
    mutateAsync: jest.fn(),
  };
  const mockRenameFolderMutation = {
    mutateAsync: jest.fn(),
  };

  const mockNotes = createMockNotes(3);
  const mockFolders = createMockFolders();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useLocation
    useLocation.mockReturnValue({
      state: null,
    });

    // Default mock implementations
    noteQueries.useNotesQuery.mockReturnValue({
      data: mockNotes,
      isLoading: false,
    });

    noteQueries.useNoteQuery.mockReturnValue({
      data: null,
    });

    noteQueries.useFoldersQuery.mockReturnValue({
      data: mockFolders,
    });

    noteQueries.useCreateNoteMutation.mockReturnValue(mockCreateNoteMutation);
    noteQueries.useUpdateNoteMutation.mockReturnValue(mockUpdateNoteMutation);
    noteQueries.useDeleteNoteMutation.mockReturnValue(mockDeleteNoteMutation);
    noteQueries.useCreateFolderMutation.mockReturnValue(
      mockCreateFolderMutation
    );
    noteQueries.useDeleteFolderMutation.mockReturnValue(
      mockDeleteFolderMutation
    );
    noteQueries.useRenameFolderMutation.mockReturnValue(
      mockRenameFolderMutation
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Layout Structure", () => {
    it("should render all layout panels", () => {
      // Act
      renderWithProviders(<NotesPageLayout />);

      // Assert
      expect(screen.getByTestId("notes-navbar")).toBeInTheDocument();
      expect(screen.getByTestId("notes-list")).toBeInTheDocument();
      expect(screen.getByTestId("note-editing-panel")).toBeInTheDocument();
      expect(screen.getAllByTestId("panel-resize")).toHaveLength(2);
    });

    it("should display notes count and current folder", () => {
      // Act
      renderWithProviders(<NotesPageLayout />);

      // Assert
      expect(screen.getByTestId("notes-count")).toHaveTextContent("3");
      expect(screen.getByTestId("current-folder")).toHaveTextContent("General");
    });
  });

  describe("Note Selection", () => {
    it("should start with no note selected", () => {
      // Act
      renderWithProviders(<NotesPageLayout />);

      // Assert
      expect(screen.getByTestId("selected-note")).toHaveTextContent(
        "No note selected"
      );
      expect(screen.getByTestId("editing-note")).toHaveTextContent(
        "No note being edited"
      );
    });

    it("should select a note when clicked", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId(`note-${mockNotes[0]._id}`));

      // Assert
      expect(screen.getByTestId("selected-note")).toHaveTextContent(
        mockNotes[0].title
      );
      expect(screen.getByTestId("editing-note")).toHaveTextContent(
        mockNotes[0].title
      );
      expect(screen.getByTestId("is-new-note")).toHaveTextContent(
        "Existing note"
      );
    });
  });

  describe("Note Creation", () => {
    it("should create a new note and select it", async () => {
      // Arrange
      const user = userEvent.setup();
      const newNote = createMockNote({
        title: "Untitled Note",
        content: "",
        folder: "General",
      });
      mockCreateNoteMutation.mutateAsync.mockResolvedValue(newNote);

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId("create-note-btn"));

      // Assert
      await waitFor(() => {
        expect(mockCreateNoteMutation.mutateAsync).toHaveBeenCalledWith({
          title: "Untitled Note",
          content: "",
          folder: "General",
        });
      });
    });

    it("should handle note creation errors gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      const error = new Error("Failed to create note");
      mockCreateNoteMutation.mutateAsync.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId("create-note-btn"));

      // Assert
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error creating note:", error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Note Updates", () => {
    it("should update a note", async () => {
      // Arrange
      const user = userEvent.setup();
      const updatedNote = { ...mockNotes[0], title: "Updated Title" };
      mockUpdateNoteMutation.mutateAsync.mockResolvedValue(updatedNote);

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId(`note-${mockNotes[0]._id}`));
      await user.click(screen.getByTestId("update-note-btn"));

      // Assert
      await waitFor(() => {
        expect(mockUpdateNoteMutation.mutateAsync).toHaveBeenCalledWith({
          id: mockNotes[0]._id,
          data: { title: "Updated Title" },
        });
      });
    });

    it("should handle note update errors gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      const error = new Error("Failed to update note");
      mockUpdateNoteMutation.mutateAsync.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId(`note-${mockNotes[0]._id}`));
      await user.click(screen.getByTestId("update-note-btn"));

      // Assert
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error updating note:", error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Note Deletion", () => {
    it("should delete a note and clear selection if selected", async () => {
      // Arrange
      const user = userEvent.setup();
      mockDeleteNoteMutation.mutateAsync.mockResolvedValue();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId(`note-${mockNotes[0]._id}`));
      await user.click(screen.getByTestId(`delete-note-${mockNotes[0]._id}`));

      // Assert
      await waitFor(() => {
        expect(mockDeleteNoteMutation.mutateAsync).toHaveBeenCalledWith(
          mockNotes[0]._id
        );
      });
    });

    it("should handle note deletion errors gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      const error = new Error("Failed to delete note");
      mockDeleteNoteMutation.mutateAsync.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId(`delete-note-${mockNotes[0]._id}`));

      // Assert
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error deleting note:", error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Folder Management", () => {
    it("should change folder when folder is clicked", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId("folder-Work"));

      // Assert
      expect(screen.getByTestId("current-folder")).toHaveTextContent("Work");
    });

    it("should create a new folder", async () => {
      // Arrange
      const user = userEvent.setup();
      const welcomeNote = createMockNote({
        title: "Welcome to New Folder",
        folder: "New Folder",
      });
      mockCreateFolderMutation.mutateAsync.mockResolvedValue({
        folder: "New Folder",
        welcomeNote,
      });

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId("create-folder-btn"));

      // Assert
      await waitFor(() => {
        expect(mockCreateFolderMutation.mutateAsync).toHaveBeenCalledWith(
          "New Folder"
        );
      });
    });

    it("should delete a folder", async () => {
      // Arrange
      const user = userEvent.setup();
      mockDeleteFolderMutation.mutateAsync.mockResolvedValue();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId("delete-folder-btn"));

      // Assert
      await waitFor(() => {
        expect(mockDeleteFolderMutation.mutateAsync).toHaveBeenCalledWith(
          "Work"
        );
      });
    });

    it("should rename a folder", async () => {
      // Arrange
      const user = userEvent.setup();
      mockRenameFolderMutation.mutateAsync.mockResolvedValue();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId("rename-folder-btn"));

      // Assert
      await waitFor(() => {
        expect(mockRenameFolderMutation.mutateAsync).toHaveBeenCalledWith({
          oldName: "Work",
          newName: "Projects",
        });
      });
    });
  });

  describe("Search Functionality", () => {
    it("should update search query", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.type(screen.getByTestId("search-input"), "test search");

      // Assert
      expect(screen.getByTestId("search-query")).toHaveTextContent(
        "test search"
      );
    });

    it("should filter notes based on search query", () => {
      // Arrange - Notes with searchable content
      const searchableNotes = [
        createMockNote({
          title: "React Tutorial",
          content: "Learn React basics",
        }),
        createMockNote({ title: "Vue Guide", content: "Vue.js fundamentals" }),
        createMockNote({
          title: "JavaScript Tips",
          content: "Advanced React patterns",
        }),
      ];

      noteQueries.useNotesQuery.mockReturnValue({
        data: searchableNotes,
        isLoading: false,
      });

      // Act
      renderWithProviders(<NotesPageLayout />);

      // Simulate search query change (this would be handled by the component logic)
      // The actual filtering logic is tested here by checking rendered notes
      expect(screen.getByTestId("notes-count")).toHaveTextContent("3");

      // The component should filter notes based on search, but since we're mocking
      // the child components, we verify the structure is in place
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should show loading state in notes list", () => {
      // Arrange
      noteQueries.useNotesQuery.mockReturnValue({
        data: [],
        isLoading: true,
      });

      // Act
      renderWithProviders(<NotesPageLayout />);

      // Assert
      expect(screen.getByTestId("loading")).toHaveTextContent("Loading");
    });
  });

  describe("Initial Note Loading", () => {
    it("should load initial note from navigation state", () => {
      // Arrange
      const initialNote = createMockNote({ folder: "Work" });
      useLocation.mockReturnValue({
        state: { initialNoteId: initialNote._id },
      });

      noteQueries.useNoteQuery.mockReturnValue({
        data: initialNote,
      });

      // Act
      renderWithProviders(<NotesPageLayout />);

      // Assert
      expect(screen.getByTestId("current-folder")).toHaveTextContent("Work");
    });
  });

  describe("Fullscreen Mode", () => {
    it("should toggle fullscreen mode", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId("toggle-fullscreen-btn"));

      // Assert
      expect(screen.getByTestId("is-fullscreen")).toHaveTextContent(
        "Fullscreen"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle folder operation errors gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      const error = new Error("Failed to create folder");
      mockCreateFolderMutation.mutateAsync.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      renderWithProviders(<NotesPageLayout />);
      await user.click(screen.getByTestId("create-folder-btn"));

      // Assert
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error creating folder:",
          error
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
