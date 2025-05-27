import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { render, screen } from "@testing-library/react";
import DashboardNoteEditor from "../../../components/editors/DashboardNoteEditor";

// Mock @tiptap/react
const mockEditor = {
  getHTML: jest.fn(),
  commands: {
    setContent: jest.fn(),
  },
};

const mockUseEditor = jest.fn();

jest.mock("@tiptap/react", () => ({
  useEditor: (...args) => mockUseEditor(...args),
  EditorContent: ({ editor, className }) => (
    <div
      data-testid="editor-content"
      className={className}
      data-editor-active={!!editor}
    >
      {editor ? "Editor Active" : "No Editor"}
    </div>
  ),
}));

// Mock TipTap extensions
jest.mock("@tiptap/starter-kit", () => ({
  __esModule: true,
  default: "StarterKit",
}));

jest.mock("@tiptap/extension-placeholder", () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => "Placeholder"),
  },
}));

jest.mock("@tiptap/extension-underline", () => ({
  __esModule: true,
  default: "Underline",
}));

describe("DashboardNoteEditor Component", () => {
  const mockOnUpdate = jest.fn();
  const mockOnBlur = jest.fn();
  const mockEditorRef = jest.fn();

  const defaultProps = {
    content: "<p>Initial content</p>",
    onUpdate: mockOnUpdate,
    onBlur: mockOnBlur,
    editorRef: mockEditorRef,
    className: "test-class",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEditor.getHTML.mockReturnValue("<p>Initial content</p>");
    mockUseEditor.mockReturnValue(mockEditor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Editor Initialization", () => {
    it("should initialize TipTap editor with correct extensions", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith({
        extensions: ["StarterKit", "Placeholder", "Underline"],
        content: "<p>Initial content</p>",
        onUpdate: expect.any(Function),
        onBlur: expect.any(Function),
        editorProps: {
          attributes: {
            class:
              "prose dark:prose-invert max-w-none focus:outline-none test-class",
          },
        },
      });
    });

    it("should configure placeholder extension correctly", () => {
      // Arrange
      const PlaceholderMock = jest.requireMock("@tiptap/extension-placeholder");
      const mockConfigure = jest.fn(() => "ConfiguredPlaceholder");
      PlaceholderMock.default.configure = mockConfigure;

      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      expect(mockConfigure).toHaveBeenCalledWith({
        placeholder: "Write something...",
      });
    });

    it("should render EditorContent with editor instance", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      const editorContent = screen.getByTestId("editor-content");
      expect(editorContent).toBeInTheDocument();
      expect(editorContent).toHaveAttribute("data-editor-active", "true");
      expect(editorContent).toHaveClass("h-full");
    });

    it("should call editorRef when editor is initialized", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      expect(mockEditorRef).toHaveBeenCalledWith(mockEditor);
    });
  });

  describe("Content Management", () => {
    it("should set initial content in editor", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert - Initial content is set through useEditor configuration
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "<p>Initial content</p>",
        })
      );
    });

    it("should update content when prop changes", () => {
      // Arrange
      const { rerender } = render(<DashboardNoteEditor {...defaultProps} />);

      // Mock that editor HTML differs from new content
      mockEditor.getHTML.mockReturnValue("<p>Old content</p>");

      // Act
      rerender(
        <DashboardNoteEditor {...defaultProps} content="<p>New content</p>" />
      );

      // Assert
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
        "<p>New content</p>"
      );
    });

    it("should not update content when editor HTML matches content prop", () => {
      // Arrange
      mockEditor.getHTML.mockReturnValue("<p>Same content</p>");
      const { rerender } = render(<DashboardNoteEditor {...defaultProps} />);

      // Clear the mock after initial render
      jest.clearAllMocks();

      // Act
      rerender(
        <DashboardNoteEditor {...defaultProps} content="<p>Same content</p>" />
      );

      // Assert
      expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
    });

    it("should handle content updates gracefully when editor is null", () => {
      // Arrange
      mockUseEditor.mockReturnValue(null);

      // Act & Assert - Should not throw error
      expect(() => {
        render(<DashboardNoteEditor {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe("Event Handling", () => {
    it("should call onUpdate when editor content changes", () => {
      // Arrange
      let updateHandler;
      mockUseEditor.mockImplementation((config) => {
        updateHandler = config.onUpdate;
        return mockEditor;
      });

      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Simulate editor update
      mockEditor.getHTML.mockReturnValue("<p>Updated content</p>");
      updateHandler({ editor: mockEditor });

      // Assert
      expect(mockOnUpdate).toHaveBeenCalledWith("<p>Updated content</p>");
    });

    it("should call onBlur when editor loses focus", () => {
      // Arrange
      let blurHandler;
      mockUseEditor.mockImplementation((config) => {
        blurHandler = config.onBlur;
        return mockEditor;
      });

      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Simulate editor blur
      blurHandler({ editor: mockEditor });

      // Assert
      expect(mockOnBlur).toHaveBeenCalled();
    });

    it("should not call onBlur when onBlur prop is not provided", () => {
      // Arrange
      let blurHandler;
      mockUseEditor.mockImplementation((config) => {
        blurHandler = config.onBlur;
        return mockEditor;
      });

      // Act
      render(<DashboardNoteEditor {...defaultProps} onBlur={undefined} />);

      // Simulate editor blur
      blurHandler({ editor: mockEditor });

      // Assert - Should not throw error
      expect(() => blurHandler({ editor: mockEditor })).not.toThrow();
    });
  });

  describe("Editor Reference Management", () => {
    it("should not call editorRef when editor is null", () => {
      // Arrange
      mockUseEditor.mockReturnValue(null);

      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      expect(mockEditorRef).not.toHaveBeenCalled();
    });

    it("should not call editorRef when editorRef prop is not provided", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} editorRef={undefined} />);

      // Assert - Should not throw error and editor should still be created
      const editorContent = screen.getByTestId("editor-content");
      expect(editorContent).toHaveAttribute("data-editor-active", "true");
    });

    it("should update editorRef when editor instance changes", () => {
      // Arrange
      const newMockEditor = { ...mockEditor, id: "new-editor" };
      const { rerender } = render(<DashboardNoteEditor {...defaultProps} />);

      // Act
      mockUseEditor.mockReturnValue(newMockEditor);
      rerender(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      expect(mockEditorRef).toHaveBeenCalledWith(newMockEditor);
    });
  });

  describe("CSS Classes", () => {
    it("should apply default CSS classes", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} className="" />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          editorProps: {
            attributes: {
              class: "prose dark:prose-invert max-w-none focus:outline-none ",
            },
          },
        })
      );
    });

    it("should apply custom CSS classes", () => {
      // Act
      render(
        <DashboardNoteEditor {...defaultProps} className="custom-class" />
      );

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          editorProps: {
            attributes: {
              class:
                "prose dark:prose-invert max-w-none focus:outline-none custom-class",
            },
          },
        })
      );
    });

    it("should handle missing className prop gracefully", () => {
      // Arrange - Remove className from props
      const propsWithoutClassName = { ...defaultProps };
      delete propsWithoutClassName.className;

      // Act
      render(<DashboardNoteEditor {...propsWithoutClassName} />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          editorProps: {
            attributes: {
              class: "prose dark:prose-invert max-w-none focus:outline-none ",
            },
          },
        })
      );
    });
  });

  describe("Editor Lifecycle", () => {
    it("should render without editor when useEditor returns null", () => {
      // Arrange
      mockUseEditor.mockReturnValue(null);

      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      const editorContent = screen.getByTestId("editor-content");
      expect(editorContent).toHaveAttribute("data-editor-active", "false");
      expect(editorContent).toHaveTextContent("No Editor");
    });

    it("should handle editor destruction gracefully", () => {
      // Arrange
      const { unmount } = render(<DashboardNoteEditor {...defaultProps} />);

      // Act & Assert - Should not throw error
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Props Validation", () => {
    it("should handle missing required props gracefully", () => {
      // Act & Assert - Should not throw error
      expect(() => {
        render(<DashboardNoteEditor />);
      }).not.toThrow();
    });

    it("should handle empty content prop", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} content="" />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "",
        })
      );
    });

    it("should handle null content prop", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} content={null} />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: null,
        })
      );
    });
  });

  describe("Accessibility", () => {
    it("should apply prose classes for better readability", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          editorProps: {
            attributes: {
              class: expect.stringContaining("prose dark:prose-invert"),
            },
          },
        })
      );
    });

    it("should apply focus outline removal", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          editorProps: {
            attributes: {
              class: expect.stringContaining("focus:outline-none"),
            },
          },
        })
      );
    });

    it("should allow unlimited content width", () => {
      // Act
      render(<DashboardNoteEditor {...defaultProps} />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          editorProps: {
            attributes: {
              class: expect.stringContaining("max-w-none"),
            },
          },
        })
      );
    });
  });
});
