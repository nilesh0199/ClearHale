'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { isTtsSupported } from '@/lib/ai/config';
import { splitIntoSentences } from '@/context/VoiceContext';

export interface UseSpeechOptions {
  language?: string;
  speechRate?: number; // 0.8 - 1.5, default 1.2
  onStart?: () => void;
  onSentenceChange?: (sentenceIndex: number, sentenceText: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseSpeechReturn {
  speak: (text: string, options?: Partial<UseSpeechOptions>) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  currentSentenceIndex: number;
  sentences: string[];
  usingBrowserVoice: boolean;
  error: string | null;
  clearError: () => void;
}

// In-memory client-side audio cache by hash of text + language
const clientAudioCache = new Map<string, string>(); // hash -> objectURL

function hashKey(text: string, lang: string): string {
  let hash = 0;
  const str = `${lang}:${text.trim()}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `tts_${hash}`;
}

export function useSpeech(defaultOptions: UseSpeechOptions = {}): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [sentences, setSentences] = useState<string[]>([]);
  const [usingBrowserVoice, setUsingBrowserVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSentenceIndex(-1);
  }, []);

  const pause = useCallback(() => {
    if (activeAudioRef.current && !activeAudioRef.current.paused) {
      activeAudioRef.current.pause();
      setIsPaused(true);
    } else if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (activeAudioRef.current && activeAudioRef.current.paused) {
      activeAudioRef.current.play().catch(() => {});
      setIsPaused(false);
    } else if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  /**
   * Browser SpeechSynthesis Fallback
   */
  const speakWithBrowserSynthesis = useCallback(
    (
      sentenceList: string[],
      startIndex: number,
      lang: string,
      rate: number,
      opts?: Partial<UseSpeechOptions>
    ) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        setError('Speech synthesis is not supported on this device.');
        stop();
        return;
      }

      setUsingBrowserVoice(true);
      window.speechSynthesis.cancel();

      let idx = startIndex;

      const speakNextSentence = () => {
        if (!isPlayingRef.current || idx >= sentenceList.length) {
          stop();
          opts?.onEnd?.();
          return;
        }

        const sentenceText = sentenceList[idx];
        setCurrentSentenceIndex(idx);
        opts?.onSentenceChange?.(idx, sentenceText);

        const utterance = new SpeechSynthesisUtterance(sentenceText);
        utteranceRef.current = utterance;

        // Choose appropriate locale
        const localeMap: Record<string, string> = {
          en: 'en-IN',
          hi: 'hi-IN',
          mr: 'mr-IN',
          bn: 'bn-IN',
          ta: 'ta-IN',
          te: 'te-IN',
          kn: 'kn-IN',
          ml: 'ml-IN',
          gu: 'gu-IN',
          pa: 'pa-IN',
          or: 'or-IN',
        };
        utterance.lang = localeMap[lang] || 'en-IN';
        utterance.rate = rate;

        utterance.onend = () => {
          idx++;
          speakNextSentence();
        };

        utterance.onerror = (e) => {
          console.warn('[useSpeech] Browser synthesis error:', e);
          idx++;
          speakNextSentence();
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNextSentence();
    },
    [stop]
  );

  /**
   * Fetch audio URL from cache or /api/tts
   */
  const fetchSentenceAudio = useCallback(
    async (sentence: string, lang: string, signal: AbortSignal): Promise<string> => {
      const cacheId = hashKey(sentence, lang);
      if (clientAudioCache.has(cacheId)) {
        return clientAudioCache.get(cacheId)!;
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sentence.slice(0, 600),
          language: lang,
        }),
        signal,
      });

      if (!res.ok) {
        throw new Error(`TTS HTTP error ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      clientAudioCache.set(cacheId, objectUrl);
      return objectUrl;
    },
    []
  );

  /**
   * Main speak method: splits text, plays first sentence quickly, falls back cleanly.
   */
  const speak = useCallback(
    async (rawText: string, options: Partial<UseSpeechOptions> = {}) => {
      stop();

      const lang = options.language || defaultOptions.language || 'en';
      const rate = options.speechRate ?? defaultOptions.speechRate ?? 1.2;

      // Check language capability
      if (!isTtsSupported(lang)) {
        const msg = `Voice output is currently disabled for ${lang.toUpperCase()}.`;
        setError(msg);
        options.onError?.(msg);
        return;
      }

      const sentenceList = splitIntoSentences(rawText);
      if (sentenceList.length === 0) return;

      setSentences(sentenceList);
      setIsSpeaking(true);
      setIsPaused(false);
      isPlayingRef.current = true;
      setUsingBrowserVoice(false);
      options.onStart?.();

      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;

      let idx = 0;

      const playNextSentence = async () => {
        if (!isPlayingRef.current || idx >= sentenceList.length) {
          stop();
          options.onEnd?.();
          return;
        }

        const sentenceText = sentenceList[idx];
        setCurrentSentenceIndex(idx);
        options.onSentenceChange?.(idx, sentenceText);

        try {
          // Pre-fetch next sentence in parallel for instant playback
          if (idx + 1 < sentenceList.length) {
            fetchSentenceAudio(sentenceList[idx + 1], lang, abortCtrl.signal).catch(() => {});
          }

          const audioUrl = await fetchSentenceAudio(sentenceText, lang, abortCtrl.signal);
          if (!isPlayingRef.current) return;

          const audio = new Audio(audioUrl);
          activeAudioRef.current = audio;
          audio.playbackRate = rate;

          audio.onended = () => {
            idx++;
            playNextSentence();
          };

          audio.onerror = (e) => {
            console.warn('[useSpeech] Audio playback error, switching to browser synthesis:', e);
            speakWithBrowserSynthesis(sentenceList, idx, lang, rate, options);
          };

          await audio.play();
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          console.warn('[useSpeech] /api/tts unavailable, falling back to browser synthesis:', err);
          speakWithBrowserSynthesis(sentenceList, idx, lang, rate, options);
        }
      };

      await playNextSentence();
    },
    [defaultOptions.language, defaultOptions.speechRate, fetchSentenceAudio, speakWithBrowserSynthesis, stop]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    currentSentenceIndex,
    sentences,
    usingBrowserVoice,
    error,
    clearError,
  };
}
