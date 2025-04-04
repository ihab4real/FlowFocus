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

  // Fetch notes when component mounts or folder changes
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const response = await noteService.getNotes({ folder: currentFolder });
        setNotes(response.data.notes || []);
      } catch (error) {
        console.error("Error fetching notes:", error);
        toast.error("Failed to load notes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [currentFolder]);

  // Fetch folders when component mounts
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await noteService.getFolders();
        const fetchedFolders = response?.data?.folders || [];
        if (fetchedFolders.length > 0) {
          setFolders([DEFAULT_FOLDER, ...fetchedFolders]);
        }
      } catch (error) {
        console.error("Error fetching folders:", error);
        // Don't show error toast for folders as it's not critical
      }
    };

    fetchFolders();
  }, []);

  // Create a new note
  const handleCreateNote = async () => {
    try {
      const response = await noteService.create({
        title: "Untitled Note",
        content: "",
        folder: currentFolder,
      });
      
      setNotes([response.data.note, ...notes]);
      setSelectedNote(response.data.note);
      toast.success("Note created");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  // Handler for selecting a note
  const handleSelectNote = (note) => {
    setSelectedNote(note);
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
      
      // No toast here as this will be called frequently during auto-save
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to save note");
    }
  };

  // Handler for changing folders
  const handleFolderChange = (folder) => {
    setCurrentFolder(folder);
    setSelectedNote(null);
  };

  // Handler for creating a new folder
  const handleCreateFolder = async (name) => {
    try {
      const response = await noteService.createFolder(name);
      setFolders([...folders, name]);
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
  const filteredNotes = notes.filter((note) => 
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
      />

      {/* Right section with note editor */}
      <NoteEditor
        note={selectedNote}
        onUpdateNote={handleUpdateNote}
      />
    </div>
  );
};

export default NotesContainer; 