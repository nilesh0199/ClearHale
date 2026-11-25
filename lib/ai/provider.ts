import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProviderName, AIMessage, AIOptions } from './providerTypes';
import { getLanguageAiProvider } from './config';

export * from './providerTypes';
export * from './config';

// Localized tips for regional Indian languages when fallback is used
export const REGIONAL_FALLBACK_TIPS: Record<string, string> = {
  mr: 'टीप: काही स्पष्ट नसल्यास इंग्रजीवर स्विच करा.',
  bn: 'পরামর্শ: কিছু অস্পষ্ট হলে ইংরেজিতে পরিবর্তন করুন।',
  ta: 'குறிப்பு: ஏதேனும் புரியவில்லை என்றால் ஆங்கிலத்திற்கு மாறவும்.',
  te: 'చిట్కా: ఏదైనా అస్పష్టంగా ఉంటే ఆంగ్లానికి మారండి.',
  kn: 'ಸಲಹೆ: ಏನಾದರೂ ಸ್ಪಷ್ಟವಿಲ್ಲದಿದ್ದರೆ ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಯಿಸಿ.',
  ml: 'സൂചന: എന്തെങ്കിലും വ്യക്തമല്ലെങ്കിൽ ഇംഗ്ലീഷിലേക്ക് മാറുക.',
  gu: 'સલાહ: જો કંઈપણ અસ્પષ્ટ હોય તો અંગ્રેજી પર સ્વિચ કરો.',
  pa: 'ਸੁਝਾਅ: ਜੇਕਰ ਕੁਝ ਅਸਪਸ਼ਟ ਹੈ ਤਾਂ ਅੰਗਰੇਜ਼ੀ \'ਤੇ ਸਵਿਚ ਕਰੋ।',
};

// Rate Limit / Server Error Cooldown Cache: skip provider for 60 seconds
const rateLimitedUntil: Record<ProviderName, number> = {
  gemini: 0,
  groq: 0,
};

export function markProviderRateLimited(provider: ProviderName): void {
  rateLimitedUntil[provider] = Date.now() + 60000;
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[AI Provider] ${provider} rate-limited or error. Cooldown for 60s.`);
  }
}

export function isProviderRateLimited(provider: ProviderName): boolean {
  return Date.now() < rateLimitedUntil[provider];
}

// Development logger
function devLog(message: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AI Provider] ${message}`, ...args);
  }
}

function getGeminiModel(): string {
  const custom = process.env.GEMINI_MODEL?.trim();
  if (custom) return custom;
  return 'gemini-2.5-flash';
}

function getGroqModel(): string {
  const custom = process.env.GROQ_MODEL?.trim();
  if (custom) return custom;
  return 'llama-3.3-70b-versatile';
}

/**
 * Determines primary and secondary provider order:
 * 1. Checks which API keys are actually configured in the environment.
 * 2. If only one provider's key is set (e.g. GEMINI_API_KEY on Vercel), prioritizes that provider.
 * 3. If both are set, routes according to language capability (Groq for EN/HI, Gemini for regional).
 */
export function getProviderOrder(language?: string, customGeminiKey?: string): {
  primary: ProviderName;
  secondary: ProviderName;
} {
  const hasGroq = Boolean(process.env.GROQ_API_KEY?.trim());
  const hasGemini = Boolean(customGeminiKey?.trim() || process.env.GEMINI_API_KEY?.trim());

  if (!hasGroq && hasGemini) {
    return { primary: 'gemini', secondary: 'groq' };
  }
  if (hasGroq && !hasGemini) {
    return { primary: 'groq', secondary: 'gemini' };
  }

  const primary: ProviderName = getLanguageAiProvider(language);
  const secondary: ProviderName = primary === 'gemini' ? 'groq' : 'gemini';
  return { primary, secondary };
}

// Check whether to append regional language tip
function getRegionalTip(lang?: string, sessionHadTip?: boolean): string | null {
  if (!lang || lang === 'en' || lang === 'hi' || sessionHadTip) {
    return null;
  }
  const tip = REGIONAL_FALLBACK_TIPS[lang];
  return tip ? `\n\n(${tip})` : null;
}

// --- GEMINI IMPLEMENTATION (Direct REST SSE Streaming) ---
async function callGeminiStream(
  messages: AIMessage[],
  options: AIOptions,
  signal: AbortSignal,
  onFirstToken: () => void,
  onChunk: (text: string) => void
): Promise<void> {
  const apiKey = (options.customGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const systemMessage =
    options.systemPrompt ||
    messages.find((m) => m.role === 'system')?.content ||
    '';

  const userMessages = messages.filter((m) => m.role !== 'system');
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
  const conversationText = userMessages.length > 1
    ? userMessages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
    : lastUserMessage;

  const preferredModel = getGeminiModel();
  const modelsToTry = Array.from(
    new Set([
      preferredModel,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest',
    ])
  );
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    let emittedInThisModel = false;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const requestBody: Record<string, unknown> = {
        contents: [{ parts: [{ text: conversationText }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxTokens,
          ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      };
      if (systemMessage) {
        requestBody.systemInstruction = { parts: [{ text: systemMessage }] };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        devLog(`Gemini stream model [${modelName}] HTTP error ${res.status}: ${errText}`);
        lastError = new Error(`Gemini HTTP error ${res.status}: ${errText}`);
        if (res.status === 400 || res.status === 403 || res.status === 429) {
          break;
        }
        continue;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Gemini response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';
      let hasEmittedFirst = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);

          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              if (!hasEmittedFirst) {
                hasEmittedFirst = true;
                onFirstToken();
              }
              emittedInThisModel = true;
              onChunk(text);
            }
          } catch (e) {
            // Skip unparseable chunks
          }
        }
      }
      return; // Succeeded!
    } catch (err: unknown) {
      if (signal.aborted) throw err;
      const errObj = err instanceof Error ? err : new Error(String(err));
      lastError = errObj;
      devLog(`Gemini stream model [${modelName}] failed:`, errObj.message);
      if (emittedInThisModel) {
        throw err;
      }
      continue;
    }
  }

  if (lastError) throw lastError;
}

async function callGeminiGenerate(
  messages: AIMessage[],
  options: AIOptions,
  signal: AbortSignal
): Promise<string> {
  const apiKey = (options.customGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const systemMessage =
    options.systemPrompt ||
    messages.find((m) => m.role === 'system')?.content ||
    '';

  const userMessages = messages.filter((m) => m.role !== 'system');
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
  const conversationText = userMessages.length > 1
    ? userMessages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
    : lastUserMessage;

  const preferredModel = getGeminiModel();
  const modelsToTry = Array.from(
    new Set([
      preferredModel,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest',
    ])
  );
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const requestBody: Record<string, unknown> = {
        contents: [{ parts: [{ text: conversationText }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxTokens,
          ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      };
      if (systemMessage) {
        requestBody.systemInstruction = { parts: [{ text: systemMessage }] };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        devLog(`Gemini generate model [${modelName}] HTTP error ${res.status}: ${errText}`);
        lastError = new Error(`Gemini HTTP error ${res.status}: ${errText}`);
        if (res.status === 400 || res.status === 403 || res.status === 429) {
          break;
        }
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err: unknown) {
      if (signal.aborted) throw err;
      const errObj = err instanceof Error ? err : new Error(String(err));
      lastError = errObj;
      devLog(`Gemini generate model [${modelName}] failed:`, errObj.message);
      continue;
    }
  }

  if (lastError) throw lastError;
  return '';
}

// --- GROQ IMPLEMENTATION (OpenAI-compatible) ---
async function callGroqStream(
  messages: AIMessage[],
  options: AIOptions,
  signal: AbortSignal,
  onFirstToken: () => void,
  onChunk: (text: string) => void
): Promise<void> {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const groqMessages = [...messages];
  if (options.systemPrompt && !groqMessages.some((m) => m.role === 'system')) {
    groqMessages.unshift({ role: 'system', content: options.systemPrompt });
  }

  // If regional language (not en or hi), append simplicity guidance
  if (options.language && options.language !== 'en' && options.language !== 'hi') {
    const sysIdx = groqMessages.findIndex((m) => m.role === 'system');
    if (sysIdx !== -1) {
      groqMessages[sysIdx].content +=
        '\n\nKeep sentences very short, clear, and simple for regional language accuracy.';
    }
  }

  const preferredModel = getGroqModel();
  const modelsToTry = Array.from(
    new Set([
      preferredModel,
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'qwen/qwen3.8-27b',
    ])
  );
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    let emittedInThisModel = false;
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: groqMessages,
          stream: true,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens,
        }),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        devLog(`Groq stream model [${modelName}] HTTP error ${res.status}: ${errText}`);
        lastError = new Error(`Groq HTTP error ${res.status}: ${errText}`);
        continue;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Groq response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';
      let hasEmittedFirst = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (jsonStr === '[DONE]') return;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              if (!hasEmittedFirst) {
                hasEmittedFirst = true;
                onFirstToken();
              }
              emittedInThisModel = true;
              onChunk(delta);
            }
          } catch (e) {
            // Skip malformed SSE chunks
          }
        }
      }
      return; // Succeeded!
    } catch (err: unknown) {
      if (signal.aborted) throw err;
      const errObj = err instanceof Error ? err : new Error(String(err));
      lastError = errObj;
      devLog(`Groq stream model [${modelName}] failed:`, errObj.message);
      if (emittedInThisModel) {
        throw err;
      }
      continue;
    }
  }

  if (lastError) throw lastError;
}

async function callGroqGenerate(
  messages: AIMessage[],
  options: AIOptions,
  signal: AbortSignal
): Promise<string> {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const groqMessages = [...messages];
  if (options.systemPrompt && !groqMessages.some((m) => m.role === 'system')) {
    groqMessages.unshift({ role: 'system', content: options.systemPrompt });
  }

  if (options.language && options.language !== 'en' && options.language !== 'hi') {
    const sysIdx = groqMessages.findIndex((m) => m.role === 'system');
    if (sysIdx !== -1) {
      groqMessages[sysIdx].content +=
        '\n\nKeep sentences very short, clear, and simple for regional language accuracy.';
    }
  }

  const preferredModel = getGroqModel();
  const modelsToTry = Array.from(
    new Set([
      preferredModel,
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'qwen/qwen3.8-27b',
    ])
  );
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: groqMessages,
          stream: false,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens,
          ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        devLog(`Groq generate model [${modelName}] HTTP error ${res.status}: ${errText}`);
        lastError = new Error(`Groq HTTP error ${res.status}: ${errText}`);
        continue;
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err: unknown) {
      if (signal.aborted) throw err;
      const errObj = err instanceof Error ? err : new Error(String(err));
      lastError = errObj;
      devLog(`Groq generate model [${modelName}] failed:`, errObj.message);
      continue;
    }
  }

  if (lastError) throw lastError;
  return '';
}

// --- PUBLIC ABSTRACTION: STREAM ---
export async function stream(
  messages: AIMessage[],
  options: AIOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const { primary, secondary } = getProviderOrder(options.language, options.customGeminiKey);

  const isDebugForceFallback = process.env.DEBUG_FORCE_FALLBACK === 'true';

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let tokensEmitted = 0;
      let activeProvider: ProviderName | 'template' = primary;
      let usedFallback = false;
      let bufferedText = '';

      // Helper to enqueue text
      const sendText = (text: string) => {
        if (options.transformText) {
          bufferedText += text;
          tokensEmitted++;
        } else {
          controller.enqueue(encoder.encode(text));
          tokensEmitted++;
        }
      };

      // 1. Primary Attempt
      let primarySucceeded = false;
      const primaryRateLimited = isProviderRateLimited(primary);

      if (!primaryRateLimited && !isDebugForceFallback) {
        const primaryAbort = new AbortController();
        let primaryFirstTokenArrived = false;

        const timeout12s = setTimeout(() => {
          if (!primaryFirstTokenArrived) {
            devLog(`Primary [${primary}] 12-second first token timeout. Aborting.`);
            primaryAbort.abort();
          }
        }, 12000);

        try {
          devLog(`Invoking Primary Provider: ${primary} (lang: ${options.language || 'default'})`);
          if (primary === 'gemini') {
            await callGeminiStream(
              messages,
              options,
              primaryAbort.signal,
              () => {
                primaryFirstTokenArrived = true;
                clearTimeout(timeout12s);
              },
              (chunk) => sendText(chunk)
            );
          } else {
            await callGroqStream(
              messages,
              options,
              primaryAbort.signal,
              () => {
                primaryFirstTokenArrived = true;
                clearTimeout(timeout12s);
              },
              (chunk) => sendText(chunk)
            );
          }

          clearTimeout(timeout12s);
          primarySucceeded = true;
          devLog(`Primary Provider [${primary}] finished successfully.`);
        } catch (err: unknown) {
          clearTimeout(timeout12s);
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg.includes('429') || errMsg.includes('500') || errMsg.includes('503')) {
            markProviderRateLimited(primary);
          }
          devLog(`Primary Provider [${primary}] failed:`, errMsg);
          if (tokensEmitted > 0) {
            sendText('\n\n*Note: Keep prescribed rescue inhalers accessible, monitor symptoms closely, and consult your physician for individualized medical advice.*');
          }
        }
      } else {
        if (primaryRateLimited) {
          devLog(`Primary [${primary}] is currently in cooldown. Skipping to fallback.`);
        } else if (isDebugForceFallback) {
          devLog(`DEBUG_FORCE_FALLBACK=true: Skipping primary [${primary}].`);
        }
      }

      // 2. Secondary Attempt if primary did not finish and no tokens were emitted yet
      if (!primarySucceeded && tokensEmitted === 0) {
        usedFallback = true;
        activeProvider = secondary;
        const secondaryRateLimited = isProviderRateLimited(secondary);

        if (!secondaryRateLimited) {
          const secondaryAbort = new AbortController();
          let secondaryFirstTokenArrived = false;

          const secondaryTimeout12s = setTimeout(() => {
            if (!secondaryFirstTokenArrived) {
              devLog(`Secondary [${secondary}] 12-second first token timeout. Aborting.`);
              secondaryAbort.abort();
            }
          }, 12000);

          try {
            devLog(`Invoking Secondary Fallback Provider: ${secondary}`);
            if (secondary === 'gemini') {
              await callGeminiStream(
                messages,
                options,
                secondaryAbort.signal,
                () => {
                  secondaryFirstTokenArrived = true;
                  clearTimeout(secondaryTimeout12s);
                },
                (chunk) => sendText(chunk)
              );
            } else {
              await callGroqStream(
                messages,
                options,
                secondaryAbort.signal,
                () => {
                  secondaryFirstTokenArrived = true;
                  clearTimeout(secondaryTimeout12s);
                },
                (chunk) => sendText(chunk)
              );
            }

            clearTimeout(secondaryTimeout12s);
            devLog(`Secondary Fallback Provider [${secondary}] finished successfully.`);
          } catch (secErr: unknown) {
            clearTimeout(secondaryTimeout12s);
            const errMsg = secErr instanceof Error ? secErr.message : String(secErr);
            if (errMsg.includes('429') || errMsg.includes('500') || errMsg.includes('503')) {
              markProviderRateLimited(secondary);
            }
            devLog(`Secondary Provider [${secondary}] failed:`, errMsg);
            if (tokensEmitted > 0) {
              sendText('\n\n*Note: Keep prescribed rescue inhalers accessible, monitor symptoms closely, and consult your physician for individualized medical advice.*');
            }
          }
        }
      }

      // 3. Ultimate Fallback to Template if no tokens were emitted
      if (tokensEmitted === 0) {
        devLog('Both providers failed or unavailable. Falling back to safe offline template.');
        activeProvider = 'template';
        const fallbackText =
          options.fallbackTemplateText ||
          'Keep windows and doors closed, run indoor HEPA or DIY MERV-13 air filtration, and wear an N95 respirator if stepping outdoors.';
        sendText(fallbackText);
      }

      // 4. Regional language tip: If fallback was used and language is not en/hi
      if (usedFallback && (activeProvider === 'groq' || activeProvider === 'template')) {
        const tip = getRegionalTip(options.language, options.sessionHadTip);
        if (tip) {
          sendText(tip);
          options.onTipAppended?.();
        }
      }

      if (options.transformText && bufferedText) {
        const transformed = options.transformText(bufferedText);
        controller.enqueue(encoder.encode(transformed));
      }

      controller.close();
    },
  });
}

// --- PUBLIC ABSTRACTION: GENERATE ---
export async function generate(
  messages: AIMessage[],
  options: AIOptions = {}
): Promise<string> {
  const { primary, secondary } = getProviderOrder(options.language, options.customGeminiKey);
  const isDebugForceFallback = process.env.DEBUG_FORCE_FALLBACK === 'true';

  let usedFallback = false;
  let activeProvider: ProviderName | 'template' = primary;

  // 1. Primary Attempt
  if (!isProviderRateLimited(primary) && !isDebugForceFallback) {
    const abortCtrl = new AbortController();
    const timeout = setTimeout(() => abortCtrl.abort(), 12000);

    try {
      devLog(`Generate: Invoking Primary [${primary}] (lang: ${options.language || 'default'})`);
      const result =
        primary === 'gemini'
          ? await callGeminiGenerate(messages, options, abortCtrl.signal)
          : await callGroqGenerate(messages, options, abortCtrl.signal);

      clearTimeout(timeout);
      if (result && result.trim()) {
        devLog(`Generate: Primary [${primary}] succeeded.`);
        const text = result.trim();
        return options.transformText ? options.transformText(text) : text;
      }
    } catch (err: unknown) {
      clearTimeout(timeout);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('429') || errMsg.includes('500') || errMsg.includes('503')) {
        markProviderRateLimited(primary);
      }
      devLog(`Generate: Primary [${primary}] failed:`, errMsg);
    }
  }

  // 2. Secondary Attempt
  usedFallback = true;
  activeProvider = secondary;

  if (!isProviderRateLimited(secondary)) {
    const secAbortCtrl = new AbortController();
    const secTimeout = setTimeout(() => secAbortCtrl.abort(), 12000);

    try {
      devLog(`Generate: Invoking Secondary Fallback [${secondary}]`);
      const secResult =
        secondary === 'gemini'
          ? await callGeminiGenerate(messages, options, secAbortCtrl.signal)
          : await callGroqGenerate(messages, options, secAbortCtrl.signal);

      clearTimeout(secTimeout);
      if (secResult && secResult.trim()) {
        devLog(`Generate: Secondary [${secondary}] succeeded.`);
        let output = secResult.trim();
        const tip = getRegionalTip(options.language, options.sessionHadTip);
        if (tip) output += tip;
        return options.transformText ? options.transformText(output) : output;
      }
    } catch (secErr: unknown) {
      clearTimeout(secTimeout);
      const errMsg = secErr instanceof Error ? secErr.message : String(secErr);
      if (errMsg.includes('429') || errMsg.includes('500') || errMsg.includes('503')) {
        markProviderRateLimited(secondary);
      }
      devLog(`Generate: Secondary [${secondary}] failed:`, errMsg);
    }
  }

  // 3. Fallback to Template
  devLog('Generate: Both providers failed. Returning template.');
  const fallback =
    options.fallbackTemplateText ||
    'Keep windows and doors closed, run indoor filtration, and avoid outdoor exertion during high smog hours.';
  return options.transformText ? options.transformText(fallback) : fallback;
}
