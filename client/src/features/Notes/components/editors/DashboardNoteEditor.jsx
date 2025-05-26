import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

// Dashboard version of TipTap editor for dashboard panel
const DashboardNoteEditor = ({
  content,
  onUpdate,
  onBlur,
  editorRef,
  className = "",
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something...",
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onBlur: ({ editor }) => {
      if (onBlur) onBlur();
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none ${className}`,
      },
    },
  });

  // Update content when it changes from parent
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Store editor reference
  useEffect(() => {
    if (editor && editorRef) {
      editorRef(editor);
    }
  }, [editor, editorRef]);

  return <EditorContent editor={editor} className="h-full" />;
};

export default DashboardNoteEditor;
