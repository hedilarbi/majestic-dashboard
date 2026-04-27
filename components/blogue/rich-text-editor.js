"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";

const TOOLBAR_BUTTON_BASE_CLASS =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2";

const TOOLBAR_BUTTON_IDLE_CLASS =
  "border-slate-200 bg-white text-slate-700 hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus:ring-primary/20";

const TOOLBAR_BUTTON_ACTIVE_CLASS =
  "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-emerald-200";

const isEmptyHtml = (value) =>
  String(value || "")
    .replace(/<p><\/p>/g, "")
    .replace(/<p><br><\/p>/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/<[^>]+>/g, "")
    .trim().length === 0;

const ToolbarButton = ({
  label,
  title,
  isActive = false,
  onClick,
  disabled = false,
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    aria-pressed={isActive}
    className={`${TOOLBAR_BUTTON_BASE_CLASS} ${
      isActive ? TOOLBAR_BUTTON_ACTIVE_CLASS : TOOLBAR_BUTTON_IDLE_CLASS
    } disabled:cursor-not-allowed disabled:opacity-50`}
  >
    {label}
  </button>
);

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Saisissez votre contenu...",
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: String(value || ""),
    editorProps: {
      attributes: {
        class:
          "min-h-[18rem] px-5 py-4 text-sm leading-7 text-slate-800 selection:bg-primary/20 selection:text-slate-950 focus:outline-none [&_.ProseMirror-selectednode]:outline-none [&_.ProseMirror-selectednode]:rounded-lg [&_.ProseMirror-selectednode]:bg-primary/10 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-5 [&_h3]:text-2xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:text-xl [&_h4]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextHtml = String(value || "");
    const currentHtml = editor.getHTML();

    if (nextHtml !== currentHtml) {
      editor.commands.setContent(nextHtml, { emitUpdate: false });
    }
  }, [editor, value]);

  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) {
        return {
          paragraph: false,
          heading2: false,
          heading3: false,
          heading4: false,
          bold: false,
          italic: false,
          underline: false,
          bulletList: false,
          orderedList: false,
          alignLeft: false,
          alignCenter: false,
          alignJustify: false,
          link: false,
        };
      }

      return {
        paragraph: currentEditor.isActive("paragraph"),
        heading2: currentEditor.isActive("heading", { level: 2 }),
        heading3: currentEditor.isActive("heading", { level: 3 }),
        heading4: currentEditor.isActive("heading", { level: 4 }),
        bold: currentEditor.isActive("bold"),
        italic: currentEditor.isActive("italic"),
        underline: currentEditor.isActive("underline"),
        bulletList: currentEditor.isActive("bulletList"),
        orderedList: currentEditor.isActive("orderedList"),
        alignLeft: currentEditor.isActive({ textAlign: "left" }),
        alignCenter: currentEditor.isActive({ textAlign: "center" }),
        alignJustify: currentEditor.isActive({ textAlign: "justify" }),
        link: currentEditor.isActive("link"),
      };
    },
  });

  const handleLink = () => {
    if (!editor || typeof window === "undefined") {
      return;
    }

    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("URL du lien", previousUrl);

    if (url === null) {
      return;
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmedUrl }).run();
  };

  if (!editor) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-3 py-3">
          {["P", "H2", "B", "I", "•"].map((item) => (
            <div
              key={item}
              className="h-10 w-10 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
        <div className="min-h-[18rem] animate-pulse bg-slate-50/70" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-3">
        <ToolbarButton
          label="P"
          title="Paragraphe"
          isActive={editorState.paragraph}
          onClick={() => editor.chain().focus().setParagraph().run()}
        />
        <ToolbarButton
          label="H2"
          title="Titre 2"
          isActive={editorState.heading2}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolbarButton
          label="H3"
          title="Titre 3"
          isActive={editorState.heading3}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
        <ToolbarButton
          label="H4"
          title="Titre 4"
          isActive={editorState.heading4}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
        />
        <ToolbarButton
          label="B"
          title="Gras"
          isActive={editorState.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          title="Italique"
          isActive={editorState.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="U"
          title="Souligné"
          isActive={editorState.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="•"
          title="Liste à puces"
          isActive={editorState.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1."
          title="Liste numérotée"
          isActive={editorState.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="⟵"
          title="Aligner à gauche"
          isActive={editorState.alignLeft}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        />
        <ToolbarButton
          label="≡"
          title="Centrer"
          isActive={editorState.alignCenter}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <ToolbarButton
          label="≣"
          title="Justifier"
          isActive={editorState.alignJustify}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        />
        <ToolbarButton
          label="Lien"
          title="Ajouter ou modifier un lien"
          isActive={editorState.link}
          onClick={handleLink}
        />
        <ToolbarButton
          label="↶"
          title="Annuler"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        />
        <ToolbarButton
          label="↷"
          title="Rétablir"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        />
      </div>

      <div className="relative">
        <EditorContent editor={editor} />
        {isEmptyHtml(value) ? (
          <div className="pointer-events-none absolute left-5 top-4 text-sm text-slate-400">
            {placeholder}
          </div>
        ) : null}
      </div>
    </div>
  );
}
