import React from 'react';
import { createPortal } from 'react-dom';
import { DiffEditor } from '@monaco-editor/react';
import { X } from 'lucide-react';

interface DiffModalProps {
    originalCode: string;
    modifiedCode: string;
    language: string;
    onClose: () => void;
}

const DiffModal: React.FC<DiffModalProps> = ({ originalCode, modifiedCode, language, onClose }) => {
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-8 animate-in fade-in duration-200">
            <div className="bg-gray-900 w-full h-full max-w-6xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-700">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Review Suggested Changes</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
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
            </div>
        </div>,
        document.body
    );
};

export default DiffModal;
