import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import NotesList from "../components/layout/NotesList";
import NotesNavbar from "../components/layout/NotesNavbar";
import NoteEditingPanel from "../components/layout/NoteEditingPanel";

/**
 * Desktop layout for notes page with resizable panels
 * This is extracted from the original NotesPageLayout component
 */
function DesktopNotesLayout({
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
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PanelGroup direction="horizontal" className="flex-grow overflow-hidden">
        {/* Left sidebar with folders and search - min width 240px (15%) */}
        <Panel
          defaultSize={20}
          minSize={15}
          className="overflow-hidden flex flex-col"
        >
          <NotesNavbar
            folders={folders}
            currentFolder={currentFolder}
            onFolderChange={onFolderChange}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            onRenameFolder={onRenameFolder}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
          />
        </Panel>

        {/* Subtle divider between folders and notes list */}
        <PanelResizeHandle className="w-px bg-border/30 hover:bg-primary/20 transition-colors duration-200" />

        {/* Middle section with notes list - min width 240px (15%) */}
        <Panel
          defaultSize={25}
          minSize={15}
          className="overflow-hidden flex flex-col"
        >
          <NotesList
            notes={filteredNotes}
            selectedNote={selectedNote}
            onSelectNote={onSelectNote}
            onCreateNote={onCreateNote}
            onDeleteNote={onDeleteNote}
            loading={notesLoading}
            currentFolder={currentFolder}
          />
        </Panel>

        {/* Subtle divider between notes list and editor */}
        <PanelResizeHandle className="w-px bg-border/30 hover:bg-primary/20 transition-colors duration-200" />

        {/* Right section with note editor - takes remaining space */}
        <Panel defaultSize={55} className="overflow-hidden flex flex-col">
          <NoteEditingPanel
            note={selectedNote}
            onUpdateNote={onUpdateNote}
            isNewNote={isNewNote}
            isFullScreen={isFullScreen}
            onToggleFullScreen={onToggleFullScreen}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default DesktopNotesLayout;
