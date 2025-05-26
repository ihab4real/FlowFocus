import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  ExternalLink,
  Maximize2,
  FolderIcon,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { debounce } from "lodash";
import { DEFAULT_FOLDER } from "@/features/Notes/utils/constants";
import {
  useNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useFoldersQuery,
} from "@/features/Notes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardNoteEditor from "@/features/Notes/components/editors/DashboardNoteEditor";

const NotesDashboardPanel = () => {
  const [activeNote, setActiveNote] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("New Note");
  const [selectedFolder, setSelectedFolder] = useState(DEFAULT_FOLDER);
  const editorRefs = useRef({});

  const navigate = useNavigate();

  // Use React Query hooks
  const { data: notes = [], isLoading: notesLoading } = useNotesQuery({
    limit: 5,
  });
  const { data: folders = [DEFAULT_FOLDER] } = useFoldersQuery();
  const createNoteMutation = useCreateNoteMutation();
  const updateNoteMutation = useUpdateNoteMutation();

  // Set active note when notes are loaded
  React.useEffect(() => {
    if (notes.length > 0 && !activeNote) {
      setActiveNote(notes[0]._id);
    }
  }, [notes, activeNote]);

  const loading = notesLoading;

  // Handle creating a new note
  const handleCreateNote = async () => {
    try {
      const newNote = await createNoteMutation.mutateAsync({
        title: newNoteTitle,
        content: "",
        folder: selectedFolder,
      });

      setActiveNote(newNote._id);
      setIsCreateDialogOpen(false);
      setNewNoteTitle("New Note");
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error creating note:", error);
    }
  };

  // Handle updating a note
  const handleUpdateNote = debounce(async (id, content) => {
    try {
      await updateNoteMutation.mutateAsync({ id, data: { content } });
    } catch (error) {
      console.error("Error updating note:", error);
    }
  }, 500);

  // Handle fullscreen navigation
  const handleFullScreen = () => {
    if (activeNote) {
      navigate("/dashboard/notepanel", {
        state: { initialNoteId: activeNote },
      });
    } else {
      navigate("/dashboard/notepanel");
    }
  };

  // Handle textarea blur for saving
  const handleBlur = (id, content) => {
    handleUpdateNote.flush(); // Immediately process any pending debounced calls
    toast.success("Note saved", { id: "note-save", duration: 2000 });
  };

  // Open create dialog
  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
    setSelectedFolder(DEFAULT_FOLDER);
    setNewNoteTitle("New Note");
  };

  // If loading, show a loading state
  if (loading) {
    return (
      <Card className="h-full shadow-sm">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6C63FF]"></div>
        </CardContent>
      </Card>
    );
  }

  // If no notes, show a message
  if (notes.length === 0) {
    return (
      <Card className="h-full shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notes</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
              onClick={openCreateDialog}
            >
              New Note
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFullScreen}
              className="transition-all duration-300 ease-in-out border-[#6C63FF]/30 hover:border-[#6C63FF] hover:bg-[#6C63FF]/5 text-[#6C63FF]"
              title="Open in Editor"
            >
              <Maximize2 className="h-4 w-4 hover:scale-110 transition-transform" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-64">
          <p className="text-gray-500 mb-2">No notes yet</p>
          <Button
            variant="outline"
            onClick={openCreateDialog}
            className="text-[#6C63FF] border-[#6C63FF]"
          >
            Create your first note
          </Button>
        </CardContent>

        {/* Create Note Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
              <DialogDescription>
                Create a new note and organize it in a folder
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="folder">Folder</Label>
                <Select
                  value={selectedFolder}
                  onValueChange={setSelectedFolder}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder} value={folder}>
                        {folder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateNote}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-sm flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
        <CardTitle>Notes</CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
            onClick={openCreateDialog}
          >
            New Note
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleFullScreen}
            className="transition-all duration-300 ease-in-out border-[#6C63FF]/30 hover:border-[#6C63FF] hover:bg-[#6C63FF]/5 text-[#6C63FF]"
            title="Open in Editor"
          >
            <Maximize2 className="h-4 w-4 hover:scale-110 transition-transform" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <Tabs
          value={activeNote}
          onValueChange={setActiveNote}
          className="flex flex-col h-full"
        >
          <div className="relative flex-shrink-0">
            <TabsList className="w-full max-w-full overflow-x-auto bg-muted [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex min-w-full px-1">
                {notes.slice(0, 3).map((note) => (
                  <TabsTrigger
                    key={note._id}
                    value={note._id}
                    className="flex-none data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">
                        {note.title.length > 12
                          ? `${note.title.substring(0, 12)}...`
                          : note.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({note.folder || DEFAULT_FOLDER})
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
                {notes.length > 3 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFullScreen}
                    className="flex-none text-[#6C63FF] hover:text-[#6C63FF]/80 ml-2"
                  >
                    See More
                  </Button>
                )}
              </div>
            </TabsList>
          </div>

          {notes.map((note) => (
            <TabsContent
              key={note._id}
              value={note._id}
              className="mt-4 flex-grow overflow-hidden flex flex-col"
              hidden={note._id !== activeNote}
            >
              <div className="border-b border-border pb-2 mb-2 flex-shrink-0">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C63FF]"
                    onClick={() =>
                      editorRefs.current[note._id]?.commands.toggleBold()
                    }
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C63FF]"
                    onClick={() =>
                      editorRefs.current[note._id]?.commands.toggleItalic()
                    }
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C63FF]"
                    onClick={() =>
                      editorRefs.current[note._id]?.commands.toggleBulletList()
                    }
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C63FF]"
                    onClick={() =>
                      editorRefs.current[note._id]?.commands.toggleOrderedList()
                    }
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="h-40 overflow-y-auto flex-grow scrollbar-hide">
                <DashboardNoteEditor
                  content={note.content}
                  onUpdate={(content) => handleUpdateNote(note._id, content)}
                  onBlur={() => handleBlur(note._id, note.content)}
                  editorRef={(editor) =>
                    (editorRefs.current[note._id] = editor)
                  }
                  className="min-h-full"
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Create a new note and organize it in a folder
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="folder">Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNote}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default NotesDashboardPanel;
