import { useRef, useState, useEffect, useCallback } from "react";
import { FloatingToolbar } from "./FloatingToolbar";
import { SlashMenu } from "./SlashMenu";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null!);
  const [slashPosition, setSlashPosition] = useState<{ top: number; left: number } | null>(null);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [capturedContent, setCapturedContent] = useState(content);
  const isInitializedRef = useRef(false);

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      editorRef.current.innerHTML = content || "";
      isInitializedRef.current = true;
    }
  }, [content]);

  // Reset when content changes externally (e.g., switching notes)
  useEffect(() => {
    if (editorRef.current && isInitializedRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== content) {
        editorRef.current.innerHTML = content || "";
      }
    }
  }, [content]);

  // Debounced capture (300ms)
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    clearTimeout(captureTimerRef.current);
    captureTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        setCapturedContent(editorRef.current.innerHTML);
      }
    }, 300);
  }, []);

  // Debounced save (500ms after capture)
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (capturedContent !== content) {
        onChange(capturedContent);
      }
    }, 500);

    return () => clearTimeout(saveTimerRef.current);
  }, [capturedContent, content, onChange]);

  useEffect(() => {
    return () => {
      clearTimeout(captureTimerRef.current);
      clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "/" && editorRef.current) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const text = range.startContainer.textContent || "";
      const offset = range.startOffset;

      // Show slash menu if at start of line or after whitespace
      if (offset === 0 || text[offset - 1] === "\n" || text.trim() === "") {
        e.preventDefault();
        const rect = range.getBoundingClientRect();
        const containerRect = editorRef.current.getBoundingClientRect();
        setSlashPosition({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left,
        });
      }
    }

    if (e.key === "Escape" && slashPosition) {
      setSlashPosition(null);
    }
  };

  const handleSlashCommand = (command: string) => {
    setSlashPosition(null);
    if (!editorRef.current) return;

    const commandMap: Record<string, () => void> = {
      h1: () => document.execCommand("formatBlock", false, "h1"),
      h2: () => document.execCommand("formatBlock", false, "h2"),
      h3: () => document.execCommand("formatBlock", false, "h3"),
      bullet: () => document.execCommand("insertUnorderedList"),
      numbered: () => document.execCommand("insertOrderedList"),
      quote: () => document.execCommand("formatBlock", false, "blockquote"),
      divider: () => document.execCommand("insertHorizontalRule"),
      todo: () => {
        document.execCommand(
          "insertHTML",
          false,
          '<div class="flex items-center gap-2"><input type="checkbox" /><span>Todo item</span></div>'
        );
      },
      callout: () => {
        document.execCommand(
          "insertHTML",
          false,
          '<div style="background:rgba(255,255,255,0.04);border-left:3px solid rgba(255,255,255,0.2);padding:12px;border-radius:4px;margin:8px 0;">Callout text</div>'
        );
      },
      page: () => {
        // Page creation is handled at a higher level
      },
    };

    const action = commandMap[command];
    if (action) {
      editorRef.current.focus();
      action();
      handleInput();
    }
  };

  const isEmpty = !content || content === "" || content === "<br>";

  return (
    <div className="relative flex-1 min-h-0">
      <FloatingToolbar containerRef={editorRef} />
      <SlashMenu
        position={slashPosition}
        onClose={() => setSlashPosition(null)}
        onCommand={handleSlashCommand}
      />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="glass-surface rounded-lg p-4 min-h-[200px] text-sm text-white/70 leading-relaxed focus:outline-none focus:ring-1 focus:ring-white/[0.08] transition-all duration-300 prose prose-invert max-w-none [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-white/90 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white/90 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white/90 [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
      />
      {isEmpty && (
        <div className="absolute top-4 left-4 text-sm text-white/30 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}
