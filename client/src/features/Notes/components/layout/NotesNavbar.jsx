import { useState } from "react";
import {
  FolderIcon,
  PlusIcon,
  SearchIcon,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
import { DEFAULT_FOLDER } from "@/features/Notes/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const NotesNavbar = ({
  folders,
  currentFolder,
  onFolderChange,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  searchQuery,
  onSearchChange,
  isMobileView = false,
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

  const containerClasses = isMobileView
    ? "w-full h-full bg-card p-3 flex flex-col overflow-hidden"
    : "w-full h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col overflow-hidden";

  // Animation variants for folder items
  const folderVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
      },
    }),
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
      },
    },
    tap: {
      scale: 0.98,
      backgroundColor: "rgba(108, 99, 255, 0.1)",
    },
  };

  // Animation for folder menu
  const menuVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -5 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } },
  };

  return (
    <div className={containerClasses}>
      {/* Search input */}
      <div
        className={`relative ${isMobileView ? "mb-3" : "mb-4"} flex-shrink-0`}
      >
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-4 w-4 text-gray-400" />
        </span>
        <Input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full pl-10 pr-4 ${isMobileView ? "py-1.5 text-sm" : "py-2"}`}
        />
      </div>

      {/* Folder header with add button */}
      <div
        className={`flex justify-between items-center ${isMobileView ? "mb-1.5" : "mb-2"} flex-shrink-0`}
      >
        <h2
          className={`${isMobileView ? "text-base" : "text-lg"} font-semibold text-gray-900 dark:text-gray-100`}
        >
          Folders
        </h2>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size={isMobileView ? "sm" : "default"}
            onClick={() => setShowFolderModal(true)}
            className={`h-7 w-7 p-0 rounded-full text-primary hover:text-primary hover:bg-primary/10`}
            aria-label="Add folder"
          >
            <PlusIcon className={`${isMobileView ? "h-4 w-4" : "h-5 w-5"}`} />
          </Button>
        </motion.div>
      </div>

      {/* Folder list */}
      <div
        className="overflow-y-auto flex-grow scrollbar-hide"
        onClick={handleClickOutside}
      >
        <motion.ul
          className={`${isMobileView ? "space-y-0.5" : "space-y-1"}`}
          initial="hidden"
          animate="visible"
        >
          {folders.map((folder, index) => (
            <motion.li
              key={folder}
              className="relative"
              variants={folderVariants}
              custom={index}
            >
              <motion.div
                onClick={() => onFolderChange(folder)}
                className={`w-full flex items-center justify-between ${isMobileView ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} rounded-md cursor-pointer ${
                  currentFolder === folder
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                    : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                whileHover={isMobileView ? {} : "hover"}
                whileTap={
                  isMobileView
                    ? { backgroundColor: "rgba(108, 99, 255, 0.1)" }
                    : "tap"
                }
              >
                <div className="flex items-center truncate">
                  <FolderIcon
                    className={`${isMobileView ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-2"} flex-shrink-0`}
                  />
                  <span
                    className={`truncate ${isMobileView ? "text-sm" : "text-sm"} font-medium`}
                  >
                    {folder}
                  </span>
                </div>
                {folder !== DEFAULT_FOLDER && (
                  <motion.button
                    onClick={(e) => handleFolderMenuToggle(e, folder)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    aria-label="Folder menu"
                    whileTap={{ scale: 0.9 }}
                  >
                    <MoreVertical
                      className={`${isMobileView ? "h-3.5 w-3.5" : "h-4 w-4"}`}
                    />
                  </motion.button>
                )}
              </motion.div>

              {/* Folder action menu with AnimatePresence for smooth transitions */}
              <AnimatePresence>
                {activeFolderMenu === folder && (
                  <motion.div
                    className={`absolute right-0 mt-1 ${isMobileView ? "w-32" : "w-40"} z-10 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1`}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={menuVariants}
                  >
                    <motion.button
                      onClick={(e) => handleRenameClick(e, folder)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                      whileTap={{
                        scale: 0.95,
                        backgroundColor: "rgba(108, 99, 255, 0.1)",
                      }}
                    >
                      <Edit
                        className={`${isMobileView ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-2"}`}
                      />
                      Rename folder
                    </motion.button>
                    <motion.button
                      onClick={(e) => handleDeleteClick(e, folder)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                      whileTap={{
                        scale: 0.95,
                        backgroundColor: "rgba(240, 82, 82, 0.1)",
                      }}
                    >
                      <Trash2
                        className={`${isMobileView ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-2"}`}
                      />
                      Delete folder
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* Create folder modal */}
      <AnimatePresence>
        {showFolderModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${isMobileView ? "w-[85%] max-w-xs" : "w-80"}`}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                Create New Folder
              </h3>
              <form onSubmit={handleFolderSubmit}>
                <Input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full mb-4"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowFolderModal(false)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button type="submit" variant="default">
                      Create
                    </Button>
                  </motion.div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm delete folder modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${isMobileView ? "w-[85%] max-w-xs" : "w-80"}`}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                Delete Folder
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Are you sure you want to delete "{folderToDelete}"? All notes in
                this folder will move to the General folder.
              </p>
              <div className="flex justify-end space-x-2">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={confirmDelete}
                  >
                    Delete
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename folder modal */}
      <AnimatePresence>
        {showRenameModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${isMobileView ? "w-[85%] max-w-xs" : "w-80"}`}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                Rename Folder
              </h3>
              <form onSubmit={confirmRename}>
                <Input
                  type="text"
                  value={renameFolderValue}
                  onChange={(e) => setRenameFolderValue(e.target.value)}
                  placeholder="Folder name"
                  className="w-full mb-4"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRenameModal(false)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button type="submit" variant="default">
                      Rename
                    </Button>
                  </motion.div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesNavbar;
