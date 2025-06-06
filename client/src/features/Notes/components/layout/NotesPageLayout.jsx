import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_FOLDER } from "@/features/Notes/utils/constants";
import { useDeviceDetection } from "@/features/Notes/hooks/useDeviceDetection";
import DesktopNotesLayout from "@/features/Notes/layouts/DesktopNotesLayout";
import MobileNotesLayout from "@/features/Notes/layouts/MobileNotesLayout";
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
} from "@/features/Notes";

// Component imports
import NotesList from "./NotesList";
import NotesNavbar from "./NotesNavbar";
import NoteEditingPanel from "./NoteEditingPanel";

// Resizable panels imports
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const NotesPageLayout = () => {
  // Device detection
  const { isMobile, isTablet } = useDeviceDetection();
  const shouldUseMobileLayout = isMobile || isTablet;

  // State management
  const [selectedNote, setSelectedNote] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(DEFAULT_FOLDER);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewNote, setIsNewNote] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get location to check for initial state passed from dashboard or search
  const location = useLocation();

  // React Query hooks
  const { data: folders = [DEFAULT_FOLDER] } = useFoldersQuery();
  const { data: notes = [], isLoading: notesLoading } = useNotesQuery({
    folder: currentFolder,
  });
  const createNoteMutation = useCreateNoteMutation();
  const updateNoteMutation = useUpdateNoteMutation();
  const deleteNoteMutation = useDeleteNoteMutation();
  const createFolderMutation = useCreateFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  const renameFolderMutation = useRenameFolderMutation();

  // For initial note loading
  const { data: initialNote } = useNoteQuery(location.state?.initialNoteId, {
    enabled: !!location.state?.initialNoteId,
  });

  // Handle folder selection from search navigation
  useEffect(() => {
    if (
      location.state?.folderToOpen &&
      folders.includes(location.state.folderToOpen)
    ) {
      setCurrentFolder(location.state.folderToOpen);
    }
  }, [location.state?.folderToOpen, folders]);

  // Handle initial note loading from dashboard navigation or search
  useEffect(() => {
    if (initialNote) {
      setSelectedNote(initialNote);
      // Set the current folder to match the note's folder
      setCurrentFolder(initialNote.folder || DEFAULT_FOLDER);
    }
  }, [initialNote]);

  // Clear selected note when changing folders unless we have a specific note requested
  useEffect(() => {
    if (!location.state?.initialNoteId) {
      setSelectedNote(null);
    }
  }, [currentFolder, location.state?.initialNoteId]);

  // Also clear selected note if it doesn't belong to the current folder
  useEffect(() => {
    if (selectedNote && selectedNote.folder !== currentFolder) {
      setSelectedNote(null);
    }
  }, [selectedNote, currentFolder]);

  // Create a new note
  const handleCreateNote = async () => {
    try {
      const newNote = await createNoteMutation.mutateAsync({
        title: "Untitled Note",
        content: "",
        folder: currentFolder,
      });

      setSelectedNote(newNote);
      setIsNewNote(true); // Mark as new note to trigger title focus
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error creating note:", error);
    }
  };

  // Handler for selecting a note
  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setIsNewNote(false); // Not a new note
  };

  // Handler for updating a note
  const handleUpdateNote = async (id, updatedData) => {
    try {
      const updatedNote = await updateNoteMutation.mutateAsync({
        id,
        data: updatedData,
      });

      if (selectedNote && selectedNote._id === id) {
        setSelectedNote(updatedNote);
      }

      // If we're updating the title of a new note, clear the new note flag
      if (updatedData.title && isNewNote) {
        setIsNewNote(false);
      }

      // No toast here as this will be called frequently during auto-save
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error updating note:", error);
    }
  };

  // Handler for changing folders
  const handleFolderChange = (folder) => {
    // Only change if it's a different folder
    if (folder !== currentFolder) {
      setCurrentFolder(folder);
      // Selected note is cleared in the useEffect when notes are fetched
    }
  };

  // Handler for creating a new folder
  const handleCreateFolder = async (name) => {
    try {
      const { welcomeNote } = await createFolderMutation.mutateAsync(name);

      setCurrentFolder(name);
      // Select the newly created welcome note
      if (welcomeNote) {
        setSelectedNote(welcomeNote);
      }
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error creating folder:", error);
    }
  };

  // Handler for deleting a folder
  const handleDeleteFolder = async (name) => {
    try {
      await deleteFolderMutation.mutateAsync(name);

      // If we're currently in the deleted folder, switch to General
      if (currentFolder === name) {
        setCurrentFolder(DEFAULT_FOLDER);
        setSelectedNote(null);
      }
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error deleting folder:", error);
    }
  };

  // Handler for renaming a folder
  const handleRenameFolder = async (oldName, newName) => {
    try {
      await renameFolderMutation.mutateAsync({ oldName, newName });

      // If we're in the renamed folder, update currentFolder
      if (currentFolder === oldName) {
        setCurrentFolder(newName);
      }
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error renaming folder:", error);
    }
  };

  // Handler for deleting a note
  const handleDeleteNote = async (id) => {
    try {
      await deleteNoteMutation.mutateAsync(id);

      if (selectedNote && selectedNote._id === id) {
        setSelectedNote(null);
      }
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error deleting note:", error);
    }
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Common props for both layouts
  const layoutProps = {
    // State props
    selectedNote,
    currentFolder,
    searchQuery,
    isNewNote,
    isFullScreen,

    // Data props
    folders,
    notes,
    filteredNotes,
    notesLoading,

    // Handlers
    onSelectNote: handleSelectNote,
    onCreateNote: handleCreateNote,
    onUpdateNote: handleUpdateNote,
    onDeleteNote: handleDeleteNote,
    onFolderChange: handleFolderChange,
    onCreateFolder: handleCreateFolder,
    onDeleteFolder: handleDeleteFolder,
    onRenameFolder: handleRenameFolder,
    onSearchChange: setSearchQuery,
    onToggleFullScreen: () => setIsFullScreen(!isFullScreen),
  };

  // Conditionally render the appropriate layout based on device detection
  if (shouldUseMobileLayout) {
    return (
      <div className="h-full overflow-hidden pt-0">
        <MobileNotesLayout {...layoutProps} isTablet={isTablet} />
      </div>
    );
  }

  return <DesktopNotesLayout {...layoutProps} />;
};

export default NotesPageLayout;
