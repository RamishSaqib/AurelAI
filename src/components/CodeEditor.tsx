import React, { useRef, useState, useEffect, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useStore } from '../store/useStore';
import { MessageSquarePlus, Play } from 'lucide-react';
import clsx from 'clsx';
import { DEFAULT_CODE } from '../constants/defaultCode';
import CodeRunner from './CodeRunner';
import RefactorMenu from './RefactorMenu';

// Type-only import fix
import type { editor as MonacoEditor } from 'monaco-editor';
type IStandaloneCodeEditor = MonacoEditor.IStandaloneCodeEditor;

interface CodeEditorProps {
    initialCode?: string;
    theme?: string;
    onContentChange?: (content: string) => void;
}

const CodeEditor = React.forwardRef<{ setValue: (value: string) => void }, CodeEditorProps>(({
    initialCode = DEFAULT_CODE.javascript,
    theme = 'vs-dark',
    onContentChange,
}, ref) => {
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<any>(null);
    const [showAskAI, setShowAskAI] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
    const [showRunner, setShowRunner] = useState(false);
    const [refactorMenu, setRefactorMenu] = useState<{ code: string; position: { x: number; y: number } } | null>(null);
    const { setActiveSelection, addThread, threads, language, setActiveThread, setApplyCodeCallback } = useStore();

    // Store decorations collection
    const decorationsCollection = useRef<MonacoEditor.IEditorDecorationsCollection | null>(null);

    // Callback for applying code changes from AI suggestions
    const applyCodeToThread = useCallback((threadId: string, newCode: string) => {
        if (!editorRef.current || !monacoRef.current) return;

        // Find the thread to get its range
        const thread = threads.find(t => t.id === threadId);
        if (!thread || !thread.range) return;

        const range = new monacoRef.current.Range(
            thread.range.startLineNumber,
            thread.range.startColumn,
            thread.range.endLineNumber,
            thread.range.endColumn
        );

        // Execute the edit
        editorRef.current.executeEdits('apply-ai-suggestion', [{
            range: range,
            text: newCode,
        }]);

        // Focus the editor
        editorRef.current.focus();
    }, [threads]);

    // Register the apply callback when editor is ready
    useEffect(() => {
        if (editorRef.current) {
            setApplyCodeCallback(applyCodeToThread);
        }
        return () => {
            setApplyCodeCallback(null);
        };
    }, [applyCodeToThread, setApplyCodeCallback]);

    // Expose setValue method to parent
    React.useImperativeHandle(ref, () => ({
        setValue: (value: string) => {
            if (editorRef.current) {
                editorRef.current.setValue(value);
            }
        }
    }));

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        decorationsCollection.current = editor.createDecorationsCollection([]);

        // Track content changes
        editor.onDidChangeModelContent(() => {
            if (onContentChange) {
                onContentChange(editor.getValue());
            }
        });

        editor.onDidChangeCursorSelection((e) => {
            const selection = e.selection;
            if (!selection.isEmpty()) {
                const range = {
                    startLineNumber: selection.startLineNumber,
                    endLineNumber: selection.endLineNumber,
                    startColumn: selection.startColumn,
                    endColumn: selection.endColumn,
                };
                setActiveSelection(range);

                const scrolledVisiblePosition = editor.getScrolledVisiblePosition(selection.getEndPosition());
                if (scrolledVisiblePosition) {
                    setButtonPosition({
                        top: scrolledVisiblePosition.top + 10,
                        left: scrolledVisiblePosition.left + 20,
                    });
                    setShowAskAI(true);
                }
            } else {
                setShowAskAI(false);
                setActiveSelection(null);
            }
        });

        // Handle clicking on decorations to switch tabs
        editor.onMouseDown((e) => {
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_DECORATIONS ||
                e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
                const position = e.target.position;
                if (position) {
                    const thread = threads.find(t =>
                        t.range &&
                        position.lineNumber >= t.range.startLineNumber &&
                        position.lineNumber <= t.range.endLineNumber
                    );
                    if (thread) {
                        setActiveThread(thread.id);
                    }
                }
            }
        });

        // Handle right-click for refactoring menu
        editor.onContextMenu((e) => {
            const selection = editor.getSelection();
            if (selection && !selection.isEmpty()) {
                e.event.preventDefault();
                const selectedCode = editor.getModel()?.getValueInRange(selection) || '';

                setRefactorMenu({
                    code: selectedCode,
                    position: {
                        x: e.event.posx,
                        y: e.event.posy,
                    },
                });
            }
        });
    };

    // Update decorations when threads change
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current || !decorationsCollection.current) return;

        const newDecorations = threads
            .filter(thread => thread.range !== null)
            .map(thread => ({
                range: new monacoRef.current.Range(
                    thread.range!.startLineNumber,
                    thread.range!.startColumn,
                    thread.range!.endLineNumber,
                    thread.range!.endColumn
                ),
                options: {
                    isWholeLine: true,
                    className: 'bg-blue-500/20 border-l-2 border-blue-500',
                    hoverMessage: { value: 'Click to view thread' }
                }
            }));

        decorationsCollection.current.set(newDecorations);
    }, [threads]);

    const handleAskAI = () => {
        if (!editorRef.current) return;
        const selection = editorRef.current.getSelection();
        if (!selection) return;

        const model = editorRef.current.getModel();
        const codeContext = model?.getValueInRange(selection) || '';

        const newThread = {
            id: crypto.randomUUID(),
            range: {
                startLineNumber: selection.startLineNumber,
                endLineNumber: selection.endLineNumber,
                startColumn: selection.startColumn,
                endColumn: selection.endColumn,
            },
            messages: [],
            codeContext,
        };

        addThread(newThread);
        setShowAskAI(false);
    };

    return (
        <div className="relative h-full w-full bg-gray-900 p-4 flex flex-col">
            <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden shadow-inner relative">
                {/* Run Code Button - For supported languages */}
                {['javascript', 'typescript', 'python', 'html', 'css', 'json', 'java', 'cpp', 'c', 'go', 'rust', 'ruby', 'php'].includes(language) && (
                    <button
                        onClick={() => setShowRunner(!showRunner)}
                        className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md shadow-lg transition-colors"
                        title={language === 'html' || language === 'css' ? 'Preview' : ['java', 'cpp', 'c', 'go', 'rust'].includes(language) ? 'Compile & Run' : 'Run Code'}
                    >
                        <Play size={16} />
                        <span className="text-sm">
                            {language === 'html' || language === 'css'
                                ? 'Preview'
                                : ['java', 'cpp', 'c', 'go', 'rust'].includes(language)
                                    ? 'Compile'
                                    : 'Run'}
                        </span>
                    </button>
                )}

                <Editor
                    key={language}
                    height="100%"
                    language={language}
                    defaultValue={DEFAULT_CODE[language] || initialCode}
                    theme={theme}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        wordWrap: 'on',
                        automaticLayout: true,
                        padding: { top: 20 },
                        scrollBeyondLastLine: false,
                    }}
                />

                {showAskAI && (
                    <button
                        className={clsx(
                            "absolute z-50 flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-lg hover:bg-blue-700 transition-all animate-in fade-in zoom-in duration-200",
                            "transform -translate-y-full"
                        )}
                        style={{
                            top: buttonPosition.top,
                            left: buttonPosition.left,
                        }}
                        onClick={handleAskAI}
                    >
                        <MessageSquarePlus size={16} />
                        Ask AI
                    </button>
                )}
            </div>

            {showRunner && (
                <CodeRunner
                    code={editorRef.current?.getValue() || ''}
                    language={language}
                    onClose={() => setShowRunner(false)}
                />
            )}

            {refactorMenu && (
                <RefactorMenu
                    selectedCode={refactorMenu.code}
                    position={refactorMenu.position}
                    onClose={() => setRefactorMenu(null)}
                    onApply={(newCode) => {
                        if (editorRef.current) {
                            const selection = editorRef.current.getSelection();
                            if (selection) {
                                editorRef.current.executeEdits('refactor', [{
                                    range: selection,
                                    text: newCode,
                                }]);
                            }
                        }
                        setRefactorMenu(null);
                    }}
                />
            )}
        </div>
    );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
