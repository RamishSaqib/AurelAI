import { describe, it, expect, beforeEach } from 'vitest';
import { aiService, buildSystemPrompt } from '../ai';
import { useStore } from '../../store/useStore';

describe('aiService', () => {
  beforeEach(() => {
    useStore.setState({
      apiKey: '',
      openFiles: [],
      language: 'typescript',
    });
  });

  describe('API key validation', () => {
    it('throws error when no API key is configured', async () => {
      useStore.setState({ apiKey: '' });

      await expect(
        aiService.sendMessage('const x = 1;', 'review this', [])
      ).rejects.toThrow('API key required');
    });

    it('throws error when API key is invalid format', async () => {
      useStore.setState({ apiKey: 'invalid-key' });

      await expect(
        aiService.sendMessage('const x = 1;', 'review this', [])
      ).rejects.toThrow('Invalid API key');
    });
  });
});

describe('buildSystemPrompt', () => {
  it('includes the code context in the prompt', () => {
    const code = 'function calculateTotal(items) { return items.reduce((a, b) => a + b, 0); }';

    const prompt = buildSystemPrompt(code, 'typescript');

    expect(prompt).toContain(code);
  });

  it('includes language-specific guidance', () => {
    const code = 'const x = 1;';

    const prompt = buildSystemPrompt(code, 'typescript');

    expect(prompt.toLowerCase()).toContain('typescript');
  });

  it('instructs for specific, actionable feedback', () => {
    const code = 'const x = 1;';

    const prompt = buildSystemPrompt(code, 'typescript');

    expect(prompt.toLowerCase()).toContain('specific');
  });
});
