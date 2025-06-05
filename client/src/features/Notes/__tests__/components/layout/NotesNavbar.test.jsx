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
import NotesNavbar from "../../../components/layout/NotesNavbar";
import { renderWithProviders, createMockFolders } from "../../setup/testUtils";

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  FolderIcon: ({ className, ...props }) => (
    <div className={className} data-testid="folder-icon" {...props} />
  ),
  PlusIcon: ({ className, ...props }) => (
    <div className={className} data-testid="plus-icon" {...props} />
  ),
  SearchIcon: ({ className, ...props }) => (
    <div className={className} data-testid="search-icon" {...props} />
  ),
  MoreVertical: ({ className, ...props }) => (
    <div className={className} data-testid="more-vertical-icon" {...props} />
  ),
  Trash2: ({ className, ...props }) => (
    <div className={className} data-testid="trash-icon" {...props} />
  ),
  Edit: ({ className, ...props }) => (
    <div className={className} data-testid="edit-icon" {...props} />
  ),
}));

describe("NotesNavbar Component", () => {
  const mockFolders = createMockFolders();
  const mockProps = {
    folders: mockFolders,
    currentFolder: "General",
    onFolderChange: jest.fn(),
    onCreateFolder: jest.fn(),
    onDeleteFolder: jest.fn(),
    onRenameFolder: jest.fn(),
    searchQuery: "",
    onSearchChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render search input with icon", () => {
      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);

      // Assert
      expect(screen.getByTestId("search-icon")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search notes...")
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("")).toBeInTheDocument();
    });

    it("should render folders header with add button", () => {
      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);

      // Assert
      expect(screen.getByText("Folders")).toBeInTheDocument();
      expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
      expect(screen.getByLabelText("Add folder")).toBeInTheDocument();
    });

    it("should render all folders in the list", () => {
      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);

      // Assert
      mockFolders.forEach((folder) => {
        expect(screen.getByText(folder)).toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    it("should display current search query", () => {
      // Arrange
      const props = { ...mockProps, searchQuery: "test query" };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);

      // Assert
      expect(screen.getByDisplayValue("test query")).toBeInTheDocument();
    });

    it("should call onSearchChange when typing in search input", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onSearchChange: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      await user.type(screen.getByPlaceholderText("Search notes..."), "test");

      // Assert
      // The component is a controlled input, so onChange is called for each keystroke
      expect(props.onSearchChange).toHaveBeenCalledTimes(4);
      // Since it's calling onSearchChange but not updating the searchQuery prop,
      // let's just verify that onSearchChange was called
      expect(props.onSearchChange).toHaveBeenCalled();
    });

    it("should clear search input when value is cleared", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        ...mockProps,
        searchQuery: "existing query",
        onSearchChange: jest.fn(),
      };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      const searchInput = screen.getByDisplayValue("existing query");
      await user.clear(searchInput);

      // Assert
      expect(props.onSearchChange).toHaveBeenCalledWith("");
    });
  });

  describe("Folder Selection", () => {
    it("should highlight currently selected folder", () => {
      // Arrange
      const props = { ...mockProps, currentFolder: "Work" };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);

      // Assert
      // Find the parent container div (the clickable one), not the inner text div
      const workFolderContainer = screen
        .getByText("Work")
        .closest("div").parentElement;
      expect(workFolderContainer).toHaveClass("bg-indigo-100");
      expect(workFolderContainer).toHaveClass("text-indigo-700");
    });

    it("should not highlight non-selected folders", () => {
      // Arrange
      const props = { ...mockProps, currentFolder: "General" };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);

      // Assert
      // Find the parent container div (the clickable one), not the inner text div
      const workFolderContainer = screen
        .getByText("Work")
        .closest("div").parentElement;
      expect(workFolderContainer).toHaveClass("text-gray-700");
      expect(workFolderContainer).toHaveClass("hover:bg-gray-200");
      expect(workFolderContainer).not.toHaveClass("bg-indigo-100");
    });

    it("should call onFolderChange when clicking a folder", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onFolderChange: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      await user.click(screen.getByText("Work"));

      // Assert
      expect(props.onFolderChange).toHaveBeenCalledWith("Work");
    });
  });

  describe("Folder Menu Management", () => {
    it("should show menu button for non-General folders", () => {
      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);

      // Assert
      const workFolderContainer = screen.getByText("Work").closest("li");
      expect(
        workFolderContainer.querySelector('[aria-label="Folder menu"]')
      ).toBeInTheDocument();
    });

    it("should not show menu button for General folder", () => {
      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);

      // Assert
      const generalFolderContainer = screen.getByText("General").closest("li");
      expect(
        generalFolderContainer.querySelector('[aria-label="Folder menu"]')
      ).not.toBeInTheDocument();
    });

    it("should open folder menu when clicking menu button", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      // Get the first folder menu button (for "Work" folder)
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);

      // Assert
      expect(screen.getByText("Rename folder")).toBeInTheDocument();
      expect(screen.getByText("Delete folder")).toBeInTheDocument();
      expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    });

    it("should close menu when clicking menu button again", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      const firstMenuButton = menuButtons[0];
      await user.click(firstMenuButton);
      await user.click(firstMenuButton);

      // Assert - Wait for animation to complete
      await waitFor(
        () => {
          expect(screen.queryByText("Rename folder")).not.toBeInTheDocument();
          expect(screen.queryByText("Delete folder")).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it("should prevent menu click from triggering folder selection", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onFolderChange: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);

      // Assert
      expect(props.onFolderChange).not.toHaveBeenCalled();
    });
  });

  describe("Folder Creation", () => {
    it("should open create folder modal when clicking add button", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      await user.click(screen.getByLabelText("Add folder"));

      // Assert
      expect(screen.getByText("Create New Folder")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Folder name")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create" })
      ).toBeInTheDocument();
    });

    it("should focus on input when modal opens", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      await user.click(screen.getByLabelText("Add folder"));

      // Assert
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Folder name")).toHaveFocus();
      });
    });

    it("should call onCreateFolder when submitting valid folder name", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onCreateFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      await user.click(screen.getByLabelText("Add folder"));
      await user.type(screen.getByPlaceholderText("Folder name"), "New Folder");
      await user.click(screen.getByRole("button", { name: "Create" }));

      // Assert
      expect(props.onCreateFolder).toHaveBeenCalledWith("New Folder");
    });

    it("should trim folder name before creating", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onCreateFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      await user.click(screen.getByLabelText("Add folder"));
      await user.type(
        screen.getByPlaceholderText("Folder name"),
        "  Spaced Folder  "
      );
      await user.click(screen.getByRole("button", { name: "Create" }));

      // Assert
      expect(props.onCreateFolder).toHaveBeenCalledWith("Spaced Folder");
    });

    it("should not create folder with empty name", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onCreateFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      await user.click(screen.getByLabelText("Add folder"));
      await user.click(screen.getByRole("button", { name: "Create" }));

      // Assert
      expect(props.onCreateFolder).not.toHaveBeenCalled();
    });

    it("should close modal when clicking cancel", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      await user.click(screen.getByLabelText("Add folder"));

      // Verify modal is open
      expect(screen.getByText("Create New Folder")).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // Assert - Wait for animation to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText("Create New Folder")
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it("should allow form submission via Enter key", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onCreateFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      await user.click(screen.getByLabelText("Add folder"));
      await user.type(
        screen.getByPlaceholderText("Folder name"),
        "Keyboard Folder"
      );
      await user.keyboard("{Enter}");

      // Assert
      expect(props.onCreateFolder).toHaveBeenCalledWith("Keyboard Folder");
    });
  });

  describe("Folder Deletion", () => {
    it("should open delete confirmation when clicking delete menu item", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);
      await user.click(screen.getByText("Delete folder"));

      // Assert
      expect(screen.getByText("Delete Folder")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete/)
      ).toBeInTheDocument();
    });

    it("should call onDeleteFolder when confirming deletion", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onDeleteFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);
      await user.click(screen.getByText("Delete folder"));
      await user.click(screen.getByRole("button", { name: "Delete" }));

      // Assert
      expect(props.onDeleteFolder).toHaveBeenCalledWith("Work");
    });

    it("should close delete confirmation when clicking cancel", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);
      await user.click(screen.getByText("Delete folder"));

      // Verify delete confirmation is open
      expect(screen.getByText("Delete Folder")).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getAllByRole("button", { name: "Cancel" })[0]);

      // Assert - Wait for animation to complete
      await waitFor(
        () => {
          expect(screen.queryByText("Delete Folder")).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Folder Renaming", () => {
    it("should open rename modal when clicking rename menu item", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);
      await user.click(screen.getByText("Rename folder"));

      // Assert
      expect(screen.getByText("Rename Folder")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Work")).toBeInTheDocument();
    });

    it("should call onRenameFolder when submitting new name", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onRenameFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);
      await user.click(screen.getByText("Rename folder"));
      const input = screen.getByDisplayValue("Work");
      await user.clear(input);
      await user.type(input, "Projects");
      await user.click(screen.getByRole("button", { name: "Rename" }));

      // Assert
      expect(props.onRenameFolder).toHaveBeenCalledWith("Work", "Projects");
    });

    it("should not rename if name hasn't changed", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onRenameFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);
      await user.click(screen.getByText("Rename folder"));
      await user.click(screen.getByRole("button", { name: "Rename" }));

      // Assert
      expect(props.onRenameFolder).not.toHaveBeenCalled();
    });

    it("should trim folder name before renaming", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onRenameFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);
      await user.click(screen.getByText("Rename folder"));
      const input = screen.getByDisplayValue("Work");
      await user.clear(input);
      await user.type(input, "  Trimmed Projects  ");
      await user.click(screen.getByRole("button", { name: "Rename" }));

      // Assert
      expect(props.onRenameFolder).toHaveBeenCalledWith(
        "Work",
        "Trimmed Projects"
      );
    });
  });

  describe("Click Outside Behavior", () => {
    it("should close folder menu when clicking outside", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);
      const menuButtons = screen.getAllByLabelText("Folder menu");
      await user.click(menuButtons[0]);

      // Verify menu is open
      expect(screen.getByText("Rename folder")).toBeInTheDocument();

      // Click outside (on the folder list container)
      await user.click(document.querySelector(".overflow-y-auto"));

      // Assert - Wait for animation to complete
      await waitFor(
        () => {
          expect(screen.queryByText("Rename folder")).not.toBeInTheDocument();
          expect(screen.queryByText("Delete folder")).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);

      // Assert
      expect(screen.getByLabelText("Add folder")).toBeInTheDocument();
      expect(screen.getAllByLabelText("Folder menu")).toHaveLength(4); // 4 non-General folders
    });

    it("should have proper semantic structure", () => {
      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);

      // Assert
      expect(
        screen.getByRole("heading", { name: "Folders" })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search notes...")
      ).toBeInTheDocument();
    });

    it("should have keyboard navigation support", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<NotesNavbar {...mockProps} />);

      // Use tab navigation - first focus goes to search input
      await user.tab();
      expect(screen.getByPlaceholderText("Search notes...")).toHaveFocus();

      // Next tab should focus on add button's container
      await user.tab();
      // We need to check differently since the button is wrapped in motion.div
      const activeElement = document.activeElement;
      expect(
        activeElement.querySelector('[aria-label="Add folder"]')
      ).not.toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty folders array", () => {
      // Arrange
      const props = { ...mockProps, folders: [] };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);

      // Assert
      expect(screen.getByText("Folders")).toBeInTheDocument();
      expect(screen.queryByText("General")).not.toBeInTheDocument();
    });

    it("should handle null currentFolder", () => {
      // Arrange
      const props = { ...mockProps, currentFolder: null };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);

      // Assert
      // Should not crash and should render folders without highlighting
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    it("should handle special characters in folder names", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = { ...mockProps, onCreateFolder: jest.fn() };

      // Act
      renderWithProviders(<NotesNavbar {...props} />);
      await user.click(screen.getByLabelText("Add folder"));
      await user.type(
        screen.getByPlaceholderText("Folder name"),
        "Folder & Co."
      );
      await user.click(screen.getByRole("button", { name: "Create" }));

      // Assert
      expect(props.onCreateFolder).toHaveBeenCalledWith("Folder & Co.");
    });
  });
});
