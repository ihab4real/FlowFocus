import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  CheckSquare,
  Activity,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useSearchStore } from "@/stores/useSearchStore";

export function SearchResults() {
  const {
    results,
    isSearching,
    isOpen,
    selectedCategory,
    focusedIndex,
    closeSearch,
    setSelectedCategory,
    error,
  } = useSearchStore();
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        closeSearch();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && resultsRef.current) {
      const focusedElement = resultsRef.current.querySelector(
        `[data-index="${focusedIndex}"]`
      );
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  if (!isOpen) return null;

  const hasResults =
    results &&
    ((results.tasks && results.tasks.length > 0) ||
      (results.notes && results.notes.length > 0) ||
      (results.habits && results.habits.length > 0));

  const navigateToItem = (type, id, item = {}) => {
    closeSearch();
    switch (type) {
      case "task":
        navigate(`/dashboard/taskboard?taskId=${id}`);
        break;
      case "note":
        navigate(`/dashboard/notepanel`, {
          state: {
            initialNoteId: id,
            folderToOpen: item.folder,
          },
        });
        break;
      case "habit":
        navigate(`/dashboard/habits?habitId=${id}`);
        break;
      default:
        break;
    }
  };

  // Calculate current index for keyboard navigation
  let currentIndex = -1;

  return (
    <div
      ref={resultsRef}
      className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-md max-h-[70vh] overflow-y-auto z-50 p-2"
    >
      {/* Category tabs */}
      <div className="flex border-b border-border mb-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-2 text-sm ${
            selectedCategory === "all"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedCategory("tasks")}
          className={`px-3 py-2 text-sm flex items-center ${
            selectedCategory === "tasks"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          <CheckSquare className="w-4 h-4 mr-1" />
          Tasks
        </button>
        <button
          onClick={() => setSelectedCategory("notes")}
          className={`px-3 py-2 text-sm flex items-center ${
            selectedCategory === "notes"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          <FileText className="w-4 h-4 mr-1" />
          Notes
        </button>
        <button
          onClick={() => setSelectedCategory("habits")}
          className={`px-3 py-2 text-sm flex items-center ${
            selectedCategory === "habits"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Activity className="w-4 h-4 mr-1" />
          Habits
        </button>
      </div>

      {/* Loading state */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Searching...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isSearching && (
        <div className="flex items-center justify-center py-8 text-destructive">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* No results state */}
      {!isSearching && !error && !hasResults && (
        <div className="text-center py-8 text-muted-foreground">
          No results found
        </div>
      )}

      {/* Results */}
      {!isSearching && !error && hasResults && (
        <div>
          {/* Task results */}
          {(selectedCategory === "all" || selectedCategory === "tasks") &&
            results.tasks &&
            results.tasks.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  TASKS
                </h3>
                <ul>
                  {results.tasks.map((task) => {
                    currentIndex++;
                    const isFocused = focusedIndex === currentIndex;
                    return (
                      <li
                        key={task._id}
                        data-index={currentIndex}
                        className={`px-3 py-2 rounded-md cursor-pointer flex items-start ${
                          isFocused
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => navigateToItem("task", task._id)}
                      >
                        <CheckSquare className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-xs mt-0.5 line-clamp-1">
                              {task.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {task.status} • {task.priority}
                            {task.dueDate &&
                              ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

          {/* Note results */}
          {(selectedCategory === "all" || selectedCategory === "notes") &&
            results.notes &&
            results.notes.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  NOTES
                </h3>
                <ul>
                  {results.notes.map((note) => {
                    currentIndex++;
                    const isFocused = focusedIndex === currentIndex;
                    return (
                      <li
                        key={note._id}
                        data-index={currentIndex}
                        className={`px-3 py-2 rounded-md cursor-pointer flex items-start ${
                          isFocused
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => navigateToItem("note", note._id, note)}
                      >
                        <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{note.title}</div>
                          {note.snippet && (
                            <div className="text-xs mt-1 line-clamp-2">
                              {note.snippet}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {note.folder} • Last edited:{" "}
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

          {/* Habit results */}
          {(selectedCategory === "all" || selectedCategory === "habits") &&
            results.habits &&
            results.habits.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  HABITS
                </h3>
                <ul>
                  {results.habits.map((habit) => {
                    currentIndex++;
                    const isFocused = focusedIndex === currentIndex;
                    return (
                      <li
                        key={habit._id}
                        data-index={currentIndex}
                        className={`px-3 py-2 rounded-md cursor-pointer flex items-start ${
                          isFocused
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => navigateToItem("habit", habit._id)}
                      >
                        <Activity className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{habit.name}</div>
                          {habit.description && (
                            <div className="text-xs mt-0.5 line-clamp-1">
                              {habit.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {habit.category} • {habit.type}
                            {habit.targetValue &&
                              habit.unit &&
                              ` • Target: ${habit.targetValue} ${habit.unit}`}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
