import React, { useState, useEffect } from 'react';
import { type Thread, useStore } from '../store/useStore';
import { Send, X, FileDiff, Mic, MicOff } from 'lucide-react';
import { aiService } from '../services/ai';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Import highlight.js styles
import DiffModal from './DiffModal';
import { useVoiceInput } from '../hooks/useVoiceInput';
import clsx from 'clsx';

interface ThreadViewProps {
    thread: Thread;
    onClose: () => void;
    isPanel?: boolean;
}

const ThreadView: React.FC<ThreadViewProps> = ({ thread, onClose, isPanel = false }) => {
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const { addMessageToThread, language } = useStore();
    const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput();

    const [diffModal, setDiffModal] = useState<{ isOpen: boolean; modifiedCode: string } | null>(null);

    // Update input when transcript changes
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: input,
            timestamp: Date.now(),
        };

        addMessageToThread(thread.id, userMsg);
        setInput('');
        setIsTyping(true);

        try {
            const history = thread.messages.map(m => ({ role: m.role, content: m.content }));
            const response = await aiService.sendMessage(thread.codeContext, input, history);

            const aiMsg = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content: response,
                timestamp: Date.now(),
            };
            addMessageToThread(thread.id, aiMsg);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    const extractCode = (content: string) => {
        const match = content.match(/```[\w]*\n([\s\S]*?)```/);
        return match ? match[1] : null;
    };

    return (
        <>
            <div className={isPanel ? "flex flex-col h-full w-full bg-gray-900" : "bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden w-[800px]"}>
                {!isPanel && (
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
                        <span className="text-sm font-medium text-gray-300">
                            {thread.range ? `Thread on lines ${thread.range.startLineNumber}-${thread.range.endLineNumber}` : 'General Chat'}
                        </span>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className={`p-4 overflow-y-auto space-y-4 ${isPanel ? 'flex-1 min-h-0' : 'max-h-[600px]'}`}>
                    {thread.messages.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-4">
                            Ask AI about this code block...
                        </div>
                    )}
                    {thread.messages.map((msg) => {
                        const codeBlock = msg.role === 'assistant' ? extractCode(msg.content) : null;

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-200 prose prose-invert prose-sm max-w-none'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>

                                {codeBlock && (
                                    <button
                                        onClick={() => setDiffModal({ isOpen: true, modifiedCode: codeBlock })}
                                        className="mt-1 flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-blue-400 border border-gray-600 px-2 py-1 rounded transition-colors"
                                    >
                                        <FileDiff size={12} />
                                        Show Diff
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-gray-700 text-gray-400 rounded-lg px-3 py-2 text-sm italic">
                                AI is typing...
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-700 flex gap-2 shrink-0">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about this code..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        disabled={isTyping}
                    />
                    {isSupported && (
                        <button
                            onClick={() => {
                                if (isListening) {
                                    stopListening();
                                } else {
                                    resetTranscript();
                                    startListening();
                                }
                            }}
                            className={clsx(
                                "p-2 rounded-md transition-colors",
                                isListening
                                    ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            )}
                            title={isListening ? "Stop listening" : "Voice input"}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                    )}
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white p-2 rounded-md transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

            {diffModal && diffModal.isOpen && (
                <DiffModal
                    originalCode={thread.codeContext}
                    modifiedCode={diffModal.modifiedCode}
                    language={language}
                    onClose={() => setDiffModal(null)}
                />
            )}
        </>
    );
};

export default ThreadView;
