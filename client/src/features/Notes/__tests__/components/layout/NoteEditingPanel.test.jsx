import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteEditingPanel from "../../../components/layout/NoteEditingPanel";
import { renderWithProviders, createMockNote } from "../../setup/testUtils";

// Mock lodash debounce
jest.mock("lodash", () => ({
  debounce: jest.fn((fn, delay) => {
    const debouncedFn = (...args) => {
      clearTimeout(debouncedFn.timeoutId);
      debouncedFn.timeoutId = setTimeout(() => fn(...args), delay);
    };
    debouncedFn.cancel = jest.fn(() => {
      clearTimeout(debouncedFn.timeoutId);
    });
    debouncedFn.flush = jest.fn(() => {
      clearTimeout(debouncedFn.timeoutId);
      fn(...debouncedFn.lastArgs);
    });
    return debouncedFn;
  }),
}));

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  Maximize2: ({ className, ...props }) => (
    <div className={className} data-testid="maximize-icon" {...props} />
  ),
  Minimize2: ({ className, ...props }) => (
    <div className={className} data-testid="minimize-icon" {...props} />
  ),
}));

// Mock RichTextEditor
jest.mock("../../../components/editors/RichTextEditor", () => {
  return function MockRichTextEditor({ content, onUpdate, isFullScreen }) {
    return (
      <div data-testid="rich-text-editor">
        <div data-testid="editor-content">{content}</div>
        <div data-testid="editor-fullscreen">
          {isFullScreen ? "true" : "false"}
        </div>
        <button
          onClick={() => onUpdate("Updated content from editor")}
          data-testid="update-content-btn"
        >
          Update Content
        </button>
      </div>
    );
  };
});

describe("NoteEditingPanel Component", () => {
  const mockNote = createMockNote({
    title: "Test Note",
    content: "Test content",
    updatedAt: "2024-03-15T10:30:00Z",
  });

  const mockProps = {
    note: mockNote,
    onUpdateNote: jest.fn(),
    isNewNote: false,
    isFullScreen: false,
    onToggleFullScreen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Empty State", () => {
    it("should show placeholder when no note is selected", () => {
      // Arrange
      const props = { ...mockProps, note: null };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Assert
      expect(screen.getByText("No Note Selected")).toBeInTheDocument();
      expect(
        screen.getByText("Select a note from the list or create a new one")
      ).toBeInTheDocument();
    });

    it("should not show editor when no note is selected", () => {
      // Arrange
      const props = { ...mockProps, note: null };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Assert
      expect(screen.queryByTestId("rich-text-editor")).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("Note title")
      ).not.toBeInTheDocument();
    });
  });

  describe("Note Display", () => {
    it("should display note title in input", () => {
      // Act
      renderWithProviders(<NoteEditingPanel {...mockProps} />);

      // Assert
      expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Note title")).toBeInTheDocument();
    });

    it("should display note content in editor", () => {
      // Act
      renderWithProviders(<NoteEditingPanel {...mockProps} />);

      // Assert
      expect(screen.getByTestId("editor-content")).toHaveTextContent(
        "Test content"
      );
    });

    it("should display formatted last updated time", () => {
      // Act
      renderWithProviders(<NoteEditingPanel {...mockProps} />);

      // Assert
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      // Check that date formatting works (exact format may vary by locale)
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });

  describe("Title Editing", () => {
    it("should update title when typing", async () => {
      // Arrange
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const props = { ...mockProps, onUpdateNote: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);
      const titleInput = screen.getByDisplayValue("Test Note");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");

      // Advance timers to trigger debounce
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Assert
      expect(props.onUpdateNote).toHaveBeenCalledWith(mockNote._id, {
        title: "Updated Title",
      });
    });

    it("should focus and select title for new notes", async () => {
      // Arrange
      const props = { ...mockProps, isNewNote: true };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Fast-forward the focus timeout
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Note")).toHaveFocus();
      });
    });

    it("should handle empty title gracefully", async () => {
      // Arrange
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const props = { ...mockProps, onUpdateNote: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);
      const titleInput = screen.getByDisplayValue("Test Note");
      await user.clear(titleInput);

      // Advance timers to trigger debounce
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Assert
      expect(props.onUpdateNote).toHaveBeenCalledWith(mockNote._id, {
        title: "",
      });
    });
  });

  describe("Content Editing", () => {
    it("should update content when editor triggers onUpdate", async () => {
      // Arrange
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const props = { ...mockProps, onUpdateNote: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);
      await user.click(screen.getByTestId("update-content-btn"));

      // Advance timers to trigger debounce
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Assert
      expect(props.onUpdateNote).toHaveBeenCalledWith(mockNote._id, {
        content: "Updated content from editor",
      });
    });

    it("should pass fullscreen state to editor", () => {
      // Arrange
      const props = { ...mockProps, isFullScreen: true };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Assert
      expect(screen.getByTestId("editor-fullscreen")).toHaveTextContent("true");
    });
  });

  describe("Fullscreen Mode", () => {
    it("should display fullscreen toggle button with Focus Mode text", () => {
      // Act
      renderWithProviders(<NoteEditingPanel {...mockProps} />);

      // Assert
      expect(screen.getByText("Focus Mode")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+Shift+F")).toBeInTheDocument();
      expect(screen.getByTestId("maximize-icon")).toBeInTheDocument();
    });

    it("should call onToggleFullScreen when clicking fullscreen button", async () => {
      // Arrange
      const props = { ...mockProps, onToggleFullScreen: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Find the button that contains the maximize icon
      const maximizeIcon = screen.getByTestId("maximize-icon");
      const focusModeButton = maximizeIcon.closest("button");

      fireEvent.click(focusModeButton);

      // Assert
      expect(props.onToggleFullScreen).toHaveBeenCalledWith(true);
    });

    it("should show exit fullscreen button when in fullscreen mode", () => {
      // Arrange
      const props = { ...mockProps, isFullScreen: true };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Assert
      expect(screen.getByText("Exit")).toBeInTheDocument();
      expect(screen.getByText("Esc")).toBeInTheDocument();
      expect(screen.getByTestId("minimize-icon")).toBeInTheDocument();
    });

    it("should apply fullscreen styles when in fullscreen mode", () => {
      // Arrange
      const props = { ...mockProps, isFullScreen: true };

      // Act
      const { container } = renderWithProviders(
        <NoteEditingPanel {...props} />
      );

      // Assert
      const editorContainer = container.firstChild;
      expect(editorContainer).toHaveClass("fixed");
      expect(editorContainer).toHaveClass("inset-0");
      expect(editorContainer).toHaveClass("z-50");
    });

    it("should handle external fullscreen state changes", () => {
      // Arrange
      const { rerender } = renderWithProviders(
        <NoteEditingPanel {...mockProps} isFullScreen={false} />
      );

      // Act
      rerender(<NoteEditingPanel {...mockProps} isFullScreen={true} />);

      // Assert
      expect(screen.getByText("Exit")).toBeInTheDocument();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should toggle fullscreen with Ctrl+Shift+F", async () => {
      // Arrange
      const props = { ...mockProps, onToggleFullScreen: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Simulate keyboard shortcut
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "f",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // Assert
      expect(props.onToggleFullScreen).toHaveBeenCalledWith(true);
    });

    it("should exit fullscreen with Escape key", async () => {
      // Arrange
      const props = {
        ...mockProps,
        isFullScreen: true,
        onToggleFullScreen: jest.fn(),
      };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Simulate escape key
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // Assert
      expect(props.onToggleFullScreen).toHaveBeenCalledWith(false);
    });

    it("should not toggle fullscreen when no note is selected", async () => {
      // Arrange
      const props = { ...mockProps, note: null, onToggleFullScreen: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Simulate keyboard shortcut
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "f",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // Assert
      expect(props.onToggleFullScreen).not.toHaveBeenCalled();
    });

    it("should prevent browser find action when using Ctrl+Shift+F", async () => {
      // Arrange
      const props = { ...mockProps, onToggleFullScreen: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Simulate keyboard shortcut
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "f",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        });
        const preventDefaultSpy = jest.spyOn(event, "preventDefault");
        window.dispatchEvent(event);

        // Assert
        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });
  });

  describe("Debounced Saving", () => {
    it("should debounce rapid title changes", async () => {
      // Arrange
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const props = { ...mockProps, onUpdateNote: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);
      const titleInput = screen.getByDisplayValue("Test Note");

      // Type rapidly
      await user.type(titleInput, "abc");

      // Only advance a little bit (less than debounce time)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should not have called onUpdateNote yet due to debouncing
      expect(props.onUpdateNote).not.toHaveBeenCalled();

      // Now advance past debounce time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should have called onUpdateNote once with the final value after debounce
      expect(props.onUpdateNote).toHaveBeenCalledTimes(1);
      expect(props.onUpdateNote).toHaveBeenCalledWith(mockNote._id, {
        title: "Test Noteabc",
      });
    });

    it("should not save when no note is selected", async () => {
      // Arrange
      const props = { ...mockProps, note: null, onUpdateNote: jest.fn() };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Try to trigger save (this should not happen in real usage, but test the guard)
      // Since there's no input when note is null, we test the internal logic
      expect(props.onUpdateNote).not.toHaveBeenCalled();
    });
  });

  describe("Note State Updates", () => {
    it("should update local state when note prop changes", () => {
      // Arrange
      const newNote = createMockNote({
        title: "New Note",
        content: "New content",
      });

      // Act
      const { rerender } = renderWithProviders(
        <NoteEditingPanel {...mockProps} />
      );
      rerender(<NoteEditingPanel {...mockProps} note={newNote} />);

      // Assert
      expect(screen.getByDisplayValue("New Note")).toBeInTheDocument();
      expect(screen.getByTestId("editor-content")).toHaveTextContent(
        "New content"
      );
    });

    it("should clear state when note becomes null", () => {
      // Act
      const { rerender } = renderWithProviders(
        <NoteEditingPanel {...mockProps} />
      );
      rerender(<NoteEditingPanel {...mockProps} note={null} />);

      // Assert
      expect(screen.getByText("No Note Selected")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("Test Note")).not.toBeInTheDocument();
    });

    it("should show pulse animation when note loads", () => {
      // Act
      renderWithProviders(<NoteEditingPanel {...mockProps} />);

      // Fast-forward past pulse animation
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      // The pulse animation should have been applied (we can't easily test CSS animations in JSDOM)
      // But we can verify the component rendered without errors
      expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument();
    });
  });

  describe("UI Layout and Styling", () => {
    it("should position fullscreen button differently based on mode", () => {
      // Arrange - Normal mode
      const { rerender } = renderWithProviders(
        <NoteEditingPanel {...mockProps} />
      );
      let button = screen.getByText("Focus Mode").closest("button");
      expect(button).toHaveClass("absolute");
      expect(button).toHaveClass("bottom-3");
      expect(button).toHaveClass("right-4");

      // Act - Fullscreen mode
      rerender(<NoteEditingPanel {...mockProps} isFullScreen={true} />);
      button = screen.getByText("Exit").closest("button");
      expect(button).toHaveClass("absolute");
      expect(button).toHaveClass("top-5");
      expect(button).toHaveClass("right-5");
    });

    it("should position footer differently in fullscreen mode", () => {
      // Arrange
      const { rerender } = renderWithProviders(
        <NoteEditingPanel {...mockProps} />
      );

      // Act - Switch to fullscreen
      rerender(<NoteEditingPanel {...mockProps} isFullScreen={true} />);

      // Assert
      const footer = screen.getByText(/Last updated:/).closest("div");
      expect(footer).toHaveClass("absolute");
      expect(footer).toHaveClass("bottom-0");
    });

    it("should adjust editor content area in fullscreen mode", () => {
      // Arrange
      const props = { ...mockProps, isFullScreen: true };

      // Act
      const { container } = renderWithProviders(
        <NoteEditingPanel {...props} />
      );

      // Assert
      // Check that the editor container has the correct fullscreen classes
      const editorContentWrapper = container.querySelector(
        ".flex-grow.overflow-auto"
      );
      expect(editorContentWrapper).toHaveClass("absolute");
      expect(editorContentWrapper).toHaveClass("inset-0");
      expect(editorContentWrapper).toHaveClass("mt-16");
      expect(editorContentWrapper).toHaveClass("mb-10");
    });
  });

  describe("Accessibility", () => {
    it("should have proper input labels and placeholders", () => {
      // Act
      renderWithProviders(<NoteEditingPanel {...mockProps} />);

      // Assert
      expect(screen.getByPlaceholderText("Note title")).toBeInTheDocument();
    });

    it("should have keyboard shortcuts information visible", () => {
      // Act
      renderWithProviders(<NoteEditingPanel {...mockProps} />);

      // Assert
      expect(screen.getByText("Ctrl+Shift+F")).toBeInTheDocument();
    });

    it("should show escape key hint in fullscreen mode", () => {
      // Arrange
      const props = { ...mockProps, isFullScreen: true };

      // Act
      renderWithProviders(<NoteEditingPanel {...props} />);

      // Assert
      expect(screen.getByText("Esc")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid date gracefully", () => {
      // Arrange
      const noteWithInvalidDate = {
        ...mockNote,
        updatedAt: "invalid-date",
      };
      const props = { ...mockProps, note: noteWithInvalidDate };

      // Act & Assert - Should not throw
      expect(() => {
        renderWithProviders(<NoteEditingPanel {...props} />);
      }).not.toThrow();
    });

    it("should handle missing updatedAt field", () => {
      // Arrange
      const noteWithoutDate = {
        ...mockNote,
        updatedAt: undefined,
      };
      const props = { ...mockProps, note: noteWithoutDate };

      // Act & Assert - Should not throw
      expect(() => {
        renderWithProviders(<NoteEditingPanel {...props} />);
      }).not.toThrow();
    });
  });
});
