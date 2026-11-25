'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useVoice, splitIntoSentences } from '@/context/VoiceContext';
import { SpeakerButton } from '../voice/SpeakerButton';
import { WaveformBars } from '../voice/WaveformBars';
import { Bi } from '../Bi';
import { Term } from '../Term';
import { ShinyText } from '../ui/rb/ShinyText';
import { ChatMessage } from '@/types';
import { hasEmergencySymptoms } from '@/lib/medicalSafety';
import { detectProfileChangeInMessage, ProfileUpdateProposal } from '@/lib/ai/intakeParser';
import {
  Send,
  Mic,
  X,
  Clock,
  PhoneCall,
  AlertOctagon,
  ShieldAlert,
  Bot,
  User,
  Loader2,
  HelpCircle,
  AlertCircle,
  Trash2,
  Check,
} from 'lucide-react';

const CHAT_STORAGE_KEY = 'clearhale_chat_history';

function getInitialGreeting(lang: string, cityName: string, pm25: number): ChatMessage {
  if (lang === 'en') {
    return {
      id: 'welcome_ai',
      role: 'assistant',
      content: `Hello! I am Clearhale AI. Current PM2.5 in ${cityName} is ${pm25} µg/m³. Ask me anything about home air protection, purifiers, masks, or child routines.`,
      timestamp: Date.now(),
    };
  }
  const hiText = `नमस्ते! मैं Clearhale AI हूँ। आज ${cityName} में PM2.5 का स्तर ${pm25} µg/m³ है। आप घर की हवा, बच्चों की सुरक्षा, मास्क या प्यूरीफायर पर कोई भी सवाल पूछ सकते हैं।`;
  const mrText = `नमस्कार! मी Clearhale AI आहे. आज ${cityName} मध्ये PM2.5 ची पातळी ${pm25} µg/m³ आहे. घरातील हवा, मुलांची सुरक्षा, मास्क किंवा प्युरिफायरबाबत काहीही विचारा.`;
  const taText = `வணக்கம்! நான் Clearhale AI. இன்று ${cityName} நகரில் PM2.5 அளவு ${pm25} µg/m³ ஆக உள்ளது. காற்று பாதுகாப்பு, பியூரிஃபையர், முகக்கவசம் பற்றி எதுவும் கேளுங்கள்.`;
  const bnText = `নমস্কার! আমি Clearhale AI। আজ ${cityName}-এ PM2.5 এর মাত্রা ${pm25} µg/m³। ঘরের বায়ু সুরক্ষা, পিউরিফায়ার বা মাস্ক নিয়ে যেকোনো প্রশ্ন করতে পারেন।`;

  let nativeText = hiText;
  if (lang === 'mr') nativeText = mrText;
  else if (lang === 'ta') nativeText = taText;
  else if (lang === 'bn') nativeText = bnText;

  const enText = `Hello! I am Clearhale AI. Current PM2.5 in ${cityName} is ${pm25} µg/m³. Ask me anything about home air protection, purifiers, masks, or child routines.`;

  return {
    id: 'welcome_ai',
    role: 'assistant',
    content: `${nativeText}\n---EN---\n${enText}`,
    timestamp: Date.now(),
  };
}

const TERM_MAP: Record<string, string> = {
  'pm2.5': 'pm25',
  'pm 2.5': 'pm25',
  'pm10': 'pm10',
  'pm 10': 'pm10',
  'aqi': 'aqi',
  'air quality index': 'aqi',
  'एक्यूआई': 'aqi',
  'hepa': 'hepa',
  'hepa filter': 'hepa',
  'हेपा': 'hepa',
  'n95': 'n95',
  'n95 mask': 'n95',
  'एन95': 'n95',
  'एन९५': 'n95',
  'merv-13': 'merv13',
  'merv 13': 'merv13',
  'merv13': 'merv13',
  'cpcb': 'cpcb',
  'no2': 'no2',
  'no₂': 'no2',
  'ozone': 'ozone',
  'ओझोन': 'ozone',
  'ओजोन': 'ozone',
  'smog': 'smog',
  'स्मॉग': 'smog',
  'धुरके': 'smog',
  'grap': 'grap',
  'temperature inversion': 'temperature_inversion',
  'तापमान उलटाव': 'temperature_inversion',
  'तापमान विपर्यय': 'temperature_inversion',
  'stubble burning': 'stubble_burning',
  'parali': 'stubble_burning',
  'पराली': 'stubble_burning',
  'पेंढा जाळणे': 'stubble_burning',
  'corsi-rosenthal': 'diy_box_fan',
  'diy box-fan': 'diy_box_fan',
  'देसी बॉक्स फैन': 'diy_box_fan',
  'µg/m³': 'ug_m3',
  'ug/m3': 'ug_m3',
};

const TERM_REGEX = /(PM2\.5|PM 2\.5|PM10|PM 10|AQI|HEPA filter|HEPA|N95 mask|N95|MERV-13|MERV 13|CPCB|NO2|NO₂|Ozone|Smog|GRAP|Corsi-Rosenthal|DIY box-fan|Temperature inversion|Stubble burning|Parali|µg\/m³|ug\/m3|एक्यूआई|हेपा|एन95|एन९५|स्मॉग|धुरके|पराली)/gi;

// Token regex matching bold (2 or 3 asterisks on both sides, or 2 underscores), code, and italic
const MARKDOWN_TOKEN_REGEX = /(\*{2,3}[^*]+?\*{2,3}|__[^_]+?__|`[^`]+?`|(?<!\*)\*[^*]+?\*(?!\*)|(?<!_)_[^_]+?_(?!_))/g;

function renderTextWithGlossaryTerms(text: string) {
  if (!text) return null;
  const parts = text.split(TERM_REGEX);
  return parts.map((part, index) => {
    if (!part) return null;
    const mapped = TERM_MAP[part.toLowerCase()];
    if (mapped) {
      return (
        <Term key={index} k={mapped}>
          {part}
        </Term>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Parses markdown inline formatting (bold, italic, code, bullets) and renders
 * glossary terms seamlessly inside and outside formatted blocks without exposing literal asterisks.
 */
function renderFormattedMarkdownWithGlossary(rawText: string) {
  if (!rawText) return null;
  // Normalize markdown list bullets (* or - at line start) to standard bullet symbol (•)
  const normalized = rawText.replace(/^(\s*)[*-]\s+/gm, '$1• ');
  const parts = normalized.split(MARKDOWN_TOKEN_REGEX);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold (e.g. **text**, ***text***, ***text**, **text***, __text__)
    if (/^(\*{2,3}[^*]+?\*{2,3}|__[^_]+?__)$/.test(part)) {
      const inner = part.replace(/^(\*{2,3}|__)/, '').replace(/(\*{2,3}|__)$/, '');
      return (
        <strong key={index} className="font-semibold text-foreground">
          {renderTextWithGlossaryTerms(inner)}
        </strong>
      );
    }

    // Inline code (`code`)
    if (/^`[^`]+?`$/.test(part)) {
      const inner = part.slice(1, -1);
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-muted/15 font-mono text-xs text-foreground">
          {inner}
        </code>
      );
    }

    // Italic (*text*, _text_)
    if (/^(\*[^*]+?\*|_[^_]+?_)$/.test(part)) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-foreground/90">
          {renderTextWithGlossaryTerms(inner)}
        </em>
      );
    }

    // Standard plain text segment
    return <React.Fragment key={index}>{renderTextWithGlossaryTerms(part)}</React.Fragment>;
  });
}

/**
 * Renders text while preserving all bullet points, bold markdown, and line breaks,
 * highlighting the active sentence currently being read aloud without collapsing into a plain paragraph.
 */
function renderSentenceHighlightedText(
  text: string,
  isCurrentSpeakingMessage: boolean,
  currentSentenceIdx: number,
  currentSentencesList: string[],
  sentenceOffset: number = 0
) {
  if (!text) return null;
  if (!isCurrentSpeakingMessage || currentSentencesList.length === 0 || currentSentenceIdx < 0) {
    return renderFormattedMarkdownWithGlossary(text);
  }

  // Normalize markdown list bullets (* or - at line start) to standard bullet symbol (•)
  const normalized = text.replace(/^(\s*)[*-]\s+/gm, '$1• ');

  // Split into sentence tokens while capturing delimiters (spaces, newlines)
  const tokens = normalized.split(/((?<=[.?!।])\s+|\n+)/);

  let sentenceCounter = 0;

  return (
    <>
      {tokens.map((tok, tIdx) => {
        if (!tok) return null;

        // If this token is purely whitespace or newlines, render it as-is to preserve spacing & line breaks
        if (/^(\s+|\n+)$/.test(tok)) {
          return <React.Fragment key={tIdx}>{tok}</React.Fragment>;
        }

        const sIdx = sentenceCounter++;
        const isHighlight = sIdx + sentenceOffset === currentSentenceIdx;

        return (
          <span
            key={tIdx}
            className={`transition-all duration-200 inline ${
              isHighlight
                ? 'bg-teal-500/15 dark:bg-teal-400/25 text-teal-950 dark:text-teal-50 rounded px-1 -mx-0.5 py-0.5 font-medium shadow-xs'
                : ''
            }`}
          >
            {renderFormattedMarkdownWithGlossary(tok)}
          </span>
        );
      })}
    </>
  );
}

export function AskScreen() {
  const { profile, updateProfile, airData, t, clearChatHistory } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const {
    isSpeechRecognitionSupported,
    listeningState,
    startListening,
    stopListening,
    pendingAutoSend,
    cancelAutoSend,
    confirmAutoSendNow,
    recognitionError,
    clearRecognitionError,
    activeSpeakingId,
    currentSentenceIndex,
    currentSentences,
    speakText,
    voiceSettings,
  } = useVoice();

  // Load chat history from browser localStorage; fallback to fresh welcome greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to parse stored chat history:', err);
      }
    }
    return [getInitialGreeting(profile.language, profile.city.name, airData.current.pm2_5)];
  });

  // Persist chat history to browser localStorage whenever messages are updated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const valid = messages.filter(
        (m) => m.content && m.content.trim().length > 0 && !m.isStreaming
      );
      if (valid.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(valid));
      }
    } catch (err) {
      console.warn('Failed to persist chat history:', err);
    }
  }, [messages]);

  // Synchronize when chat is cleared from Settings or Reset All Data
  useEffect(() => {
    const handleClearChat = () => {
      setMessages([getInitialGreeting(profile.language, profile.city.name, airData.current.pm2_5)]);
    };
    window.addEventListener('clearhale:clear_chat', handleClearChat);
    return () => window.removeEventListener('clearhale:clear_chat', handleClearChat);
  }, [profile.language, profile.city.name, airData.current.pm2_5]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<ProfileUpdateProposal | null>(null);
  const [updateToast, setUpdateToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseInputRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Handle mobile virtual keyboard appearance: keep input and active message visible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      if (document.activeElement === textareaRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Auto-resize textarea upwards as user types or when viewport wraps
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const maxH = window.innerWidth < 640 ? 160 : 220;
      const nextHeight = Math.min(Math.max(textarea.scrollHeight, 48), maxH);
      textarea.style.height = `${nextHeight}px`;
    };
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [input]);

  const handleSendMessage = async (textToSend?: string) => {
    cancelAutoSend();
    stopListening();

    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setInput('');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Check if query implies a profile update
    const proposal = detectProfileChangeInMessage(query, profile.household);
    if (proposal) {
      setPendingProposal(proposal);
    }

    // 2. Client-side Instant Red-Flag Emergency Triage
    if (hasEmergencySymptoms(query)) {
      const enEmergency =
        'Immediate Medical Alert: Severe shortness of breath, chest tightness, blue lips, or confusion require urgent clinical attention. Please seek emergency medical care immediately.';
      const nativeEmergency =
        profile.language === 'mr'
          ? 'तातडीचा वैद्यकीय इशारा: श्वास घेण्यास तीव्र अडचण, छातीत दुखणे, किंवा ओठ निळे पडणे हे वैद्यकीय आणीबाणी असू शकते. कृपया त्वरित वैद्यकीय मदत घ्या.'
          : 'गंभीर चेतावनी: सांस में अत्यधिक तकलीफ, छाती में दर्द, या नीले होंठ जैसे लक्षण चिकित्सीय आपातकाल हो सकते हैं। कृपया तुरंत आपातकालीन चिकित्सा सहायता लें।';

      const emergencyMsg: ChatMessage = {
        id: `emergency_${Date.now()}`,
        role: 'emergency',
        content:
          profile.language === 'en'
            ? enEmergency
            : `${nativeEmergency}\n\n(${enEmergency})`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, emergencyMsg]);
      return;
    }

    // 3. Normal streaming AI response
    setIsStreaming(true);
    const assistantMsgId = `assistant_${Date.now()}`;
    const sessionHadTip =
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('clearhale_had_fallback_tip') === 'true' ||
        sessionStorage.getItem('vayu_had_fallback_tip') === 'true');

    // Add empty assistant placeholder
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      },
    ]);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),

          language: profile.language,
          city: profile.city.name,
          pm2_5: airData.current.pm2_5,
          household: profile.household,
          sessionHadTip,
          dataType: airData.dataType || (airData.current.isForecast ? 'estimate' : 'measured'),
          stationName: airData.station?.name || '',
          timestamp: airData.station?.measuredAtLocal || airData.current.time,
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      // Check if server flagged emergency
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.emergency) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    role: 'emergency',
                    content:
                      'Immediate Medical Alert: Red-flag respiratory symptoms detected. Please call emergency medical services immediately.',
                    isStreaming: false,
                  }
                : m
            )
          );
          setIsStreaming(false);
          return;
        }
      }

      // Stream text response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulated, isStreaming: true }
                : m
            )
          );
        }
      } else {
        const fullText = await res.text();
        accumulated = fullText;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: accumulated, isStreaming: false }
            : m
        )
      );

      if (typeof window !== 'undefined' && accumulated.includes('(')) {
        sessionStorage.setItem('clearhale_had_fallback_tip', 'true');
      }

      // Auto-read reply aloud if setting is enabled
      if (voiceSettings.autoReadReplies && accumulated) {
        speakText(assistantMsgId, accumulated);
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  'Keep doors and windows closed, run indoor filtration (HEPA or DIY MERV-13), and wear an N95 respirator if stepping outdoors.',
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleMicClick = () => {
    if (listeningState === 'listening') {
      stopListening();
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = input.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    } else {
      cancelAutoSend();
      clearRecognitionError();

      // Capture whatever user has already typed so it is never lost
      baseInputRef.current = input;

      const appendToPrefix = (spokenText: string) => {
        const prefix = baseInputRef.current;
        if (!prefix) return spokenText;
        const separator = prefix.endsWith(' ') || prefix.endsWith('\n') ? '' : ' ';
        return `${prefix}${separator}${spokenText}`;
      };

      startListening({
        onFinal: (finalText) => {
          const combined = appendToPrefix(finalText);
          setInput(combined);
          if (textareaRef.current) {
            textareaRef.current.focus();
            const len = combined.length;
            textareaRef.current.setSelectionRange(len, len);
          }
        },
        onInterim: (interimText) => {
          const combined = appendToPrefix(interimText);
          setInput(combined);
        },
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full">
      {/* Header */}
      <div className="pb-3 border-b border-card-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            <Bi k="ask.title" layout="inline" />
          </h1>
          <p className="text-sm sm:text-base text-muted mt-1">
            <Bi k="ask.subtitle" layout="plain" />
          </p>
        </div>
        {messages.length > 1 && (
          <button
            type="button"
            onClick={clearChatHistory}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-card-border hover:border-rose-400 hover:text-rose-600 bg-card hover:bg-card-subtle text-muted transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 1 && input.trim().length === 0 && (
        <div className="py-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          {t.ask.chips.map((chip, idx) => (
            <motion.button
              key={idx}
              disabled={isStreaming}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSendMessage(chip)}
              className="shrink-0 text-xs sm:text-sm px-3.5 py-1.5 rounded-full bg-card border border-card-border text-foreground hover:border-teal-accent/40 shadow-soft transition-colors cursor-pointer"
            >
              {chip}
            </motion.button>
          ))}
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 min-h-0">
        {messages.map((msg) => {
          if (msg.role === 'emergency') {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-card bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-950 dark:text-rose-100 shadow-soft space-y-3"
              >
                <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-semibold text-base">
                  <AlertOctagon className="w-5 h-5" strokeWidth={1.75} />
                  <Bi k="ask.emergencyWarning" layout="inline" />
                </div>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {renderFormattedMarkdownWithGlossary(msg.content)}
                </p>
                <div className="pt-2">
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-card bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 transition-colors shadow-soft"
                  >
                    <PhoneCall className="w-4 h-4" strokeWidth={1.75} />
                    <Bi k="ask.call112" layout="inline" />
                  </a>
                </div>
              </motion.div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200'
                    : 'bg-teal-light text-teal-accent'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Bot className="w-4 h-4" strokeWidth={1.75} />}
              </div>

              {/* Bubble & Read Aloud Controls */}
              <div className="flex flex-col items-start gap-1 max-w-[85%] sm:max-w-[75%]">
                <div
                  className={`p-3.5 sm:p-4 rounded-card text-sm sm:text-base leading-relaxed whitespace-pre-wrap w-full ${
                    isUser
                      ? 'bg-teal-accent text-white rounded-tr-none'
                      : 'bg-card border border-card-border text-foreground rounded-tl-none shadow-soft'
                  }`}
                >
                  {!msg.content ? (
                    <span className="flex items-center gap-2 text-muted text-xs py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-accent" />
                      <ShinyText speed={2.4}>
                        <Bi k="ask.consulting" en="Consulting science catalog..." layout="plain" />
                      </ShinyText>
                    </span>
                  ) : isUser ? (
                    msg.content
                  ) : (
                    (() => {
                      const isCurrentSpeakingMsg = activeSpeakingId === msg.id;
                      const parts = msg.content.split('---EN---');
                      const nativeText = parts[0]?.trim();
                      const enText = parts[1]?.trim();

                      if (enText && profile.language !== 'en') {
                        const nativeSentences = splitIntoSentences(nativeText);
                        const nativeCount = nativeSentences.length;

                        return (
                          <div className="space-y-2.5">
                            <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                              {renderSentenceHighlightedText(
                                nativeText,
                                isCurrentSpeakingMsg,
                                currentSentenceIndex,
                                currentSentences,
                                0
                              )}
                            </div>
                            <div className="border-t border-card-border/80 pt-2 text-xs sm:text-sm text-muted leading-relaxed font-normal whitespace-pre-wrap">
                              {renderSentenceHighlightedText(
                                enText,
                                isCurrentSpeakingMsg,
                                currentSentenceIndex,
                                currentSentences,
                                voiceSettings.readBothBilingual ? nativeCount : 0
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="whitespace-pre-wrap">
                          {renderSentenceHighlightedText(
                            nativeText || msg.content,
                            isCurrentSpeakingMsg,
                            currentSentenceIndex,
                            currentSentences
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Read Aloud Button on Assistant Message */}
                {!isUser && msg.content && (
                  <div className="pt-0.5 px-1">
                    <SpeakerButton id={msg.id} text={msg.content} size="sm" showLabel={false} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input, Voice Controls & Medical Disclaimer */}
      <div className="pt-2 shrink-0 space-y-2">
        {/* 1. Pending Auto-Send Countdown Banner */}
        <AnimatePresence>
          {pendingAutoSend && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="p-2 sm:p-2.5 rounded-xl bg-teal-light border border-teal-accent/30 flex items-center justify-between text-xs shadow-xs"
            >
              <div className="flex items-center gap-2 text-teal-900 dark:text-teal-100 font-medium">
                <Clock className="w-3.5 h-3.5 text-teal-accent animate-spin" strokeWidth={1.75} />
                <span>
                  <Bi
                    k="voice.sendingIn"
                    en={`Sending in ${pendingAutoSend.countdown.toFixed(1)}s, tap to edit`}
                    layout="plain"
                  />
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={cancelAutoSend}
                  className="px-2.5 py-1 rounded-lg bg-card text-foreground border border-card-border hover:bg-card-subtle text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Bi k="voice.cancelSend" en="Cancel" layout="inline" />
                </button>
                <button
                  type="button"
                  onClick={confirmAutoSendNow}
                  className="px-2.5 py-1 rounded-lg bg-teal-accent text-white hover:bg-teal-hover text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Bi k="voice.sendNow" en="Send now" layout="inline" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Recognition Error Alert Banner */}
        <AnimatePresence>
          {recognitionError && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                <span className="leading-tight">{recognitionError}</span>
              </div>
              <button
                type="button"
                onClick={clearRecognitionError}
                className="p-1 text-muted hover:text-foreground rounded-full shrink-0 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Active Voice Listening Waveform Status */}
        {listeningState === 'listening' && (
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 flex items-center justify-between text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-medium">
                <Bi k="voice.listening" en="Listening... Speak now" layout="plain" />
              </span>
            </div>
            <WaveformBars barCount={4} colorClass="bg-rose-500" size="sm" />
          </div>
        )}

        {/* 3. Centered Mic Button directly above the text box (Mobile: 48px icon matching send button; Desktop: Pill with text) */}
        {isSpeechRecognitionSupported && voiceSettings.enabled && (
          <div className="flex justify-center items-center w-full">
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isStreaming}
              className={`relative w-12 h-12 min-w-[48px] min-h-[48px] sm:w-auto sm:min-w-0 sm:min-h-[42px] p-0 sm:px-4 sm:py-1.5 rounded-full flex items-center justify-center transition-all select-none cursor-pointer shadow-soft ${
                listeningState === 'listening'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-400/35 animate-mic-pulse'
                  : listeningState === 'processing'
                  ? 'bg-teal-light text-teal-accent border border-teal-accent/30'
                  : 'bg-card hover:bg-card-subtle text-teal-accent hover:text-teal-hover border border-card-border hover:border-teal-accent/50 text-xs font-semibold'
              }`}
              title={listeningState === 'listening' ? 'Stop listening' : 'Tap to speak'}
              aria-label={listeningState === 'listening' ? 'Stop listening' : 'Start voice typing'}
            >
              {listeningState === 'listening' ? (
                <>
                  {/* Mobile: 48px pulse icon */}
                  <div className="flex sm:hidden items-center justify-center">
                    <Mic className="w-5 h-5 text-white animate-pulse" strokeWidth={1.75} />
                  </div>
                  {/* Desktop: Rich expanded status */}
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                    <span className="text-white text-xs font-medium">Listening... Tap to stop</span>
                    <WaveformBars barCount={3} colorClass="bg-white" size="sm" />
                  </div>
                </>
              ) : listeningState === 'processing' ? (
                <>
                  <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin text-teal-accent" strokeWidth={1.75} />
                  <span className="hidden sm:inline text-xs font-medium ml-1.5">Processing speech...</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 sm:w-4 sm:h-4 text-teal-accent shrink-0" strokeWidth={1.75} />
                  <span className="hidden sm:inline text-xs sm:text-sm text-foreground font-medium ml-1.5">
                    {profile.language === 'en'
                      ? 'Tap mic to speak'
                      : profile.language === 'hi'
                      ? 'बोलने के लिए माइक दबाएं'
                      : 'बोलण्यासाठी माइक दाबा'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Profile Update Proposal Chip (Never changes silently) */}
        {pendingProposal && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 p-3 rounded-xl bg-teal-light/40 border border-teal-accent/30 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-accent" />
              <span className="font-semibold text-foreground">{pendingProposal.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  updateProfile({
                    household: { ...profile.household, ...pendingProposal.patch },
                  });
                  setUpdateToast(`Updated: ${pendingProposal.label}`);
                  setPendingProposal(null);
                  setTimeout(() => setUpdateToast(null), 3000);
                }}
                className="px-2.5 py-1 rounded-lg bg-teal-accent text-white font-medium hover:bg-teal-hover transition-colors text-xs cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setPendingProposal(null)}
                className="p-1 rounded text-muted hover:text-foreground cursor-pointer"
                aria-label="Dismiss proposal"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Update Toast */}
        {updateToast && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-teal-light text-teal-accent text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{updateToast}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 10);
          }}
          className="flex items-end gap-2"
        >
          {/* Standard Textarea: auto-expands upwards as user types so all text is visible */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              cancelAutoSend();
            }}
            onFocus={() => {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
                setTimeout(() => {
                  textareaRef.current?.focus();
                }, 10);
              }
            }}
            rows={1}
            placeholder={
              profile.language === 'en'
                ? 'Ask a question or tap the mic to speak...'
                : 'अपनी भाषा में बोलें या पूछें... (Ask or speak)'
            }
            className="flex-1 min-h-[48px] max-h-[160px] sm:max-h-[220px] px-4 py-3 rounded-card border border-card-border bg-card text-foreground placeholder:text-muted/60 focus:border-teal-accent shadow-soft text-sm transition-[border-color,box-shadow] duration-150 resize-none leading-relaxed overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />

          {/* Send Button (48px) */}
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="min-h-[48px] min-w-[48px] px-4 rounded-card bg-teal-accent text-white font-medium hover:bg-teal-hover disabled:opacity-40 disabled:hover:bg-teal-accent shadow-soft transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Send className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </form>

        {/* Small hint if SpeechRecognition is unsupported in this browser */}
        {!isSpeechRecognitionSupported && (
          <p className="text-xs text-muted/80 text-center leading-tight px-2">
            <Bi
              k="voice.unsupportedSTT"
              en="Voice typing is not supported in this browser. You can use your phone's keyboard microphone."
              layout="plain"
            />
          </p>
        )}

        <p className="text-xs text-muted/80 text-center leading-tight px-2">
          <Bi k="ask.medicalDisclaimer" layout="plain" />
        </p>
      </div>
    </div>
  );
}
