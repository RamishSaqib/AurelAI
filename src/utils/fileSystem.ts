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
                        'text/*': ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.html', '.css', '.json', '.txt'],
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
                            'text/*': ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.html', '.css', '.json', '.txt'],
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
