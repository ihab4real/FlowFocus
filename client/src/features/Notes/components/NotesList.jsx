import { PlusIcon, Trash2Icon, FolderIcon } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotesList = ({
  notes,
  selectedNote,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  loading,
  currentFolder,
}) => {
  // Function to format the note preview (strip HTML tags and truncate)
  const formatPreview = (content) => {
    // Simple HTML tag stripping (a more robust solution might be needed for production)
    const strippedContent = content.replace(/<[^>]*>/g, "");
    return strippedContent.length > 100
      ? `${strippedContent.substring(0, 100)}...`
      : strippedContent;
  };

  return (
    <Card className="w-80 h-full border-r border-border flex flex-col overflow-hidden">
      {/* Header with folder name and create button */}
      <CardHeader className="border-b border-border flex flex-row items-center justify-between py-3 px-4 space-y-0">
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
      <CardContent className="overflow-y-auto flex-grow p-0">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
            <p className="text-muted-foreground mb-2">
              No notes in this folder
            </p>
            <Button
              variant="outline"
              onClick={onCreateNote}
              className="text-primary border-primary"
            >
              Create one now
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notes.map((note) => (
              <li key={note._id}>
                <div
                  className={`p-4 hover:bg-muted cursor-pointer transition-colors ${
                    selectedNote && selectedNote._id === note._id
                      ? "bg-primary/10 border-l-4 border-primary"
                      : ""
                  }`}
                  onClick={() => onSelectNote(note)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-card-foreground mb-1 truncate">
                      {note.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm("Are you sure you want to delete this note?")
                        ) {
                          onDeleteNote(note._id);
                        }
                      }}
                      aria-label="Delete note"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {formatPreview(note.content)}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {format(new Date(note.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default NotesList;
