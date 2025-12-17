import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DiffEditor } from '@monaco-editor/react';
import { X, Check, AlertTriangle } from 'lucide-react';

interface DiffModalProps {
    originalCode: string;
    modifiedCode: string;
    language: string;
    onClose: () => void;
    onApply?: (newCode: string) => void;
    threadId?: string;
}

const DiffModal: React.FC<DiffModalProps> = ({ originalCode, modifiedCode, language, onClose, onApply, threadId }) => {
    const [applied, setApplied] = useState(false);

    const handleApply = () => {
        if (onApply) {
            onApply(modifiedCode);
            setApplied(true);
            // Close after a short delay to show feedback
            setTimeout(() => {
                onClose();
            }, 1000);
        }
    };

    const canApply = onApply && originalCode && threadId;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-8 animate-in fade-in duration-200">
            <div className="bg-gray-900 w-full h-full max-w-6xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-700">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">Review Suggested Changes</h3>
                        <div className="flex gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-red-500/30 border border-red-500 rounded"></span>
                                Original
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-green-500/30 border border-green-500 rounded"></span>
                                Suggested
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {canApply && !applied && (
                            <button
                                onClick={handleApply}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md transition-colors text-sm font-medium"
                            >
                                <Check size={16} />
                                Apply Changes
                            </button>
                        )}
                        {applied && (
                            <span className="flex items-center gap-2 text-green-400 text-sm">
                                <Check size={16} />
                                Changes Applied!
                            </span>
                        )}
                        {!canApply && !applied && (
                            <span className="flex items-center gap-2 text-gray-500 text-xs">
                                <AlertTriangle size={14} />
                                Select code to apply changes
                            </span>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <DiffEditor
                        height="100%"
                        language={language}
                        original={originalCode}
                        modified={modifiedCode}
                        theme="vs-dark"
                        options={{
                            readOnly: true,
                            renderSideBySide: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>
                {canApply && !applied && (
                    <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            Applying changes will replace the selected code block in the editor.
                        </p>
                        <button
                            onClick={handleApply}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors font-medium"
                        >
                            <Check size={18} />
                            Apply Changes to Editor
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default DiffModal;
