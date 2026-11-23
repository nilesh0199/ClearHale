'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useApp } from './AppContext';
import { VOICE_LANGUAGE_LOCALES } from '@/lib/languages';
import { VoiceSettings } from '@/types';
import { hasEmergencySymptoms } from '@/lib/medicalSafety';

export interface PendingAutoSend {
  text: string;
  countdown: number; // remaining seconds (e.g. 1.5)
}

interface VoiceContextType {
  // Capabilities
  isSpeechRecognitionSupported: boolean;
  isSpeechSynthesisSupported: boolean;

  // Speech Recognition (Voice Input)
  isListening: boolean;
  listeningState: 'idle' | 'listening' | 'processing' | 'error';
  transcript: string;
  interimTranscript: string;
  recognitionError: string | null;
  recognitionErrorCode: string | null;
  startListening: (options?: {
    onFinal?: (text: string) => void;
    onInterim?: (text: string) => void;
  }) => void;
  stopListening: () => void;
  clearRecognitionError: () => void;
  pendingAutoSend: PendingAutoSend | null;
  cancelAutoSend: () => void;
  confirmAutoSendNow: () => void;

  // Speech Synthesis (Read Aloud)
  isSpeaking: boolean;
  isPaused: boolean;
  activeSpeakingId: string | null;
  currentSentenceIndex: number;
  currentSentences: string[];
  availableVoices: SpeechSynthesisVoice[];
  speakText: (
    id: string,
    rawText: string,
    options?: { onDone?: () => void }
  ) => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  stopSpeech: () => void;
  speechWarning: string | null;
  clearSpeechWarning: () => void;

  // Settings
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (partial: Partial<VoiceSettings>) => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

/**
 * Split long text into clean sentence units.
 * Handles English punctuation (. ? !) and Indian danda (।).
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  // Clean markdown bold, bullets, and links
  const cleaned = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#`~]/g, '')
    .trim();

  // Split on sentence terminators while preserving them
  const regex = /[^.?!।\n]+[.?!।\n]+|[^.?!।\n]+$/g;
  const matches = cleaned.match(regex);
  if (!matches) return [cleaned].filter(Boolean);
  return matches
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^[-•–—\s]+$/.test(s));
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile, activeTab } = useApp();

  // Settings with fallbacks
  const voiceSettings: VoiceSettings = profile.voice || {
    enabled: true,
    autoSend: true,
    autoReadReplies: false,
    speechRate: 1.2,
    readBothBilingual: false,
    preferredVoiceURI: undefined,
  };

  const updateVoiceSettings = useCallback(
    (partial: Partial<VoiceSettings>) => {
      const updated: VoiceSettings = {
        ...voiceSettings,
        ...partial,
      };
      updateProfile({ voice: updated });
    },
    [voiceSettings, updateProfile]
  );

  // -------------------------------------------------------------
  // Capabilities
  // -------------------------------------------------------------
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] =
    useState(false);
  const [isSpeechSynthesisSupported, setIsSpeechSynthesisSupported] =
    useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSR =
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      const hasSS = 'speechSynthesis' in window;
      setIsSpeechRecognitionSupported(hasSR);
      setIsSpeechSynthesisSupported(hasSS);
    }
  }, []);

  // -------------------------------------------------------------
  // Speech Recognition (Voice Input)
  // -------------------------------------------------------------
  const [isListening, setIsListening] = useState(false);
  const [listeningState, setListeningState] = useState<
    'idle' | 'listening' | 'processing' | 'error'
  >('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recognitionErrorCode, setRecognitionErrorCode] = useState<string | null>(null);
  const [pendingAutoSend, setPendingAutoSend] = useState<PendingAutoSend | null>(null);

  const recognitionRef = useRef<any>(null);
  const onFinalCallbackRef = useRef<((text: string) => void) | null>(null);
  const onInterimCallbackRef = useRef<((text: string) => void) | null>(null);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentConfidenceRef = useRef<number>(1.0);
  const isIntentionalStopRef = useRef(false);

  // Stop recognition and clear auto-send when switching tabs
  useEffect(() => {
    stopListening();
    cancelAutoSend();
    stopSpeech();
  }, [activeTab]);

  const clearRecognitionError = useCallback(() => {
    setRecognitionError(null);
    setRecognitionErrorCode(null);
    if (listeningState === 'error') {
      setListeningState('idle');
    }
  }, [listeningState]);

  const cancelAutoSend = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setPendingAutoSend(null);
  }, []);

  const confirmAutoSendNow = useCallback(() => {
    if (pendingAutoSend?.text && onFinalCallbackRef.current) {
      const textToSend = pendingAutoSend.text;
      cancelAutoSend();
      onFinalCallbackRef.current(textToSend);
    }
  }, [pendingAutoSend, cancelAutoSend]);

  const stopListening = useCallback(() => {
    isIntentionalStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    setIsListening(false);
    if (listeningState === 'listening') {
      setListeningState('processing');
    }
  }, [listeningState]);

  const startListening = useCallback(
    (options?: {
      onFinal?: (text: string) => void;
      onInterim?: (text: string) => void;
    }) => {
      if (!isSpeechRecognitionSupported || !voiceSettings.enabled) {
        return;
      }

      // 1. Immediately stop any read aloud
      stopSpeech();
      cancelAutoSend();

      onFinalCallbackRef.current = options?.onFinal || null;
      onInterimCallbackRef.current = options?.onInterim || null;
      isIntentionalStopRef.current = false;
      currentConfidenceRef.current = 1.0;
      setTranscript('');
      setInterimTranscript('');
      clearRecognitionError();

      const SpeechRec =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRec) {
        setRecognitionErrorCode('not-supported');
        setRecognitionError('Voice typing is not supported in this browser.');
        setListeningState('error');
        return;
      }

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }

        const recognition = new SpeechRec();
        recognitionRef.current = recognition;

        const targetLocale =
          VOICE_LANGUAGE_LOCALES[profile.language] || 'en-IN';
        recognition.lang = targetLocale;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        // continuous: true gives smoother dictation on desktop and Android
        recognition.continuous = true;

        recognition.onstart = () => {
          setIsListening(true);
          setListeningState('listening');
        };

        recognition.onresult = (event: any) => {
          let finalAccumulated = '';
          let interimAccumulated = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              finalAccumulated += item[0].transcript;
              if (typeof item[0].confidence === 'number' && item[0].confidence > 0) {
                currentConfidenceRef.current = item[0].confidence;
              }
            } else {
              interimAccumulated += item[0].transcript;
            }
          }

          if (finalAccumulated) {
            setTranscript((prev) => {
              const next = prev ? `${prev} ${finalAccumulated.trim()}` : finalAccumulated.trim();
              if (onInterimCallbackRef.current) {
                onInterimCallbackRef.current(next);
              }
              return next;
            });
          }

          setInterimTranscript(interimAccumulated);
          if (interimAccumulated && onInterimCallbackRef.current) {
            onInterimCallbackRef.current(interimAccumulated);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          const err = event.error;

          if (err === 'no-speech') {
            setRecognitionErrorCode('no-speech');
            setRecognitionError('No speech was heard. Please speak again.');
            setListeningState('error');
          } else if (err === 'not-allowed' || err === 'service-not-allowed') {
            setRecognitionErrorCode('not-allowed');
            setRecognitionError(
              'Microphone permission denied. Tap the lock icon in your address bar and set Microphone to Allow.'
            );
            setListeningState('error');
          } else if (err === 'network') {
            setRecognitionErrorCode('network');
            setRecognitionError('Voice network error. Please check your internet connection.');
            setListeningState('error');
          } else if (err === 'language-not-supported') {
            // Regional locale failed: automatically fallback to en-IN
            console.warn(`Locale ${targetLocale} unsupported, falling back to en-IN`);
            recognition.lang = 'en-IN';
            setRecognitionErrorCode('fallback-en');
            setRecognitionError(
              'Switched voice recognition to English (India) as regional voice input is not supported in this browser.'
            );
            try {
              recognition.start();
            } catch (e) {}
          } else if (err !== 'aborted') {
            setRecognitionErrorCode(err || 'unknown');
            setRecognitionError(`Recognition issue (${err}). Tap mic to retry.`);
            setListeningState('error');
          }

          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');

          // If was listening and stopped without error, transition to processing/done
          setListeningState((current) => {
            if (current === 'error') return current;
            return 'idle';
          });

          // Read the latest transcript
          setTranscript((finalText) => {
            const cleanText = finalText.trim();
            if (!cleanText) return '';

            // Check confidence and length
            const wordsCount = cleanText.split(/\s+/).length;
            const isLowConfidence = currentConfidenceRef.current < 0.6;
            const isVeryShort = cleanText.length < 8 || wordsCount < 2;

            if (!voiceSettings.autoSend || isLowConfidence || isVeryShort) {
              // Leave transcript in textarea for user to review/edit
              if (onInterimCallbackRef.current) {
                onInterimCallbackRef.current(cleanText);
              }
              return cleanText;
            }

            // Auto-send flow: 1.5s countdown with cancel option
            setPendingAutoSend({ text: cleanText, countdown: 1.5 });
            let remaining = 1.5;

            if (autoSendTimerRef.current) clearInterval(autoSendTimerRef.current);

            autoSendTimerRef.current = setInterval(() => {
              remaining -= 0.1;
              if (remaining <= 0.05) {
                clearInterval(autoSendTimerRef.current!);
                autoSendTimerRef.current = null;
                setPendingAutoSend(null);
                if (onFinalCallbackRef.current) {
                  onFinalCallbackRef.current(cleanText);
                }
              } else {
                setPendingAutoSend({
                  text: cleanText,
                  countdown: Math.max(0, parseFloat(remaining.toFixed(1))),
                });
              }
            }, 100);

            return cleanText;
          });
        };

        recognition.start();
      } catch (err: any) {
        console.error('Failed to start SpeechRecognition:', err);
        setRecognitionErrorCode('failed-start');
        setRecognitionError('Could not start microphone. Tap to retry.');
        setListeningState('error');
        setIsListening(false);
      }
    },
    [
      isSpeechRecognitionSupported,
      voiceSettings.enabled,
      voiceSettings.autoSend,
      profile.language,
      clearRecognitionError,
      cancelAutoSend,
    ]
  );

  // -------------------------------------------------------------
  // Speech Synthesis (Read Aloud)
  // -------------------------------------------------------------
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [currentSentences, setCurrentSentences] = useState<string[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);

  const sentencesQueueRef = useRef<string[]>([]);
  const currentSentenceIdxRef = useRef(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const onDoneCallbackRef = useRef<(() => void) | null>(null);

  // Load voices asynchronously
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const v = synth.getVoices() || [];
      if (v.length > 0) {
        setAvailableVoices(v);
      }
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  const clearSpeechWarning = useCallback(() => {
    setSpeechWarning(null);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    setIsSpeaking(false);
    setIsPaused(false);
    setActiveSpeakingId(null);
    setCurrentSentenceIndex(-1);
    setCurrentSentences([]);
    sentencesQueueRef.current = [];
    currentSentenceIdxRef.current = -1;
    activeIdRef.current = null;
    utteranceRef.current = null;
  }, []);

  const pauseSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch (e) {}
  }, []);

  const resumeSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch (e) {}
  }, []);

  /**
   * Speak next sentence in queue sequentially.
   * Avoids the 15-second cutoff bug in Chrome & mobile browsers.
   */
  const speakNextSentence = useCallback(
    (voice: SpeechSynthesisVoice | null, targetLocale: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const idx = currentSentenceIdxRef.current + 1;
      const sentences = sentencesQueueRef.current;

      if (idx >= sentences.length) {
        // All sentences finished
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveSpeakingId(null);
        setCurrentSentenceIndex(-1);
        activeIdRef.current = null;
        if (onDoneCallbackRef.current) {
          onDoneCallbackRef.current();
          onDoneCallbackRef.current = null;
        }
        return;
      }

      currentSentenceIdxRef.current = idx;
      setCurrentSentenceIndex(idx);

      const sentenceText = sentences[idx];
      const utter = new SpeechSynthesisUtterance(sentenceText);
      utteranceRef.current = utter;

      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = targetLocale;
      }

      // Crisp, natural AI speaking pace: defaults to 1.2x (or user-customized rate)
      const currentRate = voiceSettings.speechRate;
      const rate = currentRate && currentRate >= 1.0
        ? (currentRate === 1.0 ? 1.2 : currentRate)
        : 1.2;
      utter.rate = rate;
      utter.pitch = 1.0;

      utter.onend = () => {
        // Advance to next sentence
        speakNextSentence(voice, targetLocale);
      };

      utter.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
          // Intentional stop
          return;
        }
        console.warn('SpeechSynthesisUtterance error:', e);
        // Continue to next sentence anyway
        speakNextSentence(voice, targetLocale);
      };

      try {
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn('Error calling speechSynthesis.speak:', err);
      }
    },
    [voiceSettings.speechRate]
  );

  const speakText = useCallback(
    (id: string, rawText: string, options?: { onDone?: () => void }) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      // If already speaking this ID, toggle pause/play
      if (activeSpeakingId === id) {
        if (isPaused) {
          resumeSpeech();
        } else {
          pauseSpeech();
        }
        return;
      }

      // Stop any previous speech
      stopSpeech();
      clearSpeechWarning();

      onDoneCallbackRef.current = options?.onDone || null;
      activeIdRef.current = id;
      setActiveSpeakingId(id);
      setIsSpeaking(true);
      setIsPaused(false);

      // Determine text to read based on bilingual settings
      let textToSpeak = rawText;
      let isFallbackToEn = false;

      if (rawText.includes('---EN---')) {
        const parts = rawText.split('---EN---');
        const nativePart = parts[0]?.trim() || '';
        const enPart = parts[1]?.trim() || '';

        if (profile.language === 'en') {
          textToSpeak = enPart || nativePart;
        } else if (voiceSettings.readBothBilingual) {
          textToSpeak = `${nativePart}. ${enPart}`;
        } else {
          textToSpeak = nativePart;
        }
      }

      // Find best voice
      const targetLocale =
        VOICE_LANGUAGE_LOCALES[profile.language] || 'en-IN';
      const langPrefix = targetLocale.split('-')[0].toLowerCase();
      const allVoices = window.speechSynthesis.getVoices() || availableVoices;

      let selectedVoice: SpeechSynthesisVoice | null = null;

      // 1. Check preferred voice
      if (voiceSettings.preferredVoiceURI) {
        selectedVoice =
          allVoices.find((v) => v.voiceURI === voiceSettings.preferredVoiceURI) || null;
      }

      // 2. Exact match (e.g. hi-IN, mr-IN, ta-IN, bn-IN)
      if (!selectedVoice) {
        selectedVoice =
          allVoices.find(
            (v) =>
              v.lang.toLowerCase() === targetLocale.toLowerCase() ||
              v.lang.replace('_', '-').toLowerCase() === targetLocale.toLowerCase()
          ) || null;
      }

      // 3. Prefix match (e.g. hi, mr, bn, ta, te, kn, gu)
      if (!selectedVoice) {
        selectedVoice =
          allVoices.find((v) => {
            const l = v.lang.toLowerCase().replace('_', '-');
            return l.startsWith(langPrefix);
          }) || null;
      }

      // 4. Keyword / Name match for Indian languages (e.g. "Hindi", "Marathi", "Tamil", "Bengali", "Swara", "Madhur", "Aarohi", "Pallavi", etc.)
      if (!selectedVoice && profile.language !== 'en') {
        const regionalKeywords: Record<string, string[]> = {
          hi: ['hindi', 'हिन्दी', 'swara', 'madhur', 'lekha', 'neerja', 'kalpana', 'hemant'],
          mr: ['marathi', 'मराठी', 'aarohi', 'manohar'],
          ta: ['tamil', 'தமிழ்', 'pallavi', 'valluvar'],
          bn: ['bengali', 'bangla', 'বাংলা', 'tanishaa', 'bashkar'],
          te: ['telugu', 'తెలుగు', 'mohan', 'chitra'],
          kn: ['kannada', 'ಕನ್ನಡ', 'gagan', 'sapna'],
          ml: ['malayalam', 'മലയാളம்', 'midhun', 'sobhana'],
          gu: ['gujarati', 'ગુજરાતી', 'dhwani', 'niranjan'],
          pa: ['punjabi', 'ਪੰਜਾਬੀ', 'raavi', 'harjit'],
          or: ['odia', 'oriya', 'ଓଡ଼ିଆ'],
        };
        const keywords = regionalKeywords[profile.language] || [];
        if (keywords.length > 0) {
          selectedVoice =
            allVoices.find((v) => {
              const nameLower = (v.name + ' ' + v.voiceURI).toLowerCase();
              return keywords.some((kw) => nameLower.includes(kw));
            }) || null;
        }
      }

      // Split into sentences
      const sentences = splitIntoSentences(textToSpeak);
      if (sentences.length === 0) {
        stopSpeech();
        return;
      }

      sentencesQueueRef.current = sentences;
      setCurrentSentences(sentences);
      currentSentenceIdxRef.current = -1;

      // Chrome speech resume bug workaround
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Start sequential sentence loop with regional targetLocale
      speakNextSentence(selectedVoice, targetLocale);
    },
    [
      activeSpeakingId,
      isPaused,
      availableVoices,
      profile.language,
      voiceSettings.preferredVoiceURI,
      voiceSettings.readBothBilingual,
      resumeSpeech,
      pauseSpeech,
      stopSpeech,
      clearSpeechWarning,
      speakNextSentence,
    ]
  );

  return (
    <VoiceContext.Provider
      value={{
        isSpeechRecognitionSupported,
        isSpeechSynthesisSupported,
        isListening,
        listeningState,
        transcript,
        interimTranscript,
        recognitionError,
        recognitionErrorCode,
        startListening,
        stopListening,
        clearRecognitionError,
        pendingAutoSend,
        cancelAutoSend,
        confirmAutoSendNow,
        isSpeaking,
        isPaused,
        activeSpeakingId,
        currentSentenceIndex,
        currentSentences,
        availableVoices,
        speakText,
        pauseSpeech,
        resumeSpeech,
        stopSpeech,
        speechWarning,
        clearSpeechWarning,
        voiceSettings,
        updateVoiceSettings,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

export { useVoiceInput } from '@/hooks/useVoiceInput';
export { useSpeech } from '@/hooks/useSpeech';
export { isSttSupported, isTtsSupported, getLanguageCapability } from '@/lib/ai/config';
