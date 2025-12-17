import { useRef, useState, useCallback, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import SnippetsPanel from './components/SnippetsPanel';
import { BookMarked, GripHorizontal } from 'lucide-react';
import { useResizablePanel } from './hooks/useResizablePanel';

function App() {
  const editorRef = useRef<{ setValue: (value: string) => void }>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef(0);
  const [editorContent, setEditorContent] = useState('');
  const [showSnippets, setShowSnippets] = useState(false);

  const { chatPanelHeight, handleDrag, isDragging, startDrag, endDrag } = useResizablePanel();

  const handleFileOpen = (content: string) => {
    if (editorRef.current) {
      editorRef.current.setValue(content);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag();
    dragStartYRef.current = e.clientY;
  }, [startDrag]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const deltaY = e.clientY - dragStartYRef.current;
    const containerHeight = containerRef.current.getBoundingClientRect().height;
    handleDrag(deltaY, containerHeight);
    dragStartYRef.current = e.clientY;
  }, [isDragging, handleDrag]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      endDrag();
    }
  }, [isDragging, endDrag]);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const editorHeight = 100 - chatPanelHeight;

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <Header editorContent={editorContent} onFileOpen={handleFileOpen} />

      <div ref={containerRef} className="flex-1 flex min-h-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Code Editor Area */}
          <div
            className="min-h-0 overflow-hidden"
            style={{ height: `${editorHeight}%` }}
          >
            <CodeEditor ref={editorRef} onContentChange={setEditorContent} />
          </div>

          {/* Resize Handle */}
          <div
            className={`h-2 flex-shrink-0 cursor-row-resize flex items-center justify-center group transition-colors ${
              isDragging ? 'bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal
              size={16}
              className={`transition-colors ${
                isDragging ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
              }`}
            />
          </div>

          {/* Chat Panel Area */}
          <div
            className="min-h-0 overflow-hidden"
            style={{ height: `${chatPanelHeight}%` }}
          >
            <ChatPanel />
          </div>
        </div>

        {/* Snippets Panel - Right Side */}
        {showSnippets && (
          <div className="w-80 shrink-0">
            <SnippetsPanel />
          </div>
        )}
      </div>

      {/* Floating Snippets Toggle */}
      <button
        onClick={() => setShowSnippets(!showSnippets)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors z-30"
        title="Toggle Snippets"
      >
        <BookMarked size={20} />
      </button>
    </div>
  );
}

export default App;
