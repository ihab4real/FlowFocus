import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotesList from "../../../components/layout/NotesList";
import {
  renderWithProviders,
  createMockNote,
  createMockNotes,
} from "../../setup/testUtils";

// Mock date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date, formatStr) => "Mar 15, 2024"),
}));

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  PlusIcon: ({ className, ...props }) => (
    <div className={className} data-testid="plus-icon" {...props} />
  ),
  Trash2Icon: ({ className, ...props }) => (
    <div className={className} data-testid="trash-icon" {...props} />
  ),
  FolderIcon: ({ className, ...props }) => (
    <div className={className} data-testid="folder-icon" {...props} />
  ),
}));

describe("NotesList Component", () => {
  const mockProps = {
    notes: [],
    selectedNote: null,
    onSelectNote: jest.fn(),
    onCreateNote: jest.fn(),
    onDeleteNote: jest.fn(),
    loading: false,
    currentFolder: "General",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render the component with header", () => {
      // Act
      renderWithProviders(<NotesList {...mockProps} />);

      // Assert
      expect(screen.getByTestId("folder-icon")).toBeInTheDocument();
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
      expect(screen.getByLabelText("Create note")).toBeInTheDocument();
    });

    it("should display current folder name", () => {
      // Arrange
      const props = { ...mockProps, currentFolder: "Work" };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    it("should fallback to 'Notes' when no folder is provided", () => {
      // Arrange
      const props = { ...mockProps, currentFolder: null };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      expect(screen.getByText("Notes")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when loading is true", () => {
      // Arrange
      const props = { ...mockProps, loading: true };

      // Act
      const { container } = renderWithProviders(<NotesList {...props} />);

      // Assert
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("rounded-full");
      expect(spinner).toHaveClass("border-t-2");
    });

    it("should not show loading spinner when loading is false", () => {
      // Act
      const { container } = renderWithProviders(<NotesList {...mockProps} />);

      // Assert
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no notes exist", () => {
      // Act
      renderWithProviders(<NotesList {...mockProps} />);

      // Assert
      expect(screen.getByText("No notes in this folder")).toBeInTheDocument();
      expect(screen.getByText("Create one now")).toBeInTheDocument();
    });

    it("should call onCreateNote when clicking empty state button", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onCreateNote: jest.fn() };

      // Act
      renderWithProviders(<NotesList {...props} />);
      await user.click(screen.getByText("Create one now"));

      // Assert
      expect(props.onCreateNote).toHaveBeenCalledTimes(1);
    });
  });

  describe("Notes Display", () => {
    const mockNotes = createMockNotes(3);

    it("should display all notes in the list", () => {
      // Arrange
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      mockNotes.forEach((note) => {
        expect(screen.getByText(note.title)).toBeInTheDocument();
      });
    });

    it("should format and display note content preview", () => {
      // Arrange
      const noteWithHtml = createMockNote({
        title: "Test Note",
        content:
          "<p>This is <strong>bold</strong> text with <em>emphasis</em></p>",
      });
      const props = { ...mockProps, notes: [noteWithHtml] };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      // HTML tags should be stripped from preview
      expect(
        screen.getByText(/This is bold text with emphasis/)
      ).toBeInTheDocument();
    });

    it("should truncate long content in preview", () => {
      // Arrange
      const longContent = "A".repeat(150); // More than 100 characters
      const noteWithLongContent = createMockNote({
        title: "Long Note",
        content: longContent,
      });
      const props = { ...mockProps, notes: [noteWithLongContent] };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      const preview = screen.getByText(/A{100}\.\.\./); // 100 A's followed by ...
      expect(preview).toBeInTheDocument();
    });

    it("should display formatted creation date", () => {
      // Arrange
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      expect(screen.getAllByText("Mar 15, 2024")).toHaveLength(3);
    });
  });

  describe("Note Selection", () => {
    const mockNotes = createMockNotes(3);

    it("should highlight selected note", () => {
      // Arrange
      const props = {
        ...mockProps,
        notes: mockNotes,
        selectedNote: mockNotes[0],
      };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      const selectedNoteElement = screen
        .getByText(mockNotes[0].title)
        .closest("div").parentElement;
      expect(selectedNoteElement).toHaveClass("bg-primary/10");
      expect(selectedNoteElement).toHaveClass("border-l-4");
      expect(selectedNoteElement).toHaveClass("border-primary");
    });

    it("should not highlight non-selected notes", () => {
      // Arrange
      const props = {
        ...mockProps,
        notes: mockNotes,
        selectedNote: mockNotes[0],
      };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      const nonSelectedNote = screen
        .getByText(mockNotes[1].title)
        .closest("div").parentElement;
      expect(nonSelectedNote).toHaveClass("border-transparent");
      expect(nonSelectedNote).not.toHaveClass("bg-primary/10");
    });

    it("should call onSelectNote when clicking a note", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        ...mockProps,
        notes: mockNotes,
        onSelectNote: jest.fn(),
      };

      // Act
      renderWithProviders(<NotesList {...props} />);
      await user.click(screen.getByText(mockNotes[0].title));

      // Assert
      expect(props.onSelectNote).toHaveBeenCalledWith(mockNotes[0]);
    });
  });

  describe("Note Creation", () => {
    it("should call onCreateNote when clicking create button in header", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onCreateNote: jest.fn() };

      // Act
      renderWithProviders(<NotesList {...props} />);
      await user.click(screen.getByLabelText("Create note"));

      // Assert
      expect(props.onCreateNote).toHaveBeenCalledTimes(1);
    });
  });

  describe("Note Deletion", () => {
    const mockNotes = createMockNotes(2);

    it("should show delete button for each note", () => {
      // Arrange
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      const deleteButtons = screen.getAllByLabelText("Delete note");
      expect(deleteButtons).toHaveLength(2);
    });

    it("should open confirmation dialog when clicking delete button", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);
      await user.click(screen.getAllByLabelText("Delete note")[0]);

      // Assert
      expect(screen.getByText("Delete Note")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `Are you sure you want to delete "${mockNotes[0].title}"? This action cannot be undone.`
        )
      ).toBeInTheDocument();
    });

    it("should close dialog when clicking cancel", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);
      await user.click(screen.getAllByLabelText("Delete note")[0]);
      await user.click(screen.getByText("Cancel"));

      // Assert
      expect(screen.queryByText("Delete Note")).not.toBeInTheDocument();
    });

    it("should call onDeleteNote when confirming deletion", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, notes: mockNotes, onDeleteNote: jest.fn() };

      // Act
      renderWithProviders(<NotesList {...props} />);
      await user.click(screen.getAllByLabelText("Delete note")[0]);
      await user.click(screen.getByRole("button", { name: "Delete" }));

      // Assert
      expect(props.onDeleteNote).toHaveBeenCalledWith(mockNotes[0]._id);
    });

    it("should not propagate click event from delete button to note selection", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        ...mockProps,
        notes: mockNotes,
        onSelectNote: jest.fn(),
      };

      // Act
      renderWithProviders(<NotesList {...props} />);
      await user.click(screen.getAllByLabelText("Delete note")[0]);

      // Assert
      expect(props.onSelectNote).not.toHaveBeenCalled();
    });
  });

  describe("Content Formatting", () => {
    it("should handle empty content gracefully", () => {
      // Arrange
      const noteWithEmptyContent = createMockNote({
        title: "Empty Note",
        content: "",
      });
      const props = { ...mockProps, notes: [noteWithEmptyContent] };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      expect(screen.getByText("Empty Note")).toBeInTheDocument();
      // Empty content should not cause errors
    });

    it("should handle content with only HTML tags", () => {
      // Arrange
      const noteWithOnlyHtml = createMockNote({
        title: "HTML Only",
        content: "<div><span></span></div>",
      });
      const props = { ...mockProps, notes: [noteWithOnlyHtml] };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      expect(screen.getByText("HTML Only")).toBeInTheDocument();
      // Should handle HTML-only content without displaying anything
    });

    it("should handle special characters in content", () => {
      // Arrange
      const noteWithSpecialChars = createMockNote({
        title: "Special Characters",
        content: "Special chars: & < > \" ' / \\",
      });
      const props = { ...mockProps, notes: [noteWithSpecialChars] };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      expect(screen.getByText(/Special chars:/)).toBeInTheDocument();
    });
  });

  describe("UI States and Interactions", () => {
    const mockNotes = createMockNotes(1);

    it("should apply hover effects on note items", () => {
      // Arrange
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      const noteItem = screen
        .getByText(mockNotes[0].title)
        .closest("div").parentElement;
      expect(noteItem).toHaveClass("hover:bg-primary/5");
      expect(noteItem).toHaveClass("hover:scale-[1.02]");
    });

    it("should apply active scale effect on note items", () => {
      // Arrange
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      const noteItem = screen
        .getByText(mockNotes[0].title)
        .closest("div").parentElement;
      expect(noteItem).toHaveClass("active:scale-[0.98]");
    });

    it("should show proper opacity states for delete button", () => {
      // Arrange
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      const deleteButton = screen.getByLabelText("Delete note");
      expect(deleteButton).toHaveClass("opacity-70");
      expect(deleteButton).toHaveClass("hover:opacity-100");
    });
  });

  describe("Accessibility", () => {
    const mockNotes = createMockNotes(2);

    it("should have proper ARIA labels for interactive elements", () => {
      // Arrange
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      expect(screen.getByLabelText("Create note")).toBeInTheDocument();
      expect(screen.getAllByLabelText("Delete note")).toHaveLength(2);
    });

    it("should have proper button roles", () => {
      // Arrange
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);

      // Assert
      expect(
        screen.getByRole("button", { name: /Create note/i })
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: /Delete note/i })
      ).toHaveLength(2);
    });

    it("should have proper dialog roles in delete confirmation", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, notes: mockNotes };

      // Act
      renderWithProviders(<NotesList {...props} />);
      await user.click(screen.getAllByLabelText("Delete note")[0]);

      // Assert
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Delete" })
      ).toBeInTheDocument();
    });
  });
});
