import React from 'react';
import { useStore } from '../store/useStore';
import ThreadView from './ThreadView';
import { MessageSquare, X, Plus } from 'lucide-react';
import clsx from 'clsx';

const ChatPanel: React.FC = () => {
    const { threads, activeThreadId, setActiveThread, removeThread, addThread } = useStore();

    const activeThread = threads.find((t) => t.id === activeThreadId);

    const handleNewChat = () => {
        const newThread = {
            id: crypto.randomUUID(),
            range: null,
            messages: [],
            codeContext: '',
        };
        addThread(newThread);
    };

    if (threads.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900 border-t border-gray-800">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p className="mb-4">Select code and click "Ask AI" or start a general chat.</p>
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                    <Plus size={16} />
                    New Chat
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-900 border-t border-gray-800">
            {/* Tabs */}
            <div className="flex items-center overflow-x-auto border-b border-gray-800 bg-gray-900/50 no-scrollbar">
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 border-r border-gray-800 transition-colors shrink-0"
                    title="New Chat"
                >
                    <Plus size={16} />
                </button>

                {threads.map((thread) => (
                    <div
                        key={thread.id}
                        className={clsx(
                            "group flex items-center gap-2 px-4 py-2.5 text-sm border-r border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors min-w-[160px] max-w-[240px] shrink-0",
                            activeThreadId === thread.id ? "bg-gray-800 text-blue-400 border-b-2 border-b-blue-500" : "text-gray-400"
                        )}
                        onClick={() => setActiveThread(thread.id)}
                    >
                        <span className="truncate flex-1">
                            {thread.range ? `Lines ${thread.range.startLineNumber}-${thread.range.endLineNumber}` : 'General Chat'}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeThread(thread.id);
                                if (activeThreadId === thread.id) {
                                    setActiveThread(threads.find(t => t.id !== thread.id)?.id || null);
                                }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-all"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeThread ? (
                    <div className="h-full w-full">
                        <ThreadView
                            thread={activeThread}
                            onClose={() => { }} // Close handled by tabs now
                            isPanel={true}
                        />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Select a tab to view the conversation
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
