import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

export function NotesPanel() {
  const [activeNote, setActiveNote] = useState("note-1");

  // Sample data - in a real app, this would come from your API
  const notes = [
    {
      id: "note-1",
      title: "Project Ideas",
      content: "Implement drag and drop for tasks\nAdd calendar integration",
    },
    {
      id: "note-2",
      title: "Meeting Notes",
      content: "Discuss MongoDB schema\nReview UI designs",
    },
  ];

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notes</CardTitle>
        <Button size="sm" className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
          New Note
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="note-1" onValueChange={setActiveNote}>
          <TabsList className="w-full bg-muted">
            {notes.map((note) => (
              <TabsTrigger
                key={note.id}
                value={note.id}
                className="flex-1 data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white"
              >
                {note.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {notes.map((note) => (
            <TabsContent key={note.id} value={note.id} className="mt-4">
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
                defaultValue={note.content}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
