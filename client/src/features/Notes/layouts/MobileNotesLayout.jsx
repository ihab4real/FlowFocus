import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotesList from "../components/layout/NotesList";
import NotesNavbar from "../components/layout/NotesNavbar";
import NoteEditingPanel from "../components/layout/NoteEditingPanel";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Mobile layout for notes page with tabbed navigation
 * Provides a mobile-friendly interface for the notes feature
 */
function MobileNotesLayout({
  // State props
  selectedNote,
  currentFolder,
  searchQuery,
  isNewNote,
  isFullScreen,

  // Data props
  folders,
  filteredNotes,
  notesLoading,

  // Handlers
  onSelectNote,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onFolderChange,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onSearchChange,
  onToggleFullScreen,
}) {
  // State to track which tab should be active
  const [activeTab, setActiveTab] = useState("folders");
  const [previousTab, setPreviousTab] = useState(null);

  // When a note is selected, switch to the editor tab
  const handleNoteSelection = (note) => {
    onSelectNote(note);
    setPreviousTab(activeTab);
    setActiveTab("editor");
  };

  // Handle note creation and switch to editor tab
  const handleCreateNote = () => {
    onCreateNote();
    setPreviousTab(activeTab);
    setActiveTab("editor");
  };

  // Handle folder change with animation direction
  const handleFolderChange = (folder) => {
    onFolderChange(folder);
    setPreviousTab(activeTab);
    setActiveTab("notes");
  };

  // Handle going back to notes list from editor
  const handleBackToNotes = () => {
    setPreviousTab(activeTab);
    setActiveTab("notes");
  };

  // Animation variants for tab transitions
  const tabVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative",
      zIndex: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    }),
  };

  // Determine animation direction based on tab changes
  const getDirection = (current, previous) => {
    if (!previous) return 0;

    const tabOrder = ["folders", "notes", "editor"];
    const currentIndex = tabOrder.indexOf(current);
    const previousIndex = tabOrder.indexOf(previous);

    return currentIndex > previousIndex ? 1 : -1;
  };

  // Get animation direction
  const direction = getDirection(activeTab, previousTab);

  return (
    <Card className="h-full overflow-hidden flex flex-col pt-20 md:pt-0 pb-0">
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setPreviousTab(activeTab);
          setActiveTab(value);
        }}
        className="flex flex-col h-full"
      >
        <TabsList className="grid grid-cols-3 mx-2 mt-2 mb-0 h-12">
          <TabsTrigger value="folders" className="text-sm sm:text-base">
            Folders
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-sm sm:text-base">
            Notes
          </TabsTrigger>
          <TabsTrigger value="editor" className="text-sm sm:text-base">
            Editor
          </TabsTrigger>
        </TabsList>

        {/* Custom tab content container */}
        <div className="flex-grow flex flex-col overflow-hidden relative">
          <AnimatePresence custom={direction} initial={false} mode="wait">
            {/* Folders tab content */}
            {activeTab === "folders" && (
              <motion.div
                key="folders"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.25 }}
                className="h-full flex-grow flex flex-col overflow-hidden"
              >
                <NotesNavbar
                  folders={folders}
                  currentFolder={currentFolder}
                  onFolderChange={handleFolderChange}
                  onCreateFolder={onCreateFolder}
                  onDeleteFolder={onDeleteFolder}
                  onRenameFolder={onRenameFolder}
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  isMobileView={true}
                />
              </motion.div>
            )}

            {/* Notes list tab content */}
            {activeTab === "notes" && (
              <motion.div
                key="notes"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.25 }}
                className="h-full flex-grow flex flex-col overflow-hidden"
              >
                <NotesList
                  notes={filteredNotes}
                  selectedNote={selectedNote}
                  onSelectNote={handleNoteSelection}
                  onCreateNote={handleCreateNote}
                  onDeleteNote={onDeleteNote}
                  loading={notesLoading}
                  currentFolder={currentFolder}
                  isMobileView={true}
                />
              </motion.div>
            )}

            {/* Note editor tab content */}
            {activeTab === "editor" && (
              <motion.div
                key="editor"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.25 }}
                className="h-full flex-grow flex flex-col overflow-hidden"
              >
                <NoteEditingPanel
                  note={selectedNote}
                  onUpdateNote={onUpdateNote}
                  isNewNote={isNewNote}
                  isFullScreen={isFullScreen}
                  onToggleFullScreen={onToggleFullScreen}
                  isMobileView={true}
                  onBackToList={handleBackToNotes}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </Card>
  );
}

export default MobileNotesLayout;
