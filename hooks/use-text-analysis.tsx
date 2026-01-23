"use client"

import { useState, useCallback, useRef } from 'react';

interface WebSearchSource {
  title: string;
  link: string;
  content: string;
  refer: string;
}

interface AnalysisState {
  isAnalyzing: boolean;
  thinking: string;
  content: string;
  sources: WebSearchSource[];
  error: string | null;
}

export function useTextAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    thinking: '',
    content: '',
    sources: [],
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({
      isAnalyzing: false,
      thinking: '',
      content: '',
      sources: [],
      error: null
    });
  }, []);

  const analyze = useCallback(async (text: string) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState({
      isAnalyzing: true,
      thinking: '',
      content: '',
      sources: [],
      error: null
    });

    try {
      const response = await fetch('/api/ai/analyze-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedText: text,
          context: {
            phase: getCurrentPhase()
          }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              switch (parsed.type) {
                case 'thinking':
                  setState(prev => ({
                    ...prev,
                    thinking: prev.thinking + parsed.content
                  }));
                  break;
                case 'content':
                  setState(prev => ({
                    ...prev,
                    content: prev.content + parsed.content
                  }));
                  break;
                case 'sources':
                  setState(prev => ({
                    ...prev,
                    sources: parsed.data
                  }));
                  break;
                case 'done':
                  setState(prev => ({
                    ...prev,
                    isAnalyzing: false
                  }));
                  break;
                case 'error':
                  setState(prev => ({
                    ...prev,
                    isAnalyzing: false,
                    error: parsed.message
                  }));
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', data, e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  return { state, analyze, reset };
}

// Helper function to determine current phase from URL
function getCurrentPhase(): string {
  if (typeof window === 'undefined') return 'unknown';
  const path = window.location.pathname;
  if (path.includes('/challenge')) return 'challenge';
  if (path.includes('/market')) return 'market';
  if (path.includes('/ideation')) return 'ideation';
  if (path.includes('/investment-appraisal')) return 'investment-appraisal';
  if (path.includes('/pitch')) return 'pitch';
  return 'unknown';
}
