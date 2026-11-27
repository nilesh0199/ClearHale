'use client';

import React from 'react';
import { Volume2, VolumeX, Pause, Play, Square, AlertCircle } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';

interface SpeakerButtonProps {
  id: string;
  text: string;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'subtle' | 'pill';
  showLabel?: boolean;
}

export function SpeakerButton({
  id,
  text,
  className = '',
  size = 'md',
  variant = 'subtle',
  showLabel = false,
}: SpeakerButtonProps) {
  const {
    isSpeechSynthesisSupported,
    isSpeaking,
    isPaused,
    activeSpeakingId,
    speakText,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    speechWarning,
  } = useVoice();
  const { profile } = useApp();

  if (!isSpeechSynthesisSupported || !text) {
    return null;
  }

  const isCurrentActive = activeSpeakingId === id;
  const isCurrentlySpeaking = isCurrentActive && isSpeaking && !isPaused;
  const isCurrentlyPaused = isCurrentActive && isPaused;

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentlySpeaking) {
      pauseSpeech();
    } else if (isCurrentlyPaused) {
      resumeSpeech();
    } else {
      speakText(id, text);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSpeech();
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const minDim = size === 'sm' ? 'min-h-[40px] min-w-[40px]' : 'min-h-[44px] min-w-[44px]';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Main Play / Pause Button */}
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`${minDim} px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent cursor-pointer ${
          isCurrentlySpeaking
            ? 'bg-teal-light text-teal-accent border border-teal-accent/30 font-semibold shadow-xs ring-1 ring-teal-accent/20'
            : isCurrentlyPaused
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/40 font-semibold'
            : variant === 'pill'
            ? 'bg-card hover:bg-card-subtle text-muted hover:text-foreground border border-card-border shadow-xs'
            : 'text-muted hover:text-foreground hover:bg-card-subtle/80'
        }`}
        title={
          isCurrentlySpeaking
            ? 'Pause reading'
            : isCurrentlyPaused
            ? 'Resume reading'
            : 'Read aloud'
        }
        aria-label={
          isCurrentlySpeaking
            ? 'Pause reading aloud'
            : isCurrentlyPaused
            ? 'Resume reading aloud'
            : 'Read aloud'
        }
      >
        {isCurrentlySpeaking ? (
          <>
            <Pause className={`${iconSize} fill-current text-teal-accent animate-pulse`} />
            {showLabel && (
              <span className="text-[11px]">
                <Bi k="voice.pause" en="Pause" layout="inline" />
              </span>
            )}
          </>
        ) : isCurrentlyPaused ? (
          <>
            <Play className={`${iconSize} fill-current text-amber-600 dark:text-amber-400`} />
            {showLabel && (
              <span className="text-[11px]">
                <Bi k="voice.play" en="Resume" layout="inline" />
              </span>
            )}
          </>
        ) : (
          <>
            <Volume2 className={iconSize} />
            {showLabel && (
              <span className="text-[11px]">
                <Bi k="voice.play" en="Listen" layout="inline" />
              </span>
            )}
          </>
        )}
      </button>

      {/* Stop Button (visible only while active speaking or paused) */}
      {isCurrentActive && (
        <button
          type="button"
          onClick={handleStop}
          className={`${minDim} px-2 py-1.5 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50 transition-colors flex items-center justify-center`}
          title="Stop reading"
          aria-label="Stop reading"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      )}

      {/* One-line warning note if device lacks voice for this language */}
      {isCurrentActive && speechWarning && (
        <div
          role="status"
          className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>
            <Bi
              k="voice.unsupportedTTS"
              en="No voice for this language on this device. Reading English version."
              layout="plain"
            />
          </span>
        </div>
      )}
    </div>
  );
}
