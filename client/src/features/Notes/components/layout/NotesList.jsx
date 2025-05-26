import { useState } from "react";
import { PlusIcon, Trash2Icon, FolderIcon } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NotesList = ({
  notes,
  selectedNote,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  loading,
  currentFolder,
}) => {
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Function to format the note preview (strip HTML tags and truncate)
  const formatPreview = (content) => {
    // Simple HTML tag stripping (a more robust solution might be needed for production)
    const strippedContent = content.replace(/<[^>]*>/g, "");
    return strippedContent.length > 100
      ? `${strippedContent.substring(0, 100)}...`
      : strippedContent;
  };

  const handleDeleteClick = (e, note) => {
    e.stopPropagation();
    setNoteToDelete(note);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      onDeleteNote(noteToDelete._id);
      setShowDeleteAlert(false);
      setNoteToDelete(null);
    }
  };

  return (
    <Card className="h-full w-full border-r border-border flex flex-col overflow-hidden shadow-sm bg-card">
      {/* Header with folder name and create button */}
      <CardHeader className="border-b border-border flex flex-row items-center justify-between py-3 px-4 space-y-0 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {currentFolder || "Notes"}
          </CardTitle>
        </div>
        <Button
          onClick={onCreateNote}
          size="icon"
          className="h-8 w-8"
          aria-label="Create note"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </CardHeader>

      {/* Notes list */}
      <CardContent className="overflow-y-auto flex-grow p-0 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary shadow-md"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
            <p className="text-muted-foreground mb-3">
              No notes in this folder
            </p>
            <Button
              variant="outline"
              onClick={onCreateNote}
              className="text-primary border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Create one now
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notes.map((note) => (
              <li key={note._id}>
                <div
                  className={`p-4 cursor-pointer transition-all duration-200 hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] ${
                    selectedNote && selectedNote._id === note._id
                      ? "bg-primary/10 border-l-4 border-primary shadow-sm"
                      : "border-l-4 border-transparent"
                  }`}
                  onClick={() => onSelectNote(note)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-primary mb-1 truncate">
                      {note.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-70 hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 rounded-full hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                      onClick={(e) => handleDeleteClick(e, note)}
                      aria-label="Delete note"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {formatPreview(note.content)}
                  </p>
                  <p className="text-xs flex items-center gap-1 text-muted-foreground/80 font-medium">
                    {format(new Date(note.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Delete note confirmation dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{noteToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default NotesList;
