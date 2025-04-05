import { useState, useEffect, useRef, useMemo } from "react";
import { debounce } from "lodash";
import TipTapEditor from "./TipTapEditor";

const NoteEditor = ({ note, onUpdateNote, isNewNote }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const titleInputRef = useRef(null);

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
    } else {
      setTitle("");
      setContent("");
    }
  }, [note, isNewNote]);

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

  // Handle content change (for textarea)
  // const handleContentChange = (e) => {
  //   const newContent = e.target.value;
  //   setContent(newContent);
  //   if (note) {
  //     debouncedSave(note._id, { content: newContent });
  //   }
  // };

  // Handle content change (for TipTap)
  const handleTipTapUpdate = (newContent) => {
    setContent(newContent);
    if (note) {
      debouncedSave(note._id, { content: newContent });
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

  return (
    <div className="flex-grow flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Title input */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title"
          className="w-full text-xl font-medium text-gray-900 dark:text-gray-100 focus:outline-none bg-transparent"
        />
      </div>

      {/* Editor content */}
      <div className="flex-grow overflow-auto">
        <TipTapEditor content={content} onUpdate={handleTipTapUpdate} />
      </div>

      {/* Footer with metadata */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date(note.updatedAt).toLocaleString()}
      </div>
    </div>
  );
};

export default NoteEditor;
