import { useRef, useState } from 'react';
import CodeEditor from './components/CodeEditor';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import SnippetsPanel from './components/SnippetsPanel';
import { BookMarked } from 'lucide-react';

function App() {
  const editorRef = useRef<{ setValue: (value: string) => void }>(null);
  const [editorContent, setEditorContent] = useState('');
  const [showSnippets, setShowSnippets] = useState(false);

  const handleFileOpen = (content: string) => {
    if (editorRef.current) {
      editorRef.current.setValue(content);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <Header editorContent={editorContent} onFileOpen={handleFileOpen} />

      <div className="flex-1 flex min-h-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Code Editor Area - 60% height */}
          <div className="flex-[3] min-h-0">
            <CodeEditor ref={editorRef} onContentChange={setEditorContent} />
          </div>

          {/* Chat Panel Area - 40% height */}
          <div className="flex-[2] min-h-0">
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
