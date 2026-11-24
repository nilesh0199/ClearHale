'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { isSttSupported } from '@/lib/ai/config';

export interface UseVoiceInputOptions {
  language?: string;
  maxDurationSeconds?: number;
  onTranscribed?: (text: string, language?: string) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseVoiceInputReturn {
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  heardText: string;
  setHeardText: (text: string) => void;
  detectedLanguage?: string;
  isTranscribing: boolean;
  error: string | null;
  clearError: () => void;
  isBrowserFallback: boolean;
  isSupported: boolean;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
}

interface SpeechWindow {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = 'en',
    maxDurationSeconds = 30,
    onTranscribed,
    onError,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [heardText, setHeardText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string | undefined>(undefined);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserFallback, setIsBrowserFallback] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMedia = Boolean(
        typeof navigator !== 'undefined' &&
          navigator.mediaDevices &&
          typeof navigator.mediaDevices.getUserMedia === 'function' &&
          typeof window.MediaRecorder !== 'undefined'
      );
      setIsSupported(hasMedia);
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Browser SpeechRecognition Fallback when Groq Whisper is unavailable / rate-limited
   */
  const startBrowserSpeechFallback = useCallback(() => {
    if (typeof window === 'undefined') return;

    const speechWin = window as unknown as SpeechWindow;
    const SpeechRec = speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (!SpeechRec) {
      const msg = 'Voice transcription is temporarily unavailable. You can type your message in the box.';
      setError(msg);
      onError?.(msg);
      return;
    }

    try {
      setIsBrowserFallback(true);
      const recognition = new SpeechRec();
      recognition.lang = language || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
        const resultText = event.results[0]?.[0]?.transcript || '';
        if (resultText) {
          setHeardText(resultText);
          onTranscribed?.(resultText, language);
        }
      };

      recognition.onerror = () => {
        const msg = 'Could not capture speech. Please use the text field below.';
        setError(msg);
        onError?.(msg);
      };

      recognition.start();
    } catch (e: unknown) {
      const msg = 'Speech recognition unavailable. Please use the text field.';
      setError(msg);
      onError?.(msg);
    }
  }, [language, onError, onTranscribed]);

  /**
   * Send recorded audio Blob to server route /api/stt
   */
  const transcribeAudioBlob = useCallback(
    async (blob: Blob) => {
      setIsTranscribing(true);
      setError(null);

      try {
        const formData = new FormData();
        const mimeType = blob.type || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        formData.append('file', blob, `speech.${ext}`);
        if (language) {
          formData.append('language', language);
        }

        const res = await fetch('/api/stt', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          console.warn('[useVoiceInput] Server STT returned error:', data);
          if (data.fallbackToBrowser) {
            startBrowserSpeechFallback();
          } else {
            const errMsg = data.error || 'Failed to transcribe audio';
            setError(errMsg);
            onError?.(errMsg);
          }
          return;
        }

        if (data.text) {
          setHeardText(data.text);
          setDetectedLanguage(data.language);
          onTranscribed?.(data.text, data.language);
        } else {
          setError('No clear speech detected. Please try speaking again.');
        }
      } catch (err: unknown) {
        console.warn('[useVoiceInput] Network error during STT:', err);
        startBrowserSpeechFallback();
      } finally {
        setIsTranscribing(false);
      }
    },
    [language, onError, onTranscribed, startBrowserSpeechFallback]
  );

  /**
   * Cancel and discard current recording
   */
  const cancelRecording = useCallback(() => {
    clearTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    stopMediaTracks();
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  }, [clearTimers, stopMediaTracks]);

  /**
   * Stop recording and initiate transcription
   */
  const stopRecording = useCallback(async () => {
    clearTimers();

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      setIsRecording(false);
      stopMediaTracks();
      return;
    }

    const recorder = mediaRecorderRef.current;

    await new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        stopMediaTracks();
        setIsRecording(false);
        setRecordingDuration(0);

        if (finalBlob.size > 0) {
          await transcribeAudioBlob(finalBlob);
        }
        resolve();
      };

      try {
        recorder.stop();
      } catch (e) {
        resolve();
      }
    });
  }, [clearTimers, stopMediaTracks, transcribeAudioBlob]);

  /**
   * Tap to start recording with MediaRecorder
   */
  const startRecording = useCallback(async () => {
    if (typeof window === 'undefined') return;

    clearError();
    setIsBrowserFallback(false);

    // Check language capability
    if (!isSttSupported(language)) {
      const msg = `Voice input is currently disabled for ${language.toUpperCase()}. Please type in the text box.`;
      setError(msg);
      onError?.(msg);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Determine supported recorder MIME
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(250); // Slice into 250ms chunks
      setIsRecording(true);
      setRecordingDuration(0);

      // Duration counter
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Auto-stop after maxDurationSeconds (30s)
      autoStopTimerRef.current = setTimeout(() => {
        stopRecording();
      }, maxDurationSeconds * 1000);
    } catch (err: unknown) {
      console.warn('[useVoiceInput] Microphone access error:', err);
      const isNotAllowed =
        err instanceof Error &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      const msg = isNotAllowed
        ? 'Microphone permission denied. Please allow microphone access or type your question.'
        : 'Could not access microphone. Falling back to text input.';
      setError(msg);
      onError?.(msg);
      startBrowserSpeechFallback();
    }
  }, [clearError, language, maxDurationSeconds, onError, startBrowserSpeechFallback, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      stopMediaTracks();
    };
  }, [clearTimers, stopMediaTracks]);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    heardText,
    setHeardText,
    detectedLanguage,
    isTranscribing,
    error,
    clearError,
    isBrowserFallback,
    isSupported,
  };
}
