'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { AirQualityCard, ShareAudience } from './AirQualityCard';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { findNearestCatalogCity } from '@/lib/citiesData';
import {
  Share2,
  Download,
  X,
  Loader2,
  CheckCircle2,
  Users,
  Baby,
  HeartPulse,
  Heart,
  Activity,
  Briefcase,
  LucideIcon,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAudience?: ShareAudience;
  initialStyle?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  defaultAudience = 'whole_family',
}: ShareModalProps) {
  const { profile, airData, currentBand } = useApp();
  const shouldReduceMotion = useReducedMotion();

  // Audience selector state (Everyone, School parents, Elders at home, Outdoor workers)
  const [audience, setAudience] = useState<ShareAudience>(defaultAudience);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Generation state
  const [generating, setGenerating] = useState(true);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Hidden offscreen container for rendering
  const cardRef = useRef<HTMLDivElement | null>(null);

  // In-memory cache for generated images
  const imageCache = useRef<Record<string, { dataUrl: string; blob: Blob }>>({});

  const timeDiffMinutes = Math.max(
    1,
    Math.round((Date.now() - airData.updatedAt) / (60 * 1000))
  );

  // Generate QR Code once for clearhale-vercel.vercel.app with ultra-high resolution and Level H error correction
  useEffect(() => {
    QRCode.toDataURL('https://clearhale-vercel.vercel.app/', {
      errorCorrectionLevel: 'H',
      width: 1024,
      margin: 1,
      color: {
        dark: '#0D5C52',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR code generation failed', err));
  }, []);

  // Update audience when defaultAudience changes
  useEffect(() => {
    if (defaultAudience) {
      setAudience(defaultAudience);
    }
  }, [defaultAudience]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const isPregnantSelected = profile.household.members.includes('pregnant');
  const isAsthmaSelected =
    profile.household.members.includes('asthma_heart') ||
    (profile.household.members as string[]).includes('asthma') ||
    profile.household?.respiratoryOrHeart === true;

  const audienceOptions: {
    id: ShareAudience;
    icon: LucideIcon;
    labelEn: string;
  }[] = [
    { id: 'whole_family', icon: Users, labelEn: 'Everyone' },
    { id: 'child', icon: Baby, labelEn: 'School parents' },
    { id: 'elderly', icon: HeartPulse, labelEn: 'Elders at home' },
    ...(isPregnantSelected
      ? [
          {
            id: 'pregnant' as ShareAudience,
            icon: Heart,
            labelEn: 'Pregnant Person',
          },
        ]
      : []),
    ...(isAsthmaSelected
      ? [
          {
            id: 'asthma' as ShareAudience,
            icon: Activity,
            labelEn: 'Asthma / Heart',
          },
        ]
      : []),
    { id: 'outdoor_worker', icon: Briefcase, labelEn: 'Outdoor workers' },
  ];

  // Resolve clean city name avoiding generic placeholders
  const resolvedCityName = React.useMemo(() => {
    const raw = (profile.city?.name || '').split(',')[0].trim();
    if (!raw || raw.toLowerCase().includes('current location') || raw.toLowerCase().includes('my current location')) {
      return findNearestCatalogCity(profile.city?.lat ?? 28.6139, profile.city?.lon ?? 77.2090).name;
    }
    return raw;
  }, [profile.city?.name, profile.city?.lat, profile.city?.lon]);

  // Localized caption text for native sharing
  const getCaptionText = useCallback(() => {
    const url = 'https://clearhale-vercel.vercel.app/';
    const city = resolvedCityName;
    const pm = airData.current.pm2_5;
    const band = currentBand.label;

    if (profile.language === 'mr') {
      return `आज ${city} मधील हवेची गुणवत्ता: ${band} (PM2.5: ${pm} µg/m³)। Clearhale वर स्वच्छ हवेची योजना तपासा: ${url}`;
    } else if (profile.language === 'hi') {
      return `आज ${city} में वायु गुणवत्ता: ${band} (PM2.5: ${pm} µg/m³)। Clearhale पर स्वच्छ वायु योजना देखें: ${url}`;
    }
    return `Air in ${city} today: ${band} (PM2.5: ${pm} µg/m³). Check clean-air advice at ${url}`;
  }, [resolvedCityName, profile.language, currentBand.label, airData.current.pm2_5]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Convert base64 data URL to binary Blob in memory instantly (< 2ms)
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Convert offscreen poster DOM node to high-res PNG (1080x1350)
  const generateCardImage = useCallback(async () => {
    const width = 1080;
    const height = 1350;
    const cacheKey = `v5_${airData.updatedAt}_${airData.current.pm2_5}_${profile.city.name}_${profile.language}_${audience}`;

    if (imageCache.current[cacheKey]) {
      setPreviewDataUrl(imageCache.current[cacheKey].dataUrl);
      setPreviewBlob(imageCache.current[cacheKey].blob);
      setGenerating(false);
      return;
    }

    if (!cardRef.current) return;

    setGenerating(true);
    setGenerationError(null);

    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }

      const node = cardRef.current;

      // High-performance 2x Retina capture: ensures crystal-clear zoom and QR code readability
      const dataUrl = await toPng(node, {
        width,
        height,
        pixelRatio: 2,
        quality: 1.0,
        cacheBust: false,
        skipFonts: true,
      });

      const blob = dataUrlToBlob(dataUrl);

      if (dataUrl && blob) {
        imageCache.current[cacheKey] = { dataUrl, blob };
        setPreviewDataUrl(dataUrl);
        setPreviewBlob(blob);
      }
    } catch (err: unknown) {
      console.error('Failed to generate air quality poster:', err);
      setGenerationError(
        'Card generation was blocked by the browser. You can still download or share via link.'
      );
    } finally {
      setGenerating(false);
    }
  }, [
    airData.updatedAt,
    airData.current.pm2_5,
    profile.city.name,
    profile.language,
    audience,
  ]);

  // Regenerate when audience changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        generateCardImage();
      }, 16);
      return () => clearTimeout(timer);
    }
  }, [isOpen, audience, generateCardImage]);

  // Action: Share Poster
  const handleShare = async () => {
    const caption = getCaptionText();
    const safeSlug = resolvedCityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'city';
    const fileName = `clearhale-${safeSlug}-card.png`;

    if (previewBlob && typeof navigator !== 'undefined' && navigator.share) {
      try {
        const file = new File([previewBlob], fileName, {
          type: 'image/png',
          lastModified: Date.now(),
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Clearhale Air Poster - ${resolvedCityName}`,
            text: caption,
            files: [file],
          });
          triggerToast('Ready! Shared successfully');
          return;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('Native share failed, using fallback', err);
      }
    }

    // Fallback: Download image and open WhatsApp
    handleDownload();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(caption)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    triggerToast('Opening WhatsApp & downloaded image');
  };

  // Action: Download Image
  const handleDownload = () => {
    if (!previewDataUrl) return;
    const safeSlug = resolvedCityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'city';
    const fileName = `clearhale-${safeSlug}-card.png`;
    const link = document.createElement('a');
    link.href = previewDataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Ready! Poster downloaded');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden Offscreen Render Node (1080x1350) */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1080px',
          height: '1350px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -100,
        }}
        aria-hidden="true"
      >
        <AirQualityCard
          cardRef={cardRef}
          profile={profile}
          airData={airData}
          currentBand={currentBand}
          audience={audience}
          timeDiffMinutes={timeDiffMinutes}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      </div>

      {/* Portaled Backdrop & Sheet Container */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
              aria-hidden="true"
            />

            {/* Modal Dialog (Center on Desktop, Bottom Sheet on Mobile) */}
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-modal-title"
            >
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { y: '100%', opacity: 0.8 }
                }
                animate={{ y: 0, opacity: 1 }}
                exit={
                  shouldReduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0 }
                }
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="pointer-events-auto w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-card border border-card-border rounded-t-3xl sm:rounded-2xl shadow-float flex flex-col overflow-hidden"
              >
                {/* Mobile Handle */}
                <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
                  <span className="w-10 h-1.5 rounded-full bg-card-border" />
                </div>

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-card-border flex items-center justify-between gap-3 shrink-0">
                  <div>
                    <h2
                      id="share-modal-title"
                      className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4 text-teal-accent" strokeWidth={1.75} />
                      <span>Share Poster</span>
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                      Clean air poster for WhatsApp and groups.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 -mr-1 rounded-full text-muted hover:text-foreground hover:bg-card-subtle transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Close share preview"
                  >
                    <X className="w-5 h-5" strokeWidth={1.75} />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Audience Perspective Chips */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                      Audience
                    </label>
                    <div
                      className={`grid ${
                        isPregnantSelected
                          ? 'grid-cols-2 sm:grid-cols-3'
                          : 'grid-cols-2'
                      } gap-2 bg-card-subtle p-2 rounded-2xl border border-card-border`}
                    >
                      {audienceOptions.map((opt) => {
                        const isActive = audience === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setAudience(opt.id)}
                            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                              isActive
                                ? 'bg-card text-teal-accent font-semibold shadow-xs border border-card-border'
                                : 'text-muted hover:text-foreground hover:bg-card/50'
                            }`}
                          >
                            <opt.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                            <span className="whitespace-nowrap">{opt.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Poster Preview Container */}
                  <div className="relative min-h-[280px] sm:min-h-[340px] flex items-center justify-center rounded-2xl bg-stone-100/70 dark:bg-stone-900/40 border border-card-border p-3 overflow-hidden">
                    {generating && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-card/80 backdrop-blur-xs z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-accent" strokeWidth={1.75} />
                        <span className="text-xs font-medium text-teal-accent">
                          Generating poster...
                        </span>
                      </div>
                    )}

                    {generationError ? (
                      <div className="text-center p-4 space-y-2">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          {generationError}
                        </p>
                      </div>
                    ) : previewDataUrl ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="max-h-[48vh] sm:max-h-[50vh] flex items-center justify-center"
                      >
                        <img
                          src={previewDataUrl}
                          alt="Poster Preview"
                          className="max-h-[48vh] sm:max-h-[50vh] w-auto rounded-xl shadow-md border border-slate-200/80 object-contain drop-shadow-sm select-none"
                        />
                      </motion.div>
                    ) : null}
                  </div>
                </div>

                {/* Footer Buttons (Copy Text button removed per user request) */}
                <div className="p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-card-border bg-card flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={generating}
                    className="w-full sm:flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-teal-accent hover:bg-teal-hover text-white font-medium text-xs sm:text-sm shadow-soft transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={1.75} />
                    <span>Share Poster</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={generating || !previewDataUrl}
                    className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl border border-card-border hover:border-teal-accent/40 bg-card hover:bg-card-subtle text-foreground font-medium text-xs sm:text-sm shadow-soft transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-teal-accent" strokeWidth={1.75} />
                    <span>Download Image</span>
                  </button>
                </div>

                {/* Toast Notification */}
                <AnimatePresence>
                  {toastMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-semibold shadow-float flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
                      <span>{toastMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
