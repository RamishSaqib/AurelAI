import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { aiService } from '../services/ai';

interface RefactorMenuProps {
    selectedCode: string;
    position: { x: number; y: number };
    onClose: () => void;
    onApply: (newCode: string) => void;
}

const REFACTOR_OPTIONS = [
    { id: 'extract', label: 'Extract Function', prompt: 'Extract this code into a well-named function with proper parameters and return value.' },
    { id: 'optimize', label: 'Optimize Performance', prompt: 'Optimize this code for better performance while maintaining functionality.' },
    { id: 'error-handling', label: 'Add Error Handling', prompt: 'Add comprehensive error handling to this code with try-catch blocks and proper error messages.' },
    { id: 'add-types', label: 'Add TypeScript Types', prompt: 'Add proper TypeScript type annotations to this code.' },
    { id: 'add-comments', label: 'Add Documentation', prompt: 'Add clear JSDoc comments explaining what this code does, its parameters, and return value.' },
    { id: 'simplify', label: 'Simplify Code', prompt: 'Simplify this code to make it more readable and maintainable.' },
];

const RefactorMenu: React.FC<RefactorMenuProps> = ({ selectedCode, position, onClose, onApply }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingOption, setLoadingOption] = useState<string | null>(null);

    const handleRefactor = async (option: typeof REFACTOR_OPTIONS[0]) => {
        setIsLoading(true);
        setLoadingOption(option.id);

        try {
            const prompt = `${option.prompt}\n\nCode to refactor:\n\`\`\`\n${selectedCode}\n\`\`\`\n\nProvide ONLY the refactored code without explanations. Wrap it in a code block.`;

            const response = await aiService.sendMessage(selectedCode, prompt, []);

            // Extract code from response
            const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
            const refactoredCode = codeMatch ? codeMatch[1] : response;

            onApply(refactoredCode.trim());
            onClose();
        } catch (error) {
            console.error('Refactoring error:', error);
            alert('Failed to refactor code. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingOption(null);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Menu */}
            <div
                className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-2 min-w-[240px] animate-in fade-in zoom-in duration-150"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2">
                    <Wand2 size={14} className="text-purple-400" />
                    <span className="text-xs font-semibold text-gray-300">AI Refactoring</span>
                </div>

                <div className="py-1">
                    {REFACTOR_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleRefactor(option)}
                            disabled={isLoading}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-between"
                        >
                            <span>{option.label}</span>
                            {loadingOption === option.id && (
                                <Loader2 size={14} className="animate-spin text-blue-400" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default RefactorMenu;
