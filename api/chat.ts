import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Detect programming language from code content
const detectLanguage = (code: string, hint?: string): string => {
    if (hint && hint !== 'plaintext') return hint;

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

// Build system prompt for code review
const buildSystemPrompt = (codeContext: string, language: string): string => {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check for API key in environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }

    try {
        const { codeContext, userMessage, history, language } = req.body;

        if (!codeContext || !userMessage) {
            return res.status(400).json({ error: 'Missing required fields: codeContext, userMessage' });
        }

        const client = new OpenAI({ apiKey });
        const systemPrompt = buildSystemPrompt(codeContext, language || 'unknown');

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: systemPrompt },
            ...(history || []),
            { role: 'user', content: userMessage }
        ];

        const completion = await client.chat.completions.create({
            messages,
            model: 'gpt-4o',
            temperature: 0.3,
            max_tokens: 16000,
        });

        const responseContent = completion.choices[0].message.content || 'No response generated.';

        return res.status(200).json({ content: responseContent });
    } catch (error: unknown) {
        console.error('OpenAI API error:', error);
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes('rate limit')) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
        }
        if (message.includes('context length') || message.includes('maximum')) {
            return res.status(400).json({ error: 'The code is too long to analyze. Try selecting a smaller portion.' });
        }
        if (message.includes('API key')) {
            return res.status(401).json({ error: 'Invalid API key configured on server.' });
        }

        return res.status(500).json({ error: 'Failed to get AI response. Please try again.' });
    }
}
