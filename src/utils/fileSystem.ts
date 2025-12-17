// File System Access API utilities
// Note: This API is only available in secure contexts (HTTPS) and modern browsers

export interface FileHandle {
    name: string;
    handle: FileSystemFileHandle;
}

export const openFile = async (): Promise<{ content: string; handle: FileSystemFileHandle } | null> => {
    try {
        // @ts-ignore - File System Access API types may not be available
        const [fileHandle] = await window.showOpenFilePicker({
            types: [
                {
                    description: 'Code Files',
                    accept: {
                        'text/javascript': ['.js', '.jsx', '.mjs', '.cjs'],
                        'text/typescript': ['.ts', '.tsx', '.mts', '.cts'],
                        'text/x-python': ['.py', '.pyw'],
                        'text/x-java': ['.java'],
                        'text/x-c': ['.c', '.h'],
                        'text/x-c++': ['.cpp', '.cc', '.cxx', '.hpp', '.hh'],
                        'text/x-go': ['.go'],
                        'text/x-rust': ['.rs'],
                        'text/x-ruby': ['.rb'],
                        'text/x-php': ['.php'],
                        'text/html': ['.html', '.htm'],
                        'text/css': ['.css', '.scss', '.sass', '.less'],
                        'application/json': ['.json'],
                        'text/markdown': ['.md', '.mdx'],
                        'text/plain': ['.txt', '.log', '.env'],
                        'text/yaml': ['.yaml', '.yml'],
                        'text/xml': ['.xml', '.svg'],
                    },
                },
                {
                    description: 'All Files',
                    accept: {
                        '*/*': [],
                    },
                },
            ],
            multiple: false,
        });

        const file = await fileHandle.getFile();
        const content = await file.text();

        return { content, handle: fileHandle };
    } catch (error) {
        // User cancelled or API not supported
        console.error('Error opening file:', error);
        return null;
    }
};

export const saveFile = async (content: string, handle?: FileSystemFileHandle): Promise<FileSystemFileHandle | null> => {
    try {
        let fileHandle = handle;

        if (!fileHandle) {
            // @ts-ignore
            fileHandle = await window.showSaveFilePicker({
                types: [
                    {
                        description: 'Code Files',
                        accept: {
                            'text/javascript': ['.js', '.jsx', '.mjs', '.cjs'],
                            'text/typescript': ['.ts', '.tsx', '.mts', '.cts'],
                            'text/x-python': ['.py', '.pyw'],
                            'text/x-java': ['.java'],
                            'text/x-c': ['.c', '.h'],
                            'text/x-c++': ['.cpp', '.cc', '.cxx', '.hpp', '.hh'],
                            'text/x-go': ['.go'],
                            'text/x-rust': ['.rs'],
                            'text/x-ruby': ['.rb'],
                            'text/x-php': ['.php'],
                            'text/html': ['.html', '.htm'],
                            'text/css': ['.css', '.scss', '.sass', '.less'],
                            'application/json': ['.json'],
                            'text/markdown': ['.md', '.mdx'],
                            'text/plain': ['.txt', '.log'],
                            'text/yaml': ['.yaml', '.yml'],
                            'text/xml': ['.xml', '.svg'],
                        },
                    },
                    {
                        description: 'All Files',
                        accept: {
                            '*/*': [],
                        },
                    },
                ],
            });
        }

        if (!fileHandle) return null;

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        return fileHandle;
    } catch (error) {
        console.error('Error saving file:', error);
        return null;
    }
};

export const isFileSystemAccessSupported = (): boolean => {
    // @ts-ignore
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
};
