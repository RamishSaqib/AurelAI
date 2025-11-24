import OpenAI from 'openai';
import { useStore } from '../store/useStore';

export interface AIService {
    sendMessage(codeContext: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[]): Promise<string>;
}

class MockAIService implements AIService {
    async sendMessage(codeContext: string, _userMessage: string, _history: { role: 'user' | 'assistant', content: string }[]): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(
                    `I analyzed the code block:\n\n\`\`\`\n${codeContext.slice(0, 50)}...\n\`\`\`\n\nHere is a suggested improvement:\n\n\`\`\`javascript\n// Optimized version\nfunction optimized() {\n  return true;\n}\n\`\`\`\n\nHope this helps!`
                );
            }, 1000);
        });
    }
}

class OpenAIService implements AIService {
    private client: OpenAI | null = null;

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
        });
    }

    async sendMessage(codeContext: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[]): Promise<string> {
        if (!this.client) throw new Error("OpenAI client not initialized");

        const messages: any[] = [
            { role: 'system', content: `You are an expert coding assistant. You are reviewing the following code:\n\n${codeContext}\n\nProvide helpful, concise feedback and code improvements.` },
            ...history,
            { role: 'user', content: userMessage }
        ];

        const completion = await this.client.chat.completions.create({
            messages: messages,
            model: 'gpt-4o',
        });

        return completion.choices[0].message.content || "No response generated.";
    }
}

// Singleton proxy that switches implementation based on store
export const aiService = {
    sendMessage: async (codeContext: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[]) => {
        const apiKey = useStore.getState().apiKey;
        const openFiles = useStore.getState().openFiles;

        // Build enhanced context with all open files
        let enhancedContext = codeContext;
        if (openFiles.length > 0) {
            const filesContext = openFiles.map(f =>
                `\n### File: ${f.name} (${f.language})\n\`\`\`${f.language}\n${f.content}\n\`\`\``
            ).join('\n');
            enhancedContext = `${codeContext}\n\n## Other Open Files:\n${filesContext}`;
        }

        if (apiKey && apiKey.startsWith('sk-')) {
            const service = new OpenAIService(apiKey);
            return service.sendMessage(enhancedContext, userMessage, history);
        } else {
            const service = new MockAIService();
            return service.sendMessage(enhancedContext, userMessage, history);
        }
    }
};
