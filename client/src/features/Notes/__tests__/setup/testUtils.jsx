import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Utility for rendering components with the Router and React Query contexts
export function renderWithProviders(
  ui,
  {
    route = "/",
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    }),
  } = {}
) {
  window.history.pushState({}, "Test page", route);

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
  });
}

// Mock note data factory
export const createMockNote = (overrides = {}) => ({
  _id: "note-123",
  title: "Test Note",
  content: "Test note content",
  folder: "General",
  tags: ["test", "important"],
  user: "user-123",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Create a collection of mock notes with different folders and properties
export const createMockNotes = (count = 5) => {
  const folders = ["General", "Work", "Personal", "Ideas"];
  const tags = [
    ["work", "important"],
    ["personal", "ideas"],
    ["meeting", "notes"],
    ["project", "planning"],
    ["reminder", "todo"],
  ];

  return Array(count)
    .fill(null)
    .map((_, index) =>
      createMockNote({
        _id: `note-${index}`,
        title: `Note ${index}`,
        content: `Content for note ${index}`,
        folder: folders[index % folders.length],
        tags: tags[index % tags.length],
      })
    );
};

// Mock folder data factory
export const createMockFolders = () => [
  "General",
  "Work",
  "Personal",
  "Ideas",
  "Archive",
];

// Utility to create mock success response
export const createSuccessResponse = (data) => ({
  data,
  status: "success",
  ok: true,
});

// Utility to create mock error response
export const createErrorResponse = (message, status = 400) => {
  const error = new Error(message);
  error.response = {
    data: { message, status: "fail" },
    status,
  };
  return error;
};

// Mock API responses for notes
export const createMockNotesResponse = (notes = createMockNotes()) =>
  createSuccessResponse({
    notes,
    results: notes.length,
  });

export const createMockNoteResponse = (note = createMockNote()) =>
  createSuccessResponse({ note });

export const createMockFoldersResponse = (folders = createMockFolders()) =>
  createSuccessResponse({ folders });

// Mock folder operation responses
export const createMockFolderCreateResponse = (folderName = "New Folder") =>
  createSuccessResponse({
    folder: folderName,
    note: createMockNote({
      title: `Welcome to ${folderName}`,
      folder: folderName,
    }),
  });

export const createMockFolderDeleteResponse = (folderName = "Test Folder") =>
  createSuccessResponse({
    message: `Folder "${folderName}" deleted. 3 notes moved to General folder.`,
    notesUpdated: 3,
  });

export const createMockFolderRenameResponse = (
  oldName = "Old Name",
  newName = "New Name"
) =>
  createSuccessResponse({
    message: `Folder renamed from "${oldName}" to "${newName}". 2 notes updated.`,
    oldName,
    newName,
    notesUpdated: 2,
  });
