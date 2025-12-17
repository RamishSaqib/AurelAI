import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiService, buildSystemPrompt } from '../ai';
import { useStore } from '../../store/useStore';

// Mock fetch to simulate proxy being unavailable (falls back to client-side)
global.fetch = vi.fn(() =>
  Promise.reject(new Error('Failed to fetch'))
);

describe('aiService', () => {
  beforeEach(() => {
    useStore.setState({
      apiKey: '',
      openFiles: [],
      language: 'typescript',
    });
    vi.clearAllMocks();
  });

  describe('API key validation (client-side fallback)', () => {
    it('throws error when no API key is configured and proxy unavailable', async () => {
      useStore.setState({ apiKey: '' });

      await expect(
        aiService.sendMessage('const x = 1;', 'review this', [])
      ).rejects.toThrow('API key required');
    });

    it('throws error when API key is invalid format and proxy unavailable', async () => {
      useStore.setState({ apiKey: 'invalid-key' });

      await expect(
        aiService.sendMessage('const x = 1;', 'review this', [])
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('proxy behavior', () => {
    it('tries proxy first before falling back to client-side', async () => {
      useStore.setState({ apiKey: '' });

      await expect(
        aiService.sendMessage('const x = 1;', 'review this', [])
      ).rejects.toThrow();

      // Verify fetch was called (proxy was attempted)
      expect(fetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
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

  it('adds large file warning for code over 100 lines', () => {
    const code = Array(150).fill('const x = 1;').join('\n');

    const prompt = buildSystemPrompt(code, 'typescript');

    expect(prompt).toContain('LARGE FILE WARNING');
  });
});
