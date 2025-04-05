import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import noteService from "../../services/api/noteService";
import { DEFAULT_FOLDER } from "./constants";

// Component imports
import NotesList from "./components/NotesList";
import NotesNavbar from "./components/NotesNavbar";
import NoteEditor from "./components/NoteEditor";

const NotesContainer = () => {
  // State management
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([DEFAULT_FOLDER]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(DEFAULT_FOLDER);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewNote, setIsNewNote] = useState(false);

  // Fetch notes when component mounts or folder changes
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        // Make sure we're explicitly filtering by the current folder
        const response = await noteService.getNotes({ folder: currentFolder });

        // Only show notes that belong to the current folder
        const folderNotes =
          response.data.notes?.filter(
            (note) => note.folder === currentFolder
          ) || [];

        setNotes(folderNotes);

        // Clear selected note when changing folders
        setSelectedNote(null);
      } catch (error) {
        console.error("Error fetching notes:", error);
        toast.error("Failed to load notes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [currentFolder]);

  // Fetch folders when component mounts or when returning to the component
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await noteService.getFolders();
        const fetchedFolders = response?.data?.folders || [];
        if (fetchedFolders.length > 0) {
          const updatedFolders = [DEFAULT_FOLDER, ...fetchedFolders];
          setFolders(updatedFolders);
          // Save folders to localStorage for persistence
          localStorage.setItem("note-folders", JSON.stringify(updatedFolders));
        }
      } catch (error) {
        console.error("Error fetching folders:", error);
        // Don't show error toast for folders as it's not critical
      }
    };

    // Load folders from localStorage if available
    const savedFolders = localStorage.getItem("note-folders");
    if (savedFolders) {
      try {
        const parsedFolders = JSON.parse(savedFolders);
        setFolders(parsedFolders);
      } catch (e) {
        console.error("Error parsing saved folders:", e);
      }
    }

    // Always fetch fresh data from server
    fetchFolders();

    // Set up an interval to periodically refresh folders while component is mounted
    const folderRefreshInterval = setInterval(fetchFolders, 30000); // Refresh every 30 seconds

    // Clean up the interval when component unmounts
    return () => clearInterval(folderRefreshInterval);
  }, []);

  // Create a new note
  const handleCreateNote = async () => {
    try {
      const response = await noteService.create({
        title: "Untitled Note",
        content: "",
        folder: currentFolder,
      });

      const newNote = response.data.note;
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
      setIsNewNote(true); // Mark as new note to trigger title focus
      toast.success("Note created");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
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
      const response = await noteService.update(id, updatedData);
      setNotes(
        notes.map((note) => (note._id === id ? response.data.note : note))
      );

      if (selectedNote && selectedNote._id === id) {
        setSelectedNote(response.data.note);
      }

      // If we're updating the title of a new note, clear the new note flag
      if (updatedData.title && isNewNote) {
        setIsNewNote(false);
      }

      // No toast here as this will be called frequently during auto-save
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to save note");
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
      const response = await noteService.createFolder(name);
      const updatedFolders = [...folders, name];
      setFolders(updatedFolders);
      // Save updated folders to localStorage
      localStorage.setItem("note-folders", JSON.stringify(updatedFolders));

      setCurrentFolder(name);
      // Add the newly created welcome note to the notes list
      setNotes([response.data.note]);
      setSelectedNote(response.data.note);
      toast.success(`Folder "${name}" created`);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error(error.response?.data?.message || "Failed to create folder");
    }
  };

  // Handler for deleting a folder
  const handleDeleteFolder = async (name) => {
    try {
      const response = await noteService.deleteFolder(name);

      // Remove the folder from state
      const updatedFolders = folders.filter((f) => f !== name);
      setFolders(updatedFolders);
      // Save updated folders to localStorage
      localStorage.setItem("note-folders", JSON.stringify(updatedFolders));

      // If we're currently in the deleted folder, switch to General
      if (currentFolder === name) {
        setCurrentFolder(DEFAULT_FOLDER);
        // Fetch notes from the General folder
        const notesResponse = await noteService.getNotes({
          folder: DEFAULT_FOLDER,
        });
        setNotes(notesResponse.data.notes || []);
        setSelectedNote(null);
      }

      toast.success(response.data.data.message || `Folder "${name}" deleted`);
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error(error.response?.data?.message || "Failed to delete folder");
    }
  };

  // Handler for renaming a folder
  const handleRenameFolder = async (oldName, newName) => {
    try {
      const response = await noteService.renameFolder(oldName, newName);

      // Update folders in state
      const updatedFolders = folders.map((f) => (f === oldName ? newName : f));
      setFolders(updatedFolders);
      // Save updated folders to localStorage
      localStorage.setItem("note-folders", JSON.stringify(updatedFolders));

      // If we're in the renamed folder, update currentFolder
      if (currentFolder === oldName) {
        setCurrentFolder(newName);
      }

      // Update notes array if we're currently viewing the folder
      if (currentFolder === oldName) {
        setNotes(
          notes.map((note) => ({
            ...note,
            folder: newName,
          }))
        );
      }

      toast.success(
        response.data.data.message || `Folder renamed to "${newName}"`
      );
    } catch (error) {
      console.error("Error renaming folder:", error);
      toast.error(error.response?.data?.message || "Failed to rename folder");
    }
  };

  // Handler for deleting a note
  const handleDeleteNote = async (id) => {
    try {
      await noteService.delete(id);

      setNotes(notes.filter((note) => note._id !== id));

      if (selectedNote && selectedNote._id === id) {
        setSelectedNote(null);
      }

      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar with folders and search */}
      <NotesNavbar
        folders={folders}
        currentFolder={currentFolder}
        onFolderChange={handleFolderChange}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onRenameFolder={handleRenameFolder}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Middle section with notes list */}
      <NotesList
        notes={filteredNotes}
        selectedNote={selectedNote}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        loading={loading}
        currentFolder={currentFolder}
      />

      {/* Right section with note editor */}
      <NoteEditor 
        note={selectedNote} 
        onUpdateNote={handleUpdateNote} 
        isNewNote={isNewNote}
      />
    </div>
  );
};

export default NotesContainer;
