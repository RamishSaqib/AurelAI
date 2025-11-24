import React, { useState, useEffect } from 'react';
import { Play, X, Terminal } from 'lucide-react';

interface CodeRunnerProps {
    code: string;
    language: string;
    onClose: () => void;
}

interface OutputLine {
    type: 'log' | 'error' | 'result';
    content: string;
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ code, language, onClose }) => {
    const [output, setOutput] = useState<OutputLine[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    // Auto-run on mount
    useEffect(() => {
        handleRun();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const runJavaScript = () => {
        setIsRunning(true);
        setOutput([]);

        const logs: OutputLine[] = [];

        // Capture console.log
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args: any[]) => {
            logs.push({
                type: 'log', content: args.map(a => {
                    if (typeof a === 'object') {
                        try {
                            return JSON.stringify(a, null, 2);
                        } catch {
                            return String(a);
                        }
                    }
                    return String(a);
                }).join(' ')
            });
            originalLog(...args);
        };

        console.error = (...args: any[]) => {
            logs.push({ type: 'error', content: args.map(a => String(a)).join(' ') });
            originalError(...args);
        };

        console.warn = (...args: any[]) => {
            logs.push({ type: 'log', content: '⚠️ ' + args.map(a => String(a)).join(' ') });
            originalWarn(...args);
        };

        try {
            // Wrap code in async function to support await
            const asyncCode = `(async () => { ${code} })()`;
            const result = eval(asyncCode);

            // Handle promises
            if (result instanceof Promise) {
                result
                    .then((res) => {
                        if (res !== undefined) {
                            logs.push({ type: 'result', content: `=> ${String(res)}` });
                        }
                        setOutput([...logs]);
                    })
                    .catch((error) => {
                        logs.push({ type: 'error', content: `Error: ${error.message}` });
                        setOutput([...logs]);
                    })
                    .finally(() => {
                        console.log = originalLog;
                        console.error = originalError;
                        console.warn = originalWarn;
                        setIsRunning(false);
                    });
            } else {
                if (result !== undefined) {
                    logs.push({ type: 'result', content: `=> ${String(result)}` });
                }
                setOutput(logs);
                console.log = originalLog;
                console.error = originalError;
                console.warn = originalWarn;
                setIsRunning(false);
            }
        } catch (error: any) {
            logs.push({ type: 'error', content: `Error: ${error.message}` });
            setOutput(logs);
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            setIsRunning(false);
        }
    };

    const handleRun = () => {
        if (language === 'javascript' || language === 'typescript') {
            runJavaScript();
        } else if (language === 'python') {
            setOutput([
                { type: 'error', content: 'Python execution requires Pyodide (Python in WebAssembly).' },
                { type: 'log', content: 'For now, only JavaScript/TypeScript is supported in the browser.' },
                { type: 'log', content: 'Switch to JavaScript to run code directly!' }
            ]);
        } else {
            setOutput([{ type: 'error', content: `Code execution not supported for ${language}. Switch to JavaScript or TypeScript.` }]);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">Code Output</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                        <Play size={14} />
                        {isRunning ? 'Running...' : 'Re-run'}
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="p-4 max-h-[300px] overflow-y-auto font-mono text-sm">
                {output.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        Click "Run" to execute the code
                    </div>
                ) : (
                    <div className="space-y-1">
                        {output.map((line, index) => (
                            <div
                                key={index}
                                className={`${line.type === 'error'
                                        ? 'text-red-400'
                                        : line.type === 'result'
                                            ? 'text-green-400'
                                            : 'text-gray-300'
                                    }`}
                            >
                                {line.content}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeRunner;
