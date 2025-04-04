import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bold, Italic, List, ListOrdered, ExternalLink } from "lucide-react";
import noteService from "@/services/api/noteService";
import { toast } from "react-hot-toast";
import { debounce } from "lodash";

export function NotesPanel() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch notes when component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await noteService.getNotes({ limit: 5 });
        const fetchedNotes = response.data.notes || [];
        setNotes(fetchedNotes);
        if (fetchedNotes.length > 0) {
          setActiveNote(fetchedNotes[0]._id);
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Handle creating a new note
  const handleCreateNote = async () => {
    try {
      const response = await noteService.create({
        title: "New Note",
        content: "",
      });
      
      setNotes([response.data.note, ...notes]);
      setActiveNote(response.data.note._id);
      toast.success("Note created");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  // Handle updating a note
  const handleUpdateNote = debounce(async (id, content) => {
    try {
      await noteService.update(id, { content });
    } catch (error) {
      console.error("Error updating note:", error);
    }
  }, 500);

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
          <Button 
            size="sm" 
            className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
            onClick={handleCreateNote}
          >
            New Note
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-64">
          <p className="text-gray-500 mb-2">No notes yet</p>
          <Button 
            variant="outline" 
            onClick={handleCreateNote}
            className="text-[#6C63FF] border-[#6C63FF]"
          >
            Create your first note
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notes</CardTitle>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
            onClick={handleCreateNote}
          >
            New Note
          </Button>
          <Link 
            to="/dashboard/notepanel"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[#6C63FF] text-[#6C63FF] hover:bg-accent hover:text-accent-foreground px-3 py-1.5"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Full View
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeNote} onValueChange={setActiveNote}>
          <TabsList className="w-full bg-muted">
            {notes.slice(0, 3).map((note) => (
              <TabsTrigger
                key={note._id}
                value={note._id}
                className="flex-1 data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white"
              >
                {note.title.length > 15 
                  ? `${note.title.substring(0, 15)}...` 
                  : note.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {notes.map((note) => (
            <TabsContent 
              key={note._id} 
              value={note._id} 
              className="mt-4"
              // Only render the selected tab's content to optimize performance
              hidden={note._id !== activeNote}
            >
              <div className="border-b border-border pb-2 mb-2">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C63FF]"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C63FF]"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C63FF]"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C63FF]"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <textarea
                className="w-full h-40 bg-background resize-none p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6C63FF] font-mono"
                defaultValue={note.content.replace(/<[^>]*>/g, '')} // Strip HTML tags for plain text display
                onChange={(e) => handleUpdateNote(note._id, e.target.value)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
