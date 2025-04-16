# Notes Management System Implementation Guide

## Overview

This document outlines the implementation plan for FlowFocus's notes management system, featuring a rich text editor, folder organization, tagging capabilities, and search functionality.

## Data Model

### Note Schema

```javascript
const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    default: "",
  },
  folder: {
    type: String,
    default: "General",
    trim: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
```

### Folder Schema (Optional Approach)

```javascript
const folderSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
```

## API Endpoints

### Base URL: `/api/notes`

| Method | Endpoint     | Description          | Request Body                           | Response                |
| ------ | ------------ | -------------------- | -------------------------------------- | ----------------------- |
| POST   | /            | Create new note      | `{ title, content, folder, tags }`     | Created note object     |
| GET    | /            | Get all user's notes | -                                      | Array of notes          |
| GET    | /:id         | Get single note      | -                                      | Note object             |
| PATCH  | /:id         | Update note          | `{ title?, content?, folder?, tags? }` | Updated note object     |
| DELETE | /:id         | Delete note          | -                                      | Success message         |
| GET    | /folders     | Get all folders      | -                                      | Array of folder strings |
| POST   | /folders     | Create folder        | `{ name }`                             | Created folder object   |
| DELETE | /folders/:id | Delete folder        | -                                      | Success message         |

## Frontend Components

### Component Hierarchy

```
NotesContainer/
├── NotesNavbar/
│   ├── FolderList/
│   │   └── FolderItem
│   ├── CreateFolderButton
│   └── NoteSearch
├── NotesList/
│   ├── NoteListItem
│   └── CreateNoteButton
└── NoteEditor/
    ├── NoteHeader/
    │   ├── TitleInput
    │   ├── FolderSelect
    │   └── TagInput
    ├── EditorToolbar/
    │   └── FormatButtons
    └── RichTextEditor
```

### UI Specifications

#### NotesList

- Sidebar with fixed width
- Condensed note previews
- Highlight for selected note
- Sort by recently edited (default)
- Clear create note button

#### NoteEditor

- Clean, distraction-free interface
- Floating toolbar
- Auto-save functionality
- Markdown shortcuts
- Responsive layout

#### Rich Text Features

- Bold, italic, underline
- Headings (H1, H2, H3)
- Ordered and unordered lists
- Code blocks with syntax highlighting
- Links with preview

## Implementation Phases

### Phase 1: Basic CRUD & UI

#### Server Tasks

1. Create Mongoose note model with schema
2. Implement CRUD routes
3. Add note ownership middleware
4. Add input validation
5. Implement simple folder endpoints

#### Client Tasks

1. Create NotesContainer layout
2. Implement basic NotesList
3. Add simple text editor (no rich text yet)
4. Connect to API endpoints
5. Implement basic note selection

### Phase 2: Rich Text Editor

#### Server Tasks

1. Update content storage for rich text
2. Add content sanitization

#### Client Tasks

1. Integrate TipTap editor
2. Implement editor toolbar
3. Add formatting options
4. Implement markdown shortcuts
5. Add auto-save functionality

### Phase 3: Organization

#### Server Tasks

1. Enhance folder endpoints
2. Add tag functionality

#### Client Tasks

1. Build folder navigation
2. Implement folder management UI
3. Add tag input with autocomplete
4. Build tag management UI

### Phase 4: Search & Enhancements

#### Server Tasks

1. Implement text search endpoint
2. Add tag-based search
3. Add folder filtering

#### Client Tasks

1. Build search input and results view
2. Add keyboard shortcuts
3. Implement markdown export/import
4. Add note sorting options

## Technical Dependencies

### Client

- `@tiptap/react`: Rich text editor
- `@tiptap/starter-kit`: Core editor functionality
- `@tiptap/extension-placeholder`: Placeholder text
- `@tiptap/extension-code-block-lowlight`: Code block with syntax highlighting
- `lowlight`: Syntax highlighting
- `react-select`: Tag input and autocomplete

### Server

- Existing MERN stack
- Optional: HTML sanitization library

## Testing Strategy

### Unit Tests

1. Note model validation
2. API endpoint handlers
3. Folder management functions
4. Content sanitization

### Integration Tests

1. Note CRUD operations
2. Rich text processing
3. Folder operations
4. User ownership validation

### E2E Tests

1. Note creation flow
2. Rich text editing
3. Folder management
4. Search functionality

## Security Considerations

1. Validate user ownership for all operations
2. Sanitize rich text content
3. Rate limit API endpoints
4. Validate folder names
5. Implement proper error handling

## Performance Optimizations

1. Implement note pagination
2. Optimize editor initialization
3. Throttle auto-save function
4. Use proper database indexes
5. Lazy load notes content
