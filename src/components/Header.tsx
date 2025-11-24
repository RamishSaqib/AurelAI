import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Code2, Settings, FolderOpen, Save } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { openFile, saveFile } from '../utils/fileSystem';

interface HeaderProps {
    editorContent: string;
    onFileOpen: (content: string) => void;
}

const Header: React.FC<HeaderProps> = ({ editorContent, onFileOpen }) => {
    const { language, setLanguage, currentFile, setCurrentFile } = useStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleOpenFile = async () => {
        const result = await openFile();
        if (result) {
            setCurrentFile({ name: result.handle.name, handle: result.handle });
            onFileOpen(result.content);
        }
    };

    const handleSaveFile = async () => {
        const handle = await saveFile(editorContent, currentFile?.handle);
        if (handle && !currentFile) {
            setCurrentFile({ name: handle.name, handle });
        }
    };

    return (
        <>
            <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2 text-blue-500">
                    <Code2 size={24} />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        AurelAI
                    </span>
                    {currentFile && (
                        <span className="text-sm text-gray-400 ml-2">
                            {currentFile.name}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleOpenFile}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-1.5 hover:bg-gray-800 rounded-md"
                        title="Open File"
                    >
                        <FolderOpen size={18} />
                        <span className="text-sm">Open</span>
                    </button>

                    <button
                        onClick={handleSaveFile}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-1.5 hover:bg-gray-800 rounded-md"
                        title="Save File"
                    >
                        <Save size={18} />
                        <span className="text-sm">Save</span>
                    </button>

                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                    </select>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        </>
    );
};

export default Header;
