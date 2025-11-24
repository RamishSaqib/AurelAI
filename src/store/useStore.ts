import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Thread {
    id: string;
    range: {
        startLineNumber: number;
        endLineNumber: number;
        startColumn: number;
        endColumn: number;
    } | null;
    messages: Message[];
    codeContext: string; // The code that was selected (empty for general chat)
}

interface Store {
    threads: Thread[];
    activeSelection: Thread['range'] | null;
    activeThreadId: string | null;
    language: string;
    apiKey: string | null;
    currentFile: { name: string; handle: FileSystemFileHandle } | null;
    openFiles: Array<{ id: string; name: string; content: string; language: string }>;
    activeFileId: string | null;
    snippets: Array<{ id: string; name: string; code: string; language: string }>;
    setLanguage: (language: string) => void;
    setApiKey: (key: string) => void;
    setCurrentFile: (file: { name: string; handle: FileSystemFileHandle } | null) => void;
    addOpenFile: (file: { name: string; content: string; language: string }) => void;
    updateOpenFile: (id: string, content: string) => void;
    removeOpenFile: (id: string) => void;
    setActiveFileId: (id: string | null) => void;
    addSnippet: (snippet: { name: string; code: string; language: string }) => void;
    removeSnippet: (id: string) => void;
    setActiveSelection: (selection: Thread['range'] | null) => void;
    setActiveThread: (id: string | null) => void;
    addThread: (thread: Thread) => void;
    addMessageToThread: (threadId: string, message: Message) => void;
    removeThread: (threadId: string) => void;
}

export const useStore = create<Store>()(
    persist(
        (set) => ({
            threads: [],
            activeSelection: null,
            activeThreadId: null,
            language: 'javascript',
            apiKey: null,
            currentFile: null,
            openFiles: [],
            activeFileId: null,
            snippets: [],
            setLanguage: (language) => set({ language }),
            setApiKey: (key) => set({ apiKey: key }),
            setCurrentFile: (file) => set({ currentFile: file }),
            addOpenFile: (file) => set((state) => {
                const id = crypto.randomUUID();
                return {
                    openFiles: [...state.openFiles, { ...file, id }],
                    activeFileId: id,
                };
            }),
            updateOpenFile: (id, content) => set((state) => ({
                openFiles: state.openFiles.map(f => f.id === id ? { ...f, content } : f),
            })),
            removeOpenFile: (id) => set((state) => ({
                openFiles: state.openFiles.filter(f => f.id !== id),
                activeFileId: state.activeFileId === id ? (state.openFiles[0]?.id || null) : state.activeFileId,
            })),
            setActiveFileId: (id) => set({ activeFileId: id }),
            addSnippet: (snippet) => set((state) => ({
                snippets: [...state.snippets, { ...snippet, id: crypto.randomUUID() }],
            })),
            removeSnippet: (id) => set((state) => ({
                snippets: state.snippets.filter(s => s.id !== id),
            })),
            setActiveSelection: (selection) => set({ activeSelection: selection }),
            setActiveThread: (id) => set({ activeThreadId: id }),
            addThread: (thread) => set((state) => ({ threads: [...state.threads, thread], activeThreadId: thread.id })),
            addMessageToThread: (threadId, message) =>
                set((state) => ({
                    threads: state.threads.map((t) =>
                        t.id === threadId ? { ...t, messages: [...t.messages, message] } : t
                    ),
                })),
            removeThread: (threadId) =>
                set((state) => ({ threads: state.threads.filter((t) => t.id !== threadId) })),
        }),
        {
            name: 'aurelai-storage',
            partialize: (state) => ({ threads: state.threads, language: state.language }), // Only persist threads and language
        }
    )
);
