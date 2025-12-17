import OpenAI from 'openai';
import { useStore } from '../store/useStore';

export interface AIService {
    sendMessage(codeContext: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[], language?: string): Promise<string>;
}

// Detect programming language from code content
const detectLanguage = (code: string, hint?: string): string => {
    if (hint && hint !== 'plaintext') return hint;

    // Pattern-based detection
    if (code.includes('import React') || code.includes('useState') || code.includes('jsx')) return 'typescript/react';
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('func ') && code.includes('package ')) return 'go';
    if (code.includes('fn ') && code.includes('let mut')) return 'rust';
    if (code.includes('public class') || code.includes('private void')) return 'java';
    if (code.includes('#include') || code.includes('std::')) return 'cpp';
    if (code.includes('const ') || code.includes('let ') || code.includes('function ')) return 'javascript';
    if (code.includes('interface ') || code.includes(': string') || code.includes(': number')) return 'typescript';
    if (code.includes('<html') || code.includes('<!DOCTYPE')) return 'html';
    if (code.includes('{') && code.includes(':') && code.includes(';')) return 'css';

    return hint || 'unknown';
};

// Build comprehensive system prompt for high-quality code review
export const buildSystemPrompt = (codeContext: string, language: string): string => {
    const detectedLang = detectLanguage(codeContext, language);
    const lines = codeContext.split('\n');
    const lineCount = lines.length;
    const isLargeFile = lineCount > 100;

    return `You are an expert senior software engineer providing a focused, specific code review. You have deep expertise in ${detectedLang}.

## Code Under Review (${lineCount} lines)
\`\`\`${detectedLang}
${codeContext}
\`\`\`
${isLargeFile ? `
## LARGE FILE WARNING (${lineCount} lines)
This is a large code selection. When providing improved code:
- You MUST still return the complete code block, but prioritize the most important changes
- Make sure your response completes - don't let it get cut off
- If the code is too large to return completely, clearly state this and provide the most critical sections
` : ''}
## CRITICAL INSTRUCTIONS - READ CAREFULLY

### Be Specific, Not Generic
- **NEVER** give generic advice like "consider adding error handling" without pointing to the exact location
- **ALWAYS** reference specific function names, variable names, or line numbers from the code above
- **ALWAYS** explain issues in terms of THIS code, not hypothetical scenarios
- If the code has no issues, say "This code looks good" and explain why briefly

### What Makes a Good vs Bad Response

**BAD (generic, unhelpful):**
- "Consider adding input validation"
- "You might want to add error handling"
- "Consider using TypeScript types"

**GOOD (specific, actionable):**
- "The \`calculateTotal\` function on line 5 doesn't handle the case where \`items\` is null"
- "The \`userId\` parameter in \`fetchUser(userId)\` should be validated before the API call"
- "The \`data\` variable is typed as \`any\` - specify the expected shape: \`{ name: string; age: number }\`"

### Review Focus Areas for ${detectedLang}
1. **Bugs**: Logic errors, null handling, async issues, edge cases
2. **Security**: Injection vulnerabilities, data exposure, auth flaws
3. **Performance**: Unnecessary operations, memory issues, N+1 queries
4. **Quality**: Naming, complexity, duplication, error handling

### Response Format
1. **Quick Summary**: One sentence describing what this code does and your main finding
2. **Specific Findings**: List concrete issues with exact references to the code
3. **Improved Code**: If suggesting changes, provide the COMPLETE improved code

### Code Suggestions - CRITICAL
- **ALWAYS return the ENTIRE code block** with your changes applied, not just the modified portion
- The user will use "Apply Changes" to replace their selection with your code block
- If you only return a snippet, the rest of their code will be deleted
- Use \`\`\`${detectedLang} code blocks
- Make minimal changes to the code itself, but ALWAYS include the full context
- Include brief inline comments explaining significant changes

**Example - WRONG (partial code):**
\`\`\`${detectedLang}
// Just showing the fix:
if (items != null) {
    return items.reduce((a, b) => a + b, 0);
}
\`\`\`

**Example - CORRECT (complete code):**
\`\`\`${detectedLang}
function calculateTotal(items) {
    // Added null check
    if (items == null) {
        return 0;
    }
    return items.reduce((a, b) => a + b, 0);
}
\`\`\``;
};

// Client-side OpenAI service (fallback for local development)
class OpenAIService implements AIService {
    private client: OpenAI | null = null;

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async sendMessage(codeContext: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[], language?: string): Promise<string> {
        if (!this.client) throw new Error("OpenAI client not initialized");

        const systemPrompt = buildSystemPrompt(codeContext, language || 'unknown');

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage }
        ];

        const completion = await this.client.chat.completions.create({
            messages: messages,
            model: 'gpt-4o',
            temperature: 0.3,
            max_tokens: 16000,
        });

        return completion.choices[0].message.content || "No response generated.";
    }
}

// Constants for handling large files
const MAX_CODE_CONTEXT_LENGTH = 15000;
const MAX_FILE_CONTEXT_LENGTH = 5000;
const MAX_HISTORY_MESSAGES = 10;

// Truncate text with ellipsis indicator
const truncateText = (text: string, maxLength: number): { text: string; truncated: boolean } => {
    if (text.length <= maxLength) {
        return { text, truncated: false };
    }
    const truncated = text.slice(0, maxLength);
    const lastNewline = truncated.lastIndexOf('\n');
    const cutPoint = lastNewline > maxLength * 0.8 ? lastNewline : maxLength;
    return {
        text: truncated.slice(0, cutPoint) + '\n\n... [truncated - code too long]',
        truncated: true
    };
};

// Try server proxy first, fall back to client-side
const sendViaProxy = async (
    codeContext: string,
    userMessage: string,
    history: { role: 'user' | 'assistant', content: string }[],
    language: string
): Promise<string> => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeContext, userMessage, history, language }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
};

// Singleton proxy that tries server first, falls back to client-side
export const aiService = {
    sendMessage: async (codeContext: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[]) => {
        const apiKey = useStore.getState().apiKey;
        const openFiles = useStore.getState().openFiles;
        const language = useStore.getState().language;

        // Truncate main code context if too long
        const { text: truncatedCodeContext, truncated: wasCodeTruncated } = truncateText(codeContext, MAX_CODE_CONTEXT_LENGTH);

        // Build enhanced context with all open files
        let enhancedContext = truncatedCodeContext;
        let truncationNote = '';

        if (wasCodeTruncated) {
            truncationNote = '\n\n> Note: The selected code was truncated due to length. Focus on the visible portion.';
        }

        if (openFiles.length > 0) {
            const maxFiles = 5;
            const limitedFiles = openFiles.slice(0, maxFiles);

            const filesContext = limitedFiles.map(f => {
                const { text: truncatedContent, truncated: wasFileTruncated } = truncateText(f.content, MAX_FILE_CONTEXT_LENGTH);
                const truncateIndicator = wasFileTruncated ? ' [truncated]' : '';
                return `\n### File: ${f.name} (${f.language})${truncateIndicator}\n\`\`\`${f.language}\n${truncatedContent}\n\`\`\``;
            }).join('\n');

            if (openFiles.length > maxFiles) {
                truncationNote += `\n> Note: Only showing ${maxFiles} of ${openFiles.length} open files for context.`;
            }

            enhancedContext = `${truncatedCodeContext}\n\n## Other Open Files:\n${filesContext}`;
        }

        if (truncationNote) {
            enhancedContext += truncationNote;
        }

        const limitedHistory = history.slice(-MAX_HISTORY_MESSAGES);

        // Try server proxy first (works in production with OPENAI_API_KEY env var)
        try {
            return await sendViaProxy(enhancedContext, userMessage, limitedHistory, language);
        } catch (proxyError: unknown) {
            const proxyMessage = proxyError instanceof Error ? proxyError.message : String(proxyError);

            // If proxy explicitly says no API key configured, or if it's a 404 (proxy doesn't exist),
            // fall back to client-side with user's API key
            const isProxyUnavailable = proxyMessage.includes('not configured') ||
                                       proxyMessage.includes('404') ||
                                       proxyMessage.includes('Failed to fetch');

            if (!isProxyUnavailable) {
                // Proxy exists but returned an error (rate limit, etc.) - throw it
                throw new Error(proxyMessage);
            }

            // Fall back to client-side OpenAI
            if (!apiKey) {
                throw new Error('API key required. Please add your OpenAI API key in Settings.');
            }

            if (!apiKey.startsWith('sk-')) {
                throw new Error('Invalid API key. OpenAI API keys start with "sk-".');
            }

            try {
                const service = new OpenAIService(apiKey);
                return await service.sendMessage(enhancedContext, userMessage, limitedHistory, language);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                if (message.includes('rate limit')) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                }
                if (message.includes('context length') || message.includes('maximum')) {
                    throw new Error('The code is too long to analyze. Try selecting a smaller portion.');
                }
                if (message.includes('API key')) {
                    throw new Error('Invalid API key. Please check your settings.');
                }
                throw error;
            }
        }
    }
};
