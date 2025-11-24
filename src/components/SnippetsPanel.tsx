import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, X, Copy, Check } from 'lucide-react';

const SnippetsPanel: React.FC = () => {
    const { snippets, addSnippet, removeSnippet, language } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newSnippet, setNewSnippet] = useState({ name: '', code: '' });
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleAdd = () => {
        if (newSnippet.name && newSnippet.code) {
            addSnippet({ ...newSnippet, language });
            setNewSnippet({ name: '', code: '' });
            setIsAdding(false);
        }
    };

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300">Code Snippets</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Add Snippet"
                >
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                </button>
            </div>

            {isAdding && (
                <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                    <input
                        type="text"
                        value={newSnippet.name}
                        onChange={(e) => setNewSnippet({ ...newSnippet, name: e.target.value })}
                        placeholder="Snippet name..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white mb-2 focus:outline-none focus:border-blue-500"
                    />
                    <textarea
                        value={newSnippet.code}
                        onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                        placeholder="Paste your code here..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono h-24 resize-none focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={handleAdd}
                        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                        Save Snippet
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {snippets.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        No snippets yet. Click + to add one.
                    </div>
                ) : (
                    snippets.map((snippet) => (
                        <div
                            key={snippet.id}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className="text-sm font-medium text-white">{snippet.name}</h4>
                                    <span className="text-xs text-gray-500">{snippet.language}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleCopy(snippet.code, snippet.id)}
                                        className="text-gray-400 hover:text-white transition-colors p-1"
                                        title="Copy"
                                    >
                                        {copiedId === snippet.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    </button>
                                    <button
                                        onClick={() => removeSnippet(snippet.id)}
                                        className="text-gray-400 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                        title="Delete"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            <pre className="text-xs text-gray-300 font-mono bg-gray-900 p-2 rounded overflow-x-auto">
                                {snippet.code.substring(0, 100)}{snippet.code.length > 100 ? '...' : ''}
                            </pre>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SnippetsPanel;
