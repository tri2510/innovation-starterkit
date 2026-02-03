import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';

declare module 'openai/resources/chat/completions' {
  interface ChatCompletionCreateParamsNonStreaming {
    thinking?: { type: 'enabled' | 'disabled' };
  }

  interface ChatCompletionCreateParamsStreaming {
    thinking?: { type: 'enabled' | 'disabled' };
  }

  interface ChatCompletionCreateParamsBase {
    thinking?: { type: 'enabled' | 'disabled' };
  }
}
