import { PlusIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";

const NotesList = ({
  notes,
  selectedNote,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  loading
}) => {
  // Function to format the note preview (strip HTML tags and truncate)
  const formatPreview = (content) => {
    // Simple HTML tag stripping (a more robust solution might be needed for production)
    const strippedContent = content.replace(/<[^>]*>/g, '');
    return strippedContent.length > 100
      ? `${strippedContent.substring(0, 100)}...`
      : strippedContent;
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header with create button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h2>
        <button
          onClick={onCreateNote}
          className="p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Create note"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Notes list */}
      <div className="overflow-y-auto flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No notes in this folder</p>
            <button
              onClick={onCreateNote}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Create one now
            </button>
          </div>
        ) : (
          <ul>
            {notes.map((note) => (
              <li key={note._id} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                    selectedNote && selectedNote._id === note._id
                      ? "bg-indigo-50 dark:bg-indigo-900"
                      : ""
                  }`}
                  onClick={() => onSelectNote(note)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                      {note.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this note?")) {
                          onDeleteNote(note._id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1"
                      aria-label="Delete note"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                    {formatPreview(note.content)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {format(new Date(note.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotesList; 