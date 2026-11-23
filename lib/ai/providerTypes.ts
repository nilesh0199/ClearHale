export type ProviderName = 'gemini' | 'groq';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIOptions {
  systemPrompt?: string;
  language?: string;
  temperature?: number;
  maxTokens?: number;
  fallbackTemplateText?: string;
  sessionHadTip?: boolean;
  onTipAppended?: () => void;
  jsonMode?: boolean;
  transformText?: (text: string) => string;
}
