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
const buildSystemPrompt = (codeContext: string, language: string): string => {
    const detectedLang = detectLanguage(codeContext, language);

    return `You are an expert senior software engineer conducting a thorough code review. You have deep expertise in ${detectedLang} and software engineering best practices.

## Code Under Review
\`\`\`${detectedLang}
${codeContext}
\`\`\`

## Your Review Guidelines

### 1. Analysis Approach
- First, understand the code's PURPOSE and INTENT before suggesting changes
- Consider the broader context and how this code might fit into a larger system
- Be specific - reference exact line numbers or variable names when discussing issues

### 2. What to Look For
**Correctness & Bugs:**
- Logic errors, off-by-one errors, null/undefined handling
- Race conditions or async issues
- Missing edge cases
- Incorrect algorithm implementations

**Security Issues:**
- SQL injection, XSS, command injection vulnerabilities
- Sensitive data exposure
- Authentication/authorization flaws
- Insecure dependencies or patterns

**Performance:**
- Unnecessary loops or redundant operations
- Memory leaks or inefficient memory usage
- N+1 query problems
- Missing caching opportunities

**Code Quality:**
- Naming clarity (variables, functions, classes)
- Single responsibility principle violations
- Code duplication
- Overly complex logic that could be simplified
- Missing error handling

**Best Practices for ${detectedLang}:**
- Idiomatic patterns and conventions
- Modern language features that could improve the code
- Type safety (where applicable)
- Testability

### 3. Response Format
Structure your response clearly:
1. **Quick Summary**: One sentence overview of the code and main findings
2. **Specific Issues**: List concrete problems with explanations
3. **Suggestions**: Actionable improvements with code examples
4. **Improved Code**: When suggesting changes, always provide the complete improved code block

### 4. Communication Style
- Be constructive and educational, not just critical
- Explain WHY something is an issue, not just WHAT
- Prioritize issues by severity (critical > major > minor > nitpick)
- If the code is good, say so! Acknowledge well-written code

### 5. Code Suggestions
When providing code improvements:
- Use proper syntax highlighting with language-specific code blocks
- Include comments explaining significant changes
- Preserve the original functionality unless explicitly asked to change it
- Make minimal necessary changes rather than rewriting everything`;
};

class MockAIService implements AIService {
    async sendMessage(codeContext: string, userMessage: string, _history: { role: 'user' | 'assistant', content: string }[], language?: string): Promise<string> {
        const detectedLang = detectLanguage(codeContext, language);

        return new Promise((resolve) => {
            setTimeout(() => {
                // Provide more intelligent mock responses based on common patterns
                const mockResponses = this.generateIntelligentResponse(codeContext, userMessage, detectedLang);
                resolve(mockResponses);
            }, 1500);
        });
    }

    private generateIntelligentResponse(code: string, question: string, language: string): string {
        const lowerQuestion = question.toLowerCase();

        // Detect what kind of help the user wants
        if (lowerQuestion.includes('optimize') || lowerQuestion.includes('performance') || lowerQuestion.includes('faster')) {
            return this.generateOptimizationResponse(code, language);
        }

        if (lowerQuestion.includes('bug') || lowerQuestion.includes('error') || lowerQuestion.includes('fix') || lowerQuestion.includes('wrong')) {
            return this.generateBugAnalysis(code, language);
        }

        if (lowerQuestion.includes('security') || lowerQuestion.includes('vulnerable') || lowerQuestion.includes('safe')) {
            return this.generateSecurityAnalysis(code, language);
        }

        if (lowerQuestion.includes('explain') || lowerQuestion.includes('what does') || lowerQuestion.includes('how does')) {
            return this.generateExplanation(code, language);
        }

        if (lowerQuestion.includes('test') || lowerQuestion.includes('unit test')) {
            return this.generateTestSuggestion(code, language);
        }

        if (lowerQuestion.includes('cleaner') || lowerQuestion.includes('readable') || lowerQuestion.includes('refactor') || lowerQuestion.includes('simplify')) {
            return this.generateRefactorSuggestion(code, language);
        }

        // Default comprehensive review
        return this.generateComprehensiveReview(code, language);
    }

    private generateOptimizationResponse(code: string, language: string): string {
        return `## Performance Analysis

**Quick Summary**: I've analyzed your ${language} code for performance optimization opportunities.

### Potential Optimizations

1. **Loop Efficiency**: Consider whether any loops can be replaced with more efficient operations (map/filter/reduce in JS, list comprehensions in Python).

2. **Memoization**: If there are expensive calculations that might be repeated, consider caching results.

3. **Early Returns**: Add early return statements to avoid unnecessary computation.

### Suggested Improvement

\`\`\`${language}
// Optimized version with performance improvements
${code.includes('for') ? code.replace(/for\s*\([^)]+\)\s*{[^}]+}/, '// Consider using Array methods like .map(), .filter(), or .reduce()') : code}
\`\`\`

**Tip**: Use your browser's Performance tab or profiling tools to identify actual bottlenecks before optimizing.`;
    }

    private generateBugAnalysis(code: string, language: string): string {
        const issues: string[] = [];

        // Detect common bug patterns
        if (code.includes('==') && !code.includes('===')) {
            issues.push('- **Type Coercion**: Using `==` instead of `===` can lead to unexpected type coercion. Consider using strict equality.');
        }
        if (code.includes('var ')) {
            issues.push('- **Variable Scoping**: Using `var` instead of `let`/`const` can cause scoping issues. Prefer `const` for immutable values.');
        }
        if (code.includes('async') && !code.includes('try')) {
            issues.push('- **Missing Error Handling**: Async functions should have try-catch blocks to handle potential rejections.');
        }
        if (code.includes('.length') && code.includes('[')) {
            issues.push('- **Array Bounds**: Ensure array access is within bounds to prevent undefined access errors.');
        }

        if (issues.length === 0) {
            issues.push('- No obvious bugs detected in this code snippet. However, ensure to test edge cases.');
        }

        return `## Bug Analysis

**Quick Summary**: I've scanned your code for potential bugs and issues.

### Findings

${issues.join('\n')}

### Recommendations

1. **Add Input Validation**: Ensure all inputs are validated before processing
2. **Handle Edge Cases**: Consider what happens with empty arrays, null values, or unexpected types
3. **Error Boundaries**: Add appropriate error handling

\`\`\`${language}
// Example with improved error handling
try {
  ${code.split('\n')[0]}
  // ... rest of your code
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
\`\`\``;
    }

    private generateSecurityAnalysis(code: string, language: string): string {
        const vulnerabilities: string[] = [];

        if (code.includes('eval(') || code.includes('Function(')) {
            vulnerabilities.push('- **Code Injection Risk**: `eval()` or `Function()` detected. These can execute arbitrary code and are major security risks.');
        }
        if (code.includes('innerHTML')) {
            vulnerabilities.push('- **XSS Vulnerability**: `innerHTML` usage detected. This can allow script injection. Use `textContent` or sanitize input.');
        }
        if (code.includes('password') && code.includes('console.log')) {
            vulnerabilities.push('- **Sensitive Data Exposure**: Logging passwords or sensitive data is a security risk.');
        }
        if (code.includes('http://') && !code.includes('localhost')) {
            vulnerabilities.push('- **Insecure Protocol**: Using HTTP instead of HTTPS can expose data in transit.');
        }

        if (vulnerabilities.length === 0) {
            vulnerabilities.push('- No obvious security vulnerabilities detected. However, always validate and sanitize user inputs.');
        }

        return `## Security Analysis

**Quick Summary**: Security review of your ${language} code.

### Security Findings

${vulnerabilities.join('\n')}

### Security Best Practices

1. **Input Validation**: Always validate and sanitize user inputs
2. **Output Encoding**: Encode output to prevent injection attacks
3. **Least Privilege**: Only request permissions you need
4. **Secure Defaults**: Fail securely and use secure defaults`;
    }

    private generateExplanation(code: string, language: string): string {
        return `## Code Explanation

**Quick Summary**: Here's a breakdown of what this ${language} code does.

### Analysis

This code appears to:
${code.includes('function') || code.includes('const') || code.includes('def') ?
`1. **Define functionality**: Creates reusable logic that can be called elsewhere
2. **Process data**: Takes inputs and produces outputs` :
`1. **Execute statements**: Performs operations in sequence
2. **Manipulate state**: Modifies variables or data structures`}

### Key Components

- **Structure**: The code is organized ${code.includes('{') ? 'with blocks denoted by curly braces' : 'using indentation for structure'}
- **Variables**: ${code.includes('const') ? 'Uses `const` for immutable bindings' : code.includes('let') ? 'Uses `let` for mutable variables' : 'Defines variables for storing data'}
- **Logic Flow**: ${code.includes('if') ? 'Contains conditional branching' : code.includes('for') || code.includes('while') ? 'Contains iteration/looping' : 'Sequential execution'}

### How to Use

This code ${code.includes('export') ? 'exports functionality for use in other modules' : 'can be executed directly or integrated into a larger application'}.`;
    }

    private generateTestSuggestion(_code: string, language: string): string {
        const testFramework = language.includes('python') ? 'pytest' : 'Jest';
        const testSyntax = language.includes('python') ?
            `def test_function_name():
    # Arrange
    input_data = ...

    # Act
    result = your_function(input_data)

    # Assert
    assert result == expected_value` :
            `describe('YourFunction', () => {
  it('should handle normal input correctly', () => {
    // Arrange
    const input = ...;

    // Act
    const result = yourFunction(input);

    // Assert
    expect(result).toBe(expectedValue);
  });

  it('should handle edge cases', () => {
    expect(yourFunction(null)).toBeUndefined();
    expect(yourFunction([])).toEqual([]);
  });
});`;

        return `## Testing Suggestions

**Quick Summary**: Here's how to write tests for your ${language} code using ${testFramework}.

### Recommended Tests

1. **Happy Path**: Test normal expected inputs
2. **Edge Cases**: Empty inputs, null values, boundary conditions
3. **Error Cases**: Invalid inputs that should throw errors

### Example Test Structure

\`\`\`${language === 'python' ? 'python' : 'typescript'}
${testSyntax}
\`\`\`

### Testing Tips

- Aim for high code coverage but focus on meaningful tests
- Test behavior, not implementation details
- Use descriptive test names that explain what's being tested`;
    }

    private generateRefactorSuggestion(code: string, language: string): string {
        return `## Refactoring Suggestions

**Quick Summary**: Here are ways to improve the readability and maintainability of your code.

### Improvement Opportunities

1. **Naming**: Use descriptive names that reveal intent
2. **Single Responsibility**: Each function should do one thing well
3. **DRY Principle**: Extract repeated logic into reusable functions
4. **Early Returns**: Use guard clauses to reduce nesting

### Refactored Version

\`\`\`${language}
// Improved version with better structure
${code}
// Consider:
// - Breaking into smaller functions
// - Adding type annotations (if TypeScript)
// - Using meaningful variable names
// - Removing magic numbers/strings
\`\`\`

### Quick Wins

- Replace magic numbers with named constants
- Add JSDoc comments for public functions
- Use destructuring for cleaner parameter handling`;
    }

    private generateComprehensiveReview(code: string, language: string): string {
        return `## Code Review Summary

**Quick Summary**: I've reviewed your ${language} code and here are my findings.

### Strengths ✅
- The code is structured and organized
- Basic functionality is implemented

### Areas for Improvement 🔧

1. **Error Handling**: Consider adding try-catch blocks for robustness
2. **Type Safety**: ${language.includes('script') ? 'Consider adding TypeScript types for better maintainability' : 'Ensure proper type checking'}
3. **Documentation**: Add comments explaining complex logic

### Suggested Improvements

\`\`\`${language}
${code}
\`\`\`

### Recommendations

1. **Add Input Validation**: Verify inputs before processing
2. **Handle Edge Cases**: Consider empty, null, or unexpected values
3. **Write Tests**: Ensure functionality with unit tests
4. **Consider Performance**: Profile if dealing with large data sets

Feel free to ask follow-up questions about any specific aspect!`;
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

    async sendMessage(codeContext: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[], language?: string): Promise<string> {
        if (!this.client) throw new Error("OpenAI client not initialized");

        const systemPrompt = buildSystemPrompt(codeContext, language || 'unknown');

        const messages: any[] = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage }
        ];

        const completion = await this.client.chat.completions.create({
            messages: messages,
            model: 'gpt-4o',
            temperature: 0.3, // Lower temperature for more focused, accurate responses
            max_tokens: 2000,
        });

        return completion.choices[0].message.content || "No response generated.";
    }
}

// Constants for handling large files
const MAX_CODE_CONTEXT_LENGTH = 15000; // ~15k characters to stay within token limits
const MAX_FILE_CONTEXT_LENGTH = 5000; // Max per additional file
const MAX_HISTORY_MESSAGES = 10; // Keep conversation manageable

// Truncate text with ellipsis indicator
const truncateText = (text: string, maxLength: number): { text: string; truncated: boolean } => {
    if (text.length <= maxLength) {
        return { text, truncated: false };
    }
    const truncated = text.slice(0, maxLength);
    // Try to truncate at a line boundary
    const lastNewline = truncated.lastIndexOf('\n');
    const cutPoint = lastNewline > maxLength * 0.8 ? lastNewline : maxLength;
    return {
        text: truncated.slice(0, cutPoint) + '\n\n... [truncated - code too long]',
        truncated: true
    };
};

// Singleton proxy that switches implementation based on store
export const aiService = {
    sendMessage: async (codeContext: string, userMessage: string, history: { role: 'user' | 'assistant', content: string }[]) => {
        const apiKey = useStore.getState().apiKey;
        const openFiles = useStore.getState().openFiles;
        const language = useStore.getState().language;

        // Truncate main code context if too long
        const { text: truncatedCodeContext, truncated: wasCodeTruncated } = truncateText(codeContext, MAX_CODE_CONTEXT_LENGTH);

        // Build enhanced context with all open files (with individual truncation)
        let enhancedContext = truncatedCodeContext;
        let truncationNote = '';

        if (wasCodeTruncated) {
            truncationNote = '\n\n> Note: The selected code was truncated due to length. Focus on the visible portion.';
        }

        if (openFiles.length > 0) {
            // Truncate each file context and limit number of files
            const maxFiles = 5; // Limit additional context files
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

        // Limit history to prevent context overflow
        const limitedHistory = history.slice(-MAX_HISTORY_MESSAGES);

        try {
            if (apiKey && apiKey.startsWith('sk-')) {
                const service = new OpenAIService(apiKey);
                return await service.sendMessage(enhancedContext, userMessage, limitedHistory, language);
            } else {
                const service = new MockAIService();
                return await service.sendMessage(enhancedContext, userMessage, limitedHistory, language);
            }
        } catch (error: any) {
            // Handle specific API errors
            if (error.message?.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }
            if (error.message?.includes('context length') || error.message?.includes('maximum')) {
                throw new Error('The code is too long to analyze. Try selecting a smaller portion.');
            }
            if (error.message?.includes('API key')) {
                throw new Error('Invalid API key. Please check your settings.');
            }
            throw error;
        }
    }
};
