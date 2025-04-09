import { useState } from "react";
import {
  FolderIcon,
  PlusIcon,
  SearchIcon,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
import { DEFAULT_FOLDER } from "../constants";

const NotesNavbar = ({
  folders,
  currentFolder,
  onFolderChange,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  searchQuery,
  onSearchChange,
}) => {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [folderToRename, setFolderToRename] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [activeFolderMenu, setActiveFolderMenu] = useState(null);

  const handleFolderSubmit = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setShowFolderModal(false);
    }
  };

  const handleFolderMenuToggle = (e, folder) => {
    e.stopPropagation();
    if (activeFolderMenu === folder) {
      setActiveFolderMenu(null);
    } else {
      setActiveFolderMenu(folder);
    }
  };

  const handleDeleteClick = (e, folder) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setShowConfirmModal(true);
    setActiveFolderMenu(null);
  };

  const handleRenameClick = (e, folder) => {
    e.stopPropagation();
    setFolderToRename(folder);
    setRenameFolderValue(folder);
    setShowRenameModal(true);
    setActiveFolderMenu(null);
  };

  const confirmDelete = () => {
    onDeleteFolder(folderToDelete);
    setShowConfirmModal(false);
    setFolderToDelete(null);
  };

  const confirmRename = (e) => {
    e.preventDefault();
    if (renameFolderValue.trim() && renameFolderValue !== folderToRename) {
      onRenameFolder(folderToRename, renameFolderValue.trim());
      setShowRenameModal(false);
      setFolderToRename(null);
      setRenameFolderValue("");
    } else if (renameFolderValue === folderToRename) {
      // Just close the modal if the name hasn't changed
      setShowRenameModal(false);
    }
  };

  // Close any open menu when clicking elsewhere
  const handleClickOutside = () => {
    setActiveFolderMenu(null);
  };

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col overflow-hidden">
      {/* Search input */}
      <div className="relative mb-4 flex-shrink-0">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Folder header with add button */}
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Folders
        </h2>
        <button
          onClick={() => setShowFolderModal(true)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Add folder"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Folder list */}
      <div className="overflow-y-auto flex-grow scrollbar-hide" onClick={handleClickOutside}>
        <ul className="space-y-1">
          {folders.map((folder) => (
            <li key={folder} className="relative">
              <div
                onClick={() => onFolderChange(folder)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer ${
                  currentFolder === folder
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                    : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center truncate">
                  <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{folder}</span>
                </div>
                {folder !== DEFAULT_FOLDER && (
                  <button
                    onClick={(e) => handleFolderMenuToggle(e, folder)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    aria-label="Folder menu"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Folder action menu */}
              {activeFolderMenu === folder && (
                <div className="absolute right-0 mt-1 w-40 z-10 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1">
                  <button
                    onClick={(e) => handleRenameClick(e, folder)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Rename folder
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, folder)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete folder
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Create folder modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
              Create New Folder
            </h3>
            <form onSubmit={handleFolderSubmit}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full mb-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename folder modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
              Rename Folder
            </h3>
            <form onSubmit={confirmRename}>
              <input
                type="text"
                value={renameFolderValue}
                onChange={(e) => setRenameFolderValue(e.target.value)}
                placeholder="New folder name"
                className="w-full mb-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete folder confirmation modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
              Delete Folder
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete "{folderToDelete}"? All notes in
              this folder will be moved to the General folder.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesNavbar;
