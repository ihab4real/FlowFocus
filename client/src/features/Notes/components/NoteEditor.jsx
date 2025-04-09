import { useState, useEffect, useRef, useMemo } from "react";
import { debounce } from "lodash";
import TipTapEditor from "./TipTapEditor";
import { Maximize2, Minimize2 } from "lucide-react";

const NoteEditor = ({ note, onUpdateNote, isNewNote, isFullScreen: externalIsFullScreen, onToggleFullScreen }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const titleInputRef = useRef(null);

  // Sync with external fullscreen state if provided
  useEffect(() => {
    if (externalIsFullScreen !== undefined) {
      setIsFullScreen(externalIsFullScreen);
    }
  }, [externalIsFullScreen]);

  // Update local state when the selected note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      
      // If this is a new note or editing has just begun, focus on the title
      if (isNewNote && titleInputRef.current) {
        setTimeout(() => {
          titleInputRef.current.focus();
          titleInputRef.current.select();
        }, 50);
      }
      
      // Show pulse animation when a new note is loaded
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setTitle("");
      setContent("");
    }
  }, [note, isNewNote]);

  // Handle keyboard shortcuts for fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Exit fullscreen with Escape key
      if (e.key === "Escape" && isFullScreen) {
        toggleFullScreen(false);
      }
      
      // Enter fullscreen with Ctrl+Shift+F
      if (e.key === "f" && e.ctrlKey && e.shiftKey && note) {
        e.preventDefault(); // Prevent browser's find action
        toggleFullScreen(!isFullScreen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen, note]);

  // Create a memoized debounce function
  const debouncedSave = useMemo(
    () =>
      debounce((id, data) => {
        onUpdateNote(id, data);
      }, 500),
    [onUpdateNote]
  );

  // Handle title change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (note) {
      debouncedSave(note._id, { title: newTitle });
    }
  };

  // Handle content change (for TipTap)
  const handleTipTapUpdate = (newContent) => {
    setContent(newContent);
    if (note) {
      debouncedSave(note._id, { content: newContent });
    }
  };

  // Toggle full screen mode
  const toggleFullScreen = (value) => {
    const newValue = value !== undefined ? value : !isFullScreen;
    setIsFullScreen(newValue);
    
    // Call external handler if provided
    if (onToggleFullScreen) {
      onToggleFullScreen(newValue);
    }
  };

  // If no note is selected, show a placeholder
  if (!note) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
            No Note Selected
          </h3>
          <p className="text-gray-400 dark:text-gray-500">
            Select a note from the list or create a new one
          </p>
        </div>
      </div>
    );
  }

  // Classes for the editor container based on full screen state
  const editorContainerClasses = isFullScreen
    ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-300"
    : "flex-grow flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden";

  return (
    <div className={editorContainerClasses}>
      {/* Title input */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title"
          className="w-full text-xl font-medium text-gray-900 dark:text-gray-100 focus:outline-none bg-transparent"
        />
      </div>

      {/* Fullscreen toggle button - different positions based on mode */}
      <button
        onClick={() => toggleFullScreen()}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 z-10 ${
          isFullScreen 
            ? "absolute top-5 right-5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" 
            : `absolute bottom-3 right-4 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-foreground dark:text-primary border border-primary/30 shadow-sm hover:shadow backdrop-blur-sm hover:scale-105 ${showPulse ? 'animate-pulse' : ''}`
        }`}
      >
        {isFullScreen ? (
          <>
            <Minimize2 className="h-4 w-4" />
            <span>Exit <span className="opacity-60 text-xs">Esc</span></span>
          </>
        ) : (
          <>
            <Maximize2 className="h-4 w-4" />
            <span>Focus Mode <span className="opacity-60 text-xs ml-1">Ctrl+Shift+F</span></span>
          </>
        )}
      </button>

      {/* Editor content */}
      <div className={`flex-grow overflow-auto scrollbar-hide ${isFullScreen ? 'absolute inset-0 mt-16 mb-10' : ''}`}>
        <TipTapEditor content={content} onUpdate={handleTipTapUpdate} isFullScreen={isFullScreen} />
      </div>

      {/* Footer with metadata - fixed at bottom when in fullscreen */}
      <div className={`p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ${isFullScreen ? 'absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900' : ''}`}>
        <span>Last updated: {new Date(note.updatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default NoteEditor;
