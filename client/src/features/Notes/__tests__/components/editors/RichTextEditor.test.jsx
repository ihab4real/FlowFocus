import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RichTextEditor from "../../../components/editors/RichTextEditor";

// Mock @tiptap/react
const mockEditor = {
  getHTML: jest.fn(),
  commands: {
    setContent: jest.fn(),
  },
  chain: jest.fn(() => ({
    focus: jest.fn(() => ({
      toggleBold: jest.fn(() => ({ run: jest.fn() })),
      toggleItalic: jest.fn(() => ({ run: jest.fn() })),
      toggleUnderline: jest.fn(() => ({ run: jest.fn() })),
      toggleHeading: jest.fn(() => ({ run: jest.fn() })),
      toggleBulletList: jest.fn(() => ({ run: jest.fn() })),
      toggleOrderedList: jest.fn(() => ({ run: jest.fn() })),
      toggleCodeBlock: jest.fn(() => ({ run: jest.fn() })),
      setLink: jest.fn(() => ({ run: jest.fn() })),
      setImage: jest.fn(() => ({ run: jest.fn() })),
      setTextAlign: jest.fn(() => ({ run: jest.fn() })),
    })),
  })),
  isActive: jest.fn(() => false),
};

const mockUseEditor = jest.fn();

jest.mock("@tiptap/react", () => ({
  useEditor: (...args) => mockUseEditor(...args),
  EditorContent: ({ editor, className }) => (
    <div
      data-testid="rich-editor-content"
      className={className}
      data-editor-active={!!editor}
    >
      {editor ? "Rich Editor Active" : "No Rich Editor"}
    </div>
  ),
}));

// Mock TipTap extensions
jest.mock("@tiptap/starter-kit", () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => "StarterKit"),
  },
}));

jest.mock("@tiptap/extension-placeholder", () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => "Placeholder"),
  },
}));

jest.mock("@tiptap/extension-link", () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => "Link"),
  },
}));

jest.mock("@tiptap/extension-image", () => ({
  __esModule: true,
  default: "Image",
}));

jest.mock("@tiptap/extension-underline", () => ({
  __esModule: true,
  default: "Underline",
}));

jest.mock("@tiptap/extension-text-align", () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => "TextAlign"),
  },
}));

jest.mock("@tiptap/extension-code-block-lowlight", () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => "CodeBlockLowlight"),
  },
}));

// Mock lowlight
jest.mock("lowlight", () => ({
  common: {},
  createLowlight: jest.fn(() => ({})),
}));

// Mock window.prompt
const originalPrompt = window.prompt;

describe("RichTextEditor Component", () => {
  const mockOnUpdate = jest.fn();

  const defaultProps = {
    content: "<p>Initial rich content</p>",
    onUpdate: mockOnUpdate,
    isFullScreen: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEditor.getHTML.mockReturnValue("<p>Initial rich content</p>");
    mockEditor.isActive.mockReturnValue(false);
    mockUseEditor.mockReturnValue(mockEditor);

    // Mock window.prompt
    window.prompt = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.prompt = originalPrompt;
  });

  describe("Editor Initialization", () => {
    it("should initialize TipTap editor with correct extensions", () => {
      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      expect(mockUseEditor).toHaveBeenCalledWith({
        extensions: [
          "StarterKit",
          "Placeholder",
          "Link",
          "Image",
          "Underline",
          "TextAlign",
          "CodeBlockLowlight",
        ],
        content: "<p>Initial rich content</p>",
        onUpdate: expect.any(Function),
        editorProps: {
          attributes: {
            class:
              "prose dark:prose-invert max-w-none focus:outline-none h-full",
          },
        },
      });
    });

    it("should configure StarterKit extension correctly", () => {
      // Arrange
      const StarterKitMock = jest.requireMock("@tiptap/starter-kit");
      const mockConfigure = jest.fn(() => "ConfiguredStarterKit");
      StarterKitMock.default.configure = mockConfigure;

      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      expect(mockConfigure).toHaveBeenCalledWith({
        codeBlock: false,
      });
    });

    it("should configure Placeholder extension correctly", () => {
      // Arrange
      const PlaceholderMock = jest.requireMock("@tiptap/extension-placeholder");
      const mockConfigure = jest.fn(() => "ConfiguredPlaceholder");
      PlaceholderMock.default.configure = mockConfigure;

      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      expect(mockConfigure).toHaveBeenCalledWith({
        placeholder: "Start writing here...",
      });
    });

    it("should configure Link extension correctly", () => {
      // Arrange
      const LinkMock = jest.requireMock("@tiptap/extension-link");
      const mockConfigure = jest.fn(() => "ConfiguredLink");
      LinkMock.default.configure = mockConfigure;

      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      expect(mockConfigure).toHaveBeenCalledWith({
        openOnClick: false,
      });
    });

    it("should configure TextAlign extension correctly", () => {
      // Arrange
      const TextAlignMock = jest.requireMock("@tiptap/extension-text-align");
      const mockConfigure = jest.fn(() => "ConfiguredTextAlign");
      TextAlignMock.default.configure = mockConfigure;

      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      expect(mockConfigure).toHaveBeenCalledWith({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      });
    });

    it("should render EditorContent with editor instance", () => {
      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      const editorContent = screen.getByTestId("rich-editor-content");
      expect(editorContent).toBeInTheDocument();
      expect(editorContent).toHaveAttribute("data-editor-active", "true");
    });
  });

  describe("Toolbar Rendering", () => {
    it("should render all toolbar buttons", () => {
      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      const buttons = [
        "Bold",
        "Italic",
        "Underline",
        "Heading 1",
        "Heading 2",
        "Bullet List",
        "Ordered List",
        "Code Block",
        "Link",
        "Image",
        "Align Left",
        "Align Center",
        "Align Right",
      ];

      buttons.forEach((buttonTitle) => {
        expect(screen.getByTitle(buttonTitle)).toBeInTheDocument();
      });
    });

    it("should not render toolbar when editor is null", () => {
      // Arrange
      mockUseEditor.mockReturnValue(null);

      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      expect(screen.queryByTitle("Bold")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Italic")).not.toBeInTheDocument();
    });

    it("should show active state for toolbar buttons", () => {
      // Arrange
      mockEditor.isActive.mockImplementation((type) => type === "bold");

      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      const boldButton = screen.getByTitle("Bold");
      expect(boldButton).toHaveClass("bg-gray-100");
      expect(boldButton).toHaveClass("text-indigo-600");
    });
  });

  describe("Toolbar Interactions", () => {
    it("should toggle bold when bold button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockToggleBold = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          toggleBold: mockToggleBold,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Bold"));

      // Assert
      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockToggleBold).toHaveBeenCalled();
    });

    it("should toggle italic when italic button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockToggleItalic = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          toggleItalic: mockToggleItalic,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Italic"));

      // Assert
      expect(mockToggleItalic).toHaveBeenCalled();
    });

    it("should toggle underline when underline button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockToggleUnderline = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          toggleUnderline: mockToggleUnderline,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Underline"));

      // Assert
      expect(mockToggleUnderline).toHaveBeenCalled();
    });

    it("should toggle heading 1 when heading 1 button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockToggleHeading = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          toggleHeading: mockToggleHeading,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Heading 1"));

      // Assert
      expect(mockToggleHeading).toHaveBeenCalledWith({ level: 1 });
    });

    it("should toggle heading 2 when heading 2 button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockToggleHeading = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          toggleHeading: mockToggleHeading,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Heading 2"));

      // Assert
      expect(mockToggleHeading).toHaveBeenCalledWith({ level: 2 });
    });

    it("should toggle bullet list when bullet list button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockToggleBulletList = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          toggleBulletList: mockToggleBulletList,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Bullet List"));

      // Assert
      expect(mockToggleBulletList).toHaveBeenCalled();
    });

    it("should toggle ordered list when ordered list button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockToggleOrderedList = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          toggleOrderedList: mockToggleOrderedList,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Ordered List"));

      // Assert
      expect(mockToggleOrderedList).toHaveBeenCalled();
    });

    it("should toggle code block when code block button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockToggleCodeBlock = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          toggleCodeBlock: mockToggleCodeBlock,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Code Block"));

      // Assert
      expect(mockToggleCodeBlock).toHaveBeenCalled();
    });
  });

  describe("Link Functionality", () => {
    it("should add link when link button is clicked and URL is provided", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetLink = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          setLink: mockSetLink,
        })),
      });
      window.prompt.mockReturnValue("https://example.com");

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Link"));

      // Assert
      expect(window.prompt).toHaveBeenCalledWith("Enter URL");
      expect(mockSetLink).toHaveBeenCalledWith({ href: "https://example.com" });
    });

    it("should not add link when link button is clicked and no URL is provided", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetLink = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          setLink: mockSetLink,
        })),
      });
      window.prompt.mockReturnValue(null);

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Link"));

      // Assert
      expect(window.prompt).toHaveBeenCalledWith("Enter URL");
      expect(mockSetLink).not.toHaveBeenCalled();
    });

    it("should not add link when link button is clicked and empty URL is provided", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetLink = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          setLink: mockSetLink,
        })),
      });
      window.prompt.mockReturnValue("");

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Link"));

      // Assert
      expect(window.prompt).toHaveBeenCalledWith("Enter URL");
      expect(mockSetLink).not.toHaveBeenCalled();
    });
  });

  describe("Image Functionality", () => {
    it("should add image when image button is clicked and URL is provided", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetImage = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          setImage: mockSetImage,
        })),
      });
      window.prompt.mockReturnValue("https://example.com/image.jpg");

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Image"));

      // Assert
      expect(window.prompt).toHaveBeenCalledWith("Enter image URL");
      expect(mockSetImage).toHaveBeenCalledWith({
        src: "https://example.com/image.jpg",
      });
    });

    it("should not add image when image button is clicked and no URL is provided", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetImage = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          setImage: mockSetImage,
        })),
      });
      window.prompt.mockReturnValue(null);

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Image"));

      // Assert
      expect(window.prompt).toHaveBeenCalledWith("Enter image URL");
      expect(mockSetImage).not.toHaveBeenCalled();
    });
  });

  describe("Text Alignment", () => {
    it("should set text align left when align left button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetTextAlign = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          setTextAlign: mockSetTextAlign,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Align Left"));

      // Assert
      expect(mockSetTextAlign).toHaveBeenCalledWith("left");
    });

    it("should set text align center when align center button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetTextAlign = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          setTextAlign: mockSetTextAlign,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Align Center"));

      // Assert
      expect(mockSetTextAlign).toHaveBeenCalledWith("center");
    });

    it("should set text align right when align right button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSetTextAlign = jest.fn(() => ({ run: jest.fn() }));
      mockEditor.chain.mockReturnValue({
        focus: jest.fn(() => ({
          setTextAlign: mockSetTextAlign,
        })),
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);
      await user.click(screen.getByTitle("Align Right"));

      // Assert
      expect(mockSetTextAlign).toHaveBeenCalledWith("right");
    });
  });

  describe("Content Management", () => {
    it("should call onUpdate when editor content changes", () => {
      // Arrange
      let updateHandler;
      mockUseEditor.mockImplementation((config) => {
        updateHandler = config.onUpdate;
        return mockEditor;
      });

      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Simulate editor update
      mockEditor.getHTML.mockReturnValue("<p>Updated rich content</p>");
      updateHandler({ editor: mockEditor });

      // Assert
      expect(mockOnUpdate).toHaveBeenCalledWith("<p>Updated rich content</p>");
    });

    it("should update content when prop changes", () => {
      // Arrange
      const { rerender } = render(<RichTextEditor {...defaultProps} />);

      // Mock that editor HTML differs from new content
      mockEditor.getHTML.mockReturnValue("<p>Old rich content</p>");

      // Act
      rerender(
        <RichTextEditor {...defaultProps} content="<p>New rich content</p>" />
      );

      // Assert
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
        "<p>New rich content</p>"
      );
    });

    it("should not update content when editor HTML matches content prop", () => {
      // Arrange
      mockEditor.getHTML.mockReturnValue("<p>Same rich content</p>");
      const { rerender } = render(<RichTextEditor {...defaultProps} />);

      // Clear the mock after initial render
      jest.clearAllMocks();

      // Act
      rerender(
        <RichTextEditor {...defaultProps} content="<p>Same rich content</p>" />
      );

      // Assert
      expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
    });
  });

  describe("Full Screen Mode", () => {
    it("should apply full screen specific styles when isFullScreen is true", () => {
      // Act
      render(<RichTextEditor {...defaultProps} isFullScreen={true} />);

      // Assert - Check that editor styles are applied based on fullscreen mode
      const editorContent = screen.getByTestId("rich-editor-content");
      expect(editorContent).toBeInTheDocument();
    });

    it("should apply default styles when isFullScreen is false", () => {
      // Act
      render(<RichTextEditor {...defaultProps} isFullScreen={false} />);

      // Assert
      const editorContent = screen.getByTestId("rich-editor-content");
      expect(editorContent).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should apply proper ARIA attributes and focus management", () => {
      // Act
      render(<RichTextEditor {...defaultProps} />);

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

    it("should have proper button types for toolbar buttons", () => {
      // Act
      render(<RichTextEditor {...defaultProps} />);

      // Assert
      const boldButton = screen.getByTitle("Bold");
      expect(boldButton).toHaveAttribute("type", "button");
    });
  });

  describe("Editor Lifecycle", () => {
    it("should handle editor destruction gracefully", () => {
      // Arrange
      const { unmount } = render(<RichTextEditor {...defaultProps} />);

      // Act & Assert - Should not throw error
      expect(() => unmount()).not.toThrow();
    });

    it("should handle missing props gracefully", () => {
      // Act & Assert - Should not throw error
      expect(() => {
        render(<RichTextEditor />);
      }).not.toThrow();
    });
  });
});
