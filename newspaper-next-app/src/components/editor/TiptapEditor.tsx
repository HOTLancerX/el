'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
  editorRef?: React.MutableRefObject<Editor | null>; // Optional ref to access editor instance
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, editorRef }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure options for StarterKit extensions here
        // For example, to disable heading levels:
        // heading: { levels: [1, 2, 3] },
      }),
      // Add more extensions as needed (e.g., Link, Image, Placeholder)
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none p-3 border border-gray-300 rounded-md min-h-[200px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = editor;
    }
    return () => {
      if (editorRef) {
        editorRef.current = null;
      }
    };
  }, [editor, editorRef]);


  if (!editor) {
    return null;
  }

  return (
    <div>
      {/* Basic Toolbar Placeholder - In a real app, build a proper toolbar */}
      <div className="border border-gray-300 rounded-t-md p-2 bg-gray-50 space-x-1">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active px-2 py-1 bg-gray-200 rounded' : 'px-2 py-1 hover:bg-gray-200 rounded'}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active px-2 py-1 bg-gray-200 rounded' : 'px-2 py-1 hover:bg-gray-200 rounded'}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active px-2 py-1 bg-gray-200 rounded' : 'px-2 py-1 hover:bg-gray-200 rounded'}>Strike</button>
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'is-active px-2 py-1 bg-gray-200 rounded' : 'px-2 py-1 hover:bg-gray-200 rounded'}>Paragraph</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active px-2 py-1 bg-gray-200 rounded' : 'px-2 py-1 hover:bg-gray-200 rounded'}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active px-2 py-1 bg-gray-200 rounded' : 'px-2 py-1 hover:bg-gray-200 rounded'}>H2</button>
        {/* Add more buttons for other formatting options */}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
