import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

// Initialize lowlight with common languages
const lowlight = createLowlight(common);

// Component for the toolbar buttons
const ToolbarButton = ({ title, icon, onClick, isActive }) => (
  <button
    title={title}
    onClick={onClick}
    className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
      isActive
        ? "bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
        : ""
    }`}
    type="button"
  >
    {icon}
  </button>
);

// Toolbar component
const MenuBar = ({ editor, isMobileView = false }) => {
  // Define callbacks for link and image
  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  // Handler for adding an image
  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const iconSize = isMobileView ? "h-3.5 w-3.5" : "h-4 w-4";
  const dividerHeight = isMobileView ? "h-5" : "h-6";
  const spacingClass = isMobileView ? "space-x-1" : "space-x-2";
  const paddingClass = isMobileView ? "py-1.5" : "py-2 mb-2";

  return (
    <div
      className={`flex items-center ${spacingClass} ${paddingClass} border-b border-gray-200 dark:border-gray-700 overflow-x-auto`}
    >
      <ToolbarButton
        title="Bold"
        icon={<Bold className={iconSize} />}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
      />
      <ToolbarButton
        title="Italic"
        icon={<Italic className={iconSize} />}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
      />
      <ToolbarButton
        title="Underline"
        icon={<UnderlineIcon className={iconSize} />}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
      />
      <div className={`w-px ${dividerHeight} bg-gray-200 dark:bg-gray-700`} />
      <ToolbarButton
        title="Heading 1"
        icon={<Heading1 className={iconSize} />}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
      />
      <ToolbarButton
        title="Heading 2"
        icon={<Heading2 className={iconSize} />}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
      />
      <div className={`w-px ${dividerHeight} bg-gray-200 dark:bg-gray-700`} />
      <ToolbarButton
        title="Bullet List"
        icon={<List className={iconSize} />}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
      />
      <ToolbarButton
        title="Ordered List"
        icon={<ListOrdered className={iconSize} />}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
      />
      <div className={`w-px ${dividerHeight} bg-gray-200 dark:bg-gray-700`} />
      <ToolbarButton
        title="Code Block"
        icon={<Code className={iconSize} />}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
      />
      <ToolbarButton
        title="Link"
        icon={<LinkIcon className={iconSize} />}
        onClick={addLink}
        isActive={editor.isActive("link")}
      />
      <ToolbarButton
        title="Image"
        icon={<ImageIcon className={iconSize} />}
        onClick={addImage}
      />
      <div className={`w-px ${dividerHeight} bg-gray-200 dark:bg-gray-700`} />
      <ToolbarButton
        title="Align Left"
        icon={<AlignLeft className={iconSize} />}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
      />
      <ToolbarButton
        title="Align Center"
        icon={<AlignCenter className={iconSize} />}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
      />
      <ToolbarButton
        title="Align Right"
        icon={<AlignRight className={iconSize} />}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
      />
    </div>
  );
};

// Main Rich Text Editor component
const RichTextEditor = ({
  content,
  onUpdate,
  isFullScreen,
  isMobileView = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Exclude codeBlock as we're adding CodeBlockLowlight separately
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing here...",
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none h-full ${isMobileView ? "prose-sm" : ""}`,
      },
    },
  });

  // Update content when it changes from parent
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Apply different styles based on full-screen mode
  const editorContainerClasses = isFullScreen
    ? "p-8 h-full overflow-y-auto"
    : "p-4 h-full overflow-y-auto";

  return (
    <div
      className={`${editorContainerClasses} ${isMobileView ? "px-3 py-2" : ""}`}
    >
      <MenuBar editor={editor} isMobileView={isMobileView} />
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};

export default RichTextEditor;
