import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, Save } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { apiKey, setApiKey } = useStore();
    const [key, setKey] = useState(apiKey || '');

    const handleSave = () => {
        setApiKey(key);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-8 animate-in fade-in duration-200">
            <div className="bg-gray-900 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-700">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Key size={18} className="text-blue-400" />
                        Settings
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Your key is stored locally in your browser.
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            <Save size={16} />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SettingsModal;
