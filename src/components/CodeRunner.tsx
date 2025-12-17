import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, X, Terminal, Globe, Loader2, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';

interface CodeRunnerProps {
    code: string;
    language: string;
    onClose: () => void;
}

interface OutputLine {
    type: 'log' | 'error' | 'result' | 'info';
    content: string;
}

// Pyodide type declarations
declare global {
    interface Window {
        loadPyodide: (config?: { indexURL?: string }) => Promise<any>;
        pyodide: any;
    }
}

// Track Pyodide loading state globally
let pyodideLoadingPromise: Promise<any> | null = null;
let pyodideInstance: any = null;

const MIN_HEIGHT = 150;
const DEFAULT_HEIGHT = 300;
const MAX_HEIGHT = 600;

// Piston API endpoint for remote code execution
const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

// Language configurations for Piston API
const PISTON_LANGUAGES: Record<string, { language: string; version: string; filename: string }> = {
    java: { language: 'java', version: '15.0.2', filename: 'Main.java' },
    cpp: { language: 'c++', version: '10.2.0', filename: 'main.cpp' },
    c: { language: 'c', version: '10.2.0', filename: 'main.c' },
    go: { language: 'go', version: '1.16.2', filename: 'main.go' },
    rust: { language: 'rust', version: '1.68.2', filename: 'main.rs' },
    ruby: { language: 'ruby', version: '3.0.1', filename: 'main.rb' },
    php: { language: 'php', version: '8.2.3', filename: 'main.php' },
};

const CodeRunner: React.FC<CodeRunnerProps> = ({ code, language, onClose }) => {
    const [output, setOutput] = useState<OutputLine[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isPyodideLoading, setIsPyodideLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);

    // Handle drag to resize
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartHeight.current = panelHeight;
    }, [panelHeight]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const delta = dragStartY.current - e.clientY;
            const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartHeight.current + delta));
            setPanelHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Toggle expanded/collapsed
    const toggleExpanded = () => {
        if (isExpanded) {
            setPanelHeight(DEFAULT_HEIGHT);
        } else {
            setPanelHeight(MAX_HEIGHT);
        }
        setIsExpanded(!isExpanded);
    };

    // Auto-run on mount
    useEffect(() => {
        handleRun();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load Pyodide script dynamically
    const loadPyodideScript = async (): Promise<any> => {
        if (pyodideInstance) {
            return pyodideInstance;
        }

        if (pyodideLoadingPromise) {
            return pyodideLoadingPromise;
        }

        const PYODIDE_VERSION = '0.26.4';
        const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

        pyodideLoadingPromise = new Promise(async (resolve, reject) => {
            try {
                // Check if script already loaded
                if (!window.loadPyodide) {
                    const script = document.createElement('script');
                    script.src = `${PYODIDE_CDN}pyodide.js`;
                    script.async = true;

                    await new Promise<void>((res, rej) => {
                        script.onload = () => res();
                        script.onerror = () => rej(new Error('Failed to load Pyodide script'));
                        document.head.appendChild(script);
                    });
                }

                // Initialize Pyodide with proper configuration
                const pyodide = await window.loadPyodide({
                    indexURL: PYODIDE_CDN,
                });
                pyodideInstance = pyodide;
                resolve(pyodide);
            } catch (error) {
                pyodideLoadingPromise = null;
                reject(error);
            }
        });

        return pyodideLoadingPromise;
    };

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

    const runPython = async () => {
        setIsRunning(true);
        setIsPyodideLoading(true);
        setOutput([{ type: 'info', content: '🐍 Loading Python environment (first run may take a moment)...' }]);

        try {
            const pyodide = await loadPyodideScript();
            setIsPyodideLoading(false);
            setOutput([{ type: 'info', content: '🐍 Running Python code...' }]);

            // Use Pyodide's built-in output capture
            pyodide.setStdout({ batched: (text: string) => {} }); // Clear any handlers
            pyodide.setStderr({ batched: (text: string) => {} });

            // Reset stdout/stderr with fresh StringIO buffers
            await pyodide.runPythonAsync(`
import sys
from io import StringIO
__stdout_capture__ = StringIO()
__stderr_capture__ = StringIO()
sys.stdout = __stdout_capture__
sys.stderr = __stderr_capture__
            `);

            // Run the user's code
            let result;
            try {
                result = await pyodide.runPythonAsync(code);
            } catch (pythonError: any) {
                const stderrOutput = await pyodide.runPythonAsync('__stderr_capture__.getvalue()');
                const stderrLines = stderrOutput ? stderrOutput.split('\n').filter((l: string) => l.trim()) : [];

                setOutput([
                    { type: 'error', content: `Python Error: ${pythonError.message}` },
                    ...stderrLines.map((line: string) => ({ type: 'error' as const, content: line }))
                ]);
                setIsRunning(false);
                return;
            }

            // Get captured output
            const stdoutOutput = await pyodide.runPythonAsync('__stdout_capture__.getvalue()');
            const stdoutLines = stdoutOutput ? stdoutOutput.split('\n').filter((l: string) => l.trim()) : [];
            const stdoutList = stdoutLines;

            const logs: OutputLine[] = stdoutList.map((line: string) => ({
                type: 'log' as const,
                content: line
            }));

            // Add result if any
            if (result !== undefined && result !== null) {
                const resultStr = typeof result === 'object' && result.toJs
                    ? JSON.stringify(result.toJs(), null, 2)
                    : String(result);
                if (resultStr !== 'None' && resultStr !== 'undefined') {
                    logs.push({ type: 'result', content: `=> ${resultStr}` });
                }
            }

            if (logs.length === 0) {
                logs.push({ type: 'info', content: '(No output)' });
            }

            setOutput(logs);
        } catch (error: any) {
            setOutput([
                { type: 'error', content: `Failed to run Python: ${error.message}` },
                { type: 'info', content: 'Tip: Check your code for syntax errors.' }
            ]);
        } finally {
            setIsRunning(false);
            setIsPyodideLoading(false);
        }
    };

    const runHTML = () => {
        setShowPreview(true);
        setOutput([{ type: 'info', content: 'Rendering HTML preview...' }]);

        // Build complete HTML document
        let htmlContent = code;

        // If it's just CSS, wrap it in a simple HTML page
        if (language === 'css') {
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>${code}</style>
</head>
<body>
    <div class="preview-container">
        <h1>CSS Preview</h1>
        <p>This is a paragraph to demonstrate your CSS styles.</p>
        <button>Sample Button</button>
        <div class="box">A styled box</div>
        <ul>
            <li>List item 1</li>
            <li>List item 2</li>
            <li>List item 3</li>
        </ul>
    </div>
</body>
</html>`;
        }

        // If it doesn't have DOCTYPE, wrap it
        if (!htmlContent.toLowerCase().includes('<!doctype') && !htmlContent.toLowerCase().includes('<html')) {
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
    </style>
</head>
<body>
${code}
</body>
</html>`;
        }

        // Set iframe content after a tick
        setTimeout(() => {
            if (iframeRef.current) {
                const iframe = iframeRef.current;
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (doc) {
                    doc.open();
                    doc.write(htmlContent);
                    doc.close();
                }
            }
        }, 100);

        setOutput([{ type: 'result', content: '✅ HTML rendered successfully!' }]);
    };

    // Run code using Piston API (for Java, C++, etc.)
    const runWithPiston = async () => {
        const config = PISTON_LANGUAGES[language];
        if (!config) {
            setOutput([{ type: 'error', content: `Language ${language} not supported by Piston API` }]);
            return;
        }

        setIsRunning(true);
        const langEmoji = language === 'java' ? '☕' : language === 'cpp' || language === 'c' ? '⚙️' : '🚀';
        setOutput([{ type: 'info', content: `${langEmoji} Compiling and running ${language.toUpperCase()} code...` }]);

        try {
            const response = await fetch(PISTON_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: config.language,
                    version: config.version,
                    files: [{
                        name: config.filename,
                        content: code,
                    }],
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const logs: OutputLine[] = [];

            // Handle compile errors
            if (result.compile && result.compile.stderr) {
                logs.push({ type: 'error', content: '❌ Compilation Error:' });
                result.compile.stderr.split('\n').filter((l: string) => l.trim()).forEach((line: string) => {
                    logs.push({ type: 'error', content: line });
                });
            }

            // Handle runtime output
            if (result.run) {
                if (result.run.stdout) {
                    result.run.stdout.split('\n').filter((l: string) => l.trim()).forEach((line: string) => {
                        logs.push({ type: 'log', content: line });
                    });
                }
                if (result.run.stderr) {
                    result.run.stderr.split('\n').filter((l: string) => l.trim()).forEach((line: string) => {
                        logs.push({ type: 'error', content: line });
                    });
                }
                if (result.run.code !== 0 && result.run.code !== undefined) {
                    logs.push({ type: 'info', content: `Exit code: ${result.run.code}` });
                }
            }

            if (logs.length === 0) {
                logs.push({ type: 'info', content: '(No output)' });
            } else if (!logs.some(l => l.type === 'error')) {
                logs.unshift({ type: 'result', content: '✅ Executed successfully!' });
            }

            setOutput(logs);
        } catch (error: any) {
            setOutput([
                { type: 'error', content: `Failed to execute code: ${error.message}` },
                { type: 'info', content: 'Make sure you have an internet connection. The Piston API is used for compilation.' }
            ]);
        } finally {
            setIsRunning(false);
        }
    };

    const handleRun = () => {
        setShowPreview(false);

        if (language === 'javascript' || language === 'typescript') {
            runJavaScript();
        } else if (language === 'python') {
            runPython();
        } else if (language === 'html' || language === 'css') {
            runHTML();
        } else if (language === 'json') {
            // Validate JSON
            setIsRunning(true);
            try {
                const parsed = JSON.parse(code);
                setOutput([
                    { type: 'result', content: '✅ Valid JSON!' },
                    { type: 'log', content: JSON.stringify(parsed, null, 2) }
                ]);
            } catch (error: any) {
                setOutput([
                    { type: 'error', content: `Invalid JSON: ${error.message}` }
                ]);
            }
            setIsRunning(false);
        } else if (PISTON_LANGUAGES[language]) {
            // Use Piston API for compiled languages (Java, C++, etc.)
            runWithPiston();
        } else {
            setOutput([
                { type: 'error', content: `Direct execution not supported for ${language}.` },
                { type: 'info', content: 'Supported languages: JavaScript, TypeScript, Python, Java, C++, C, Go, Rust, Ruby, PHP, HTML, CSS, JSON' }
            ]);
        }
    };

    return (
        <div
            ref={panelRef}
            className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 animate-in slide-in-from-bottom duration-200 flex flex-col"
            style={{ height: panelHeight }}
        >
            {/* Drag Handle */}
            <div
                className={`flex items-center justify-center h-2 cursor-ns-resize hover:bg-gray-700 transition-colors group ${isDragging ? 'bg-blue-600' : 'bg-gray-800'}`}
                onMouseDown={handleMouseDown}
            >
                <GripHorizontal size={16} className={`${isDragging ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
                <div className="flex items-center gap-2">
                    {showPreview ? (
                        <Globe size={16} className="text-purple-400" />
                    ) : (
                        <Terminal size={16} className="text-blue-400" />
                    )}
                    <span className="text-sm font-medium text-gray-300">
                        {showPreview ? 'HTML Preview' : 'Code Output'}
                        {isPyodideLoading && ' (Loading Python...)'}
                    </span>
                    {language === 'python' && !pyodideInstance && (
                        <span className="text-xs text-gray-500 ml-2">
                            (Pyodide WebAssembly)
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                        {isRunning ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Play size={14} />
                        )}
                        {isRunning ? 'Running...' : 'Re-run'}
                    </button>
                    <button
                        onClick={toggleExpanded}
                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {showPreview ? (
                    <div className="bg-white h-full">
                        <iframe
                            ref={iframeRef}
                            title="HTML Preview"
                            className="w-full h-full border-0"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                ) : (
                    <div className="p-4 font-mono text-sm h-full">
                        {output.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                Click "Run" to execute the code
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {output.map((line, index) => (
                                    <div
                                        key={index}
                                        className={`whitespace-pre-wrap ${
                                            line.type === 'error'
                                                ? 'text-red-400'
                                                : line.type === 'result'
                                                    ? 'text-green-400'
                                                    : line.type === 'info'
                                                        ? 'text-blue-400'
                                                        : 'text-gray-300'
                                        }`}
                                    >
                                        {line.content}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeRunner;
