'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClearhaleMarkFull } from '@/components/brand/ClearhaleMarkFull';
import { ClearhaleMarkFlat } from '@/components/brand/ClearhaleMarkFlat';
import { ClearhaleLockup } from '@/components/brand/ClearhaleLockup';
import { ArrowLeft, Play, RefreshCw, Sun, Moon, Download, Layers } from 'lucide-react';

export default function BrandShowcasePage() {
  const [isBreathing, setIsBreathing] = useState(true);
  const [introKey, setIntroKey] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<'both' | 'light' | 'dark'>('both');

  const replayIntro = () => {
    setIntroKey((k) => k + 1);
  };

  const sizes = [16, 32, 64, 128, 256];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100 p-4 sm:p-8 lg:p-12 transition-colors">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-300 dark:border-stone-800">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-teal-700 dark:hover:text-teal-400 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to App</span>
          </Link>
          <div className="flex items-center gap-3">
            <ClearhaleMarkFull size={44} variant="auto" idPrefix="top-hdr" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Clearhale Brand & Identity
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Refined semi-realistic leaf-lung logo mark, hand-coded SVG design system
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBreathing(!isBreathing)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
              isBreathing
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isBreathing ? 'fill-current' : ''}`} />
            <span>Breathing: {isBreathing ? 'Active (4s/4s)' : 'Paused'}</span>
          </button>

          <button
            onClick={replayIntro}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-teal-500 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Replay Intro Draw</span>
          </button>

          <div className="flex items-center bg-white dark:bg-stone-900 p-1 rounded-xl border border-stone-300 dark:border-stone-700 text-xs">
            <button
              onClick={() => setSelectedTheme('both')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                selectedTheme === 'both'
                  ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                  : 'text-stone-500'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setSelectedTheme('light')}
              className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                selectedTheme === 'light'
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-stone-500'
              }`}
            >
              <Sun className="w-3 h-3" /> Light
            </button>
            <button
              onClick={() => setSelectedTheme('dark')}
              className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                selectedTheme === 'dark'
                  ? 'bg-teal-900 text-teal-100'
                  : 'text-stone-500'
              }`}
            >
              <Moon className="w-3 h-3" /> Dark
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-16">
        {/* Concept & Anatomy Callout */}
        <section className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="w-36 h-36 shrink-0 bg-stone-50 dark:bg-stone-950 rounded-2xl flex items-center justify-center border border-stone-200 dark:border-stone-800 p-3">
              <ClearhaleMarkFull
                key={`hero-${introKey}`}
                size={120}
                variant="auto"
                isBreathing={isBreathing}
                introAnimation={true}
                idPrefix="hero-concept"
              />
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>Biological & Botanical Synergy</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Pair of lungs whose lobes are leaves.
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                The central trachea splits at the carina into two bronchi, continuing as the midrib of each leaf lobe with 3-4 delicate branching veins. Slightly asymmetric (left lobe smaller as an anatomical nod to the heart). Finished with a soft 3D linear gradient from deep teal to fresh mint, embossed veins, upper-left glossy sheen, and soft ground shadow.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 font-mono">
                  #0D5C52 (Deep Teal)
                </span>
                <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 font-mono">
                  #09473F (Mid Teal)
                </span>
                <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 font-mono">
                  #2DD4BF (Fresh Mint)
                </span>
                <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 font-mono">
                  #34D399 (Dark Mint)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 1. MARK-FULL: Across Sizes & Backgrounds */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <span>1. mark-full</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-normal">
                Welcome screen, onboarding, detailed displays
              </span>
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Rendered at 16, 32, 64, 128, and 256px on off-white (#FAFAFA) and deep dark (#0A0A0A) surfaces.
            </p>
          </div>

          <div
            className={`grid gap-6 ${
              selectedTheme === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* Light Surface Container */}
            {(selectedTheme === 'both' || selectedTheme === 'light') && (
              <div className="bg-[#FAFAFA] p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm text-stone-900">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Light Surface (#FAFAFA)
                  </span>
                  <span className="text-xs text-stone-400">Variant: mark-full-light</span>
                </div>

                <div className="flex flex-wrap items-end gap-6 sm:gap-8 justify-around py-4">
                  {sizes.map((sz) => (
                    <div key={`mf-light-${sz}`} className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center min-w-[32px] min-h-[32px]">
                        <ClearhaleMarkFull
                          key={`mf-light-${sz}-${introKey}`}
                          size={sz}
                          variant="light"
                          isBreathing={isBreathing}
                          introAnimation={sz >= 64}
                          idPrefix={`mf-l-${sz}`}
                        />
                      </div>
                      <span className="text-xs text-stone-400 font-mono">{sz}px</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dark Surface Container */}
            {(selectedTheme === 'both' || selectedTheme === 'dark') && (
              <div className="bg-[#0A0A0A] p-6 sm:p-8 rounded-2xl border border-stone-800 shadow-sm text-stone-100">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-400/80">
                    Dark Surface (#0A0A0A)
                  </span>
                  <span className="text-xs text-stone-500">Variant: mark-full-dark</span>
                </div>

                <div className="flex flex-wrap items-end gap-6 sm:gap-8 justify-around py-4">
                  {sizes.map((sz) => (
                    <div key={`mf-dark-${sz}`} className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center min-w-[32px] min-h-[32px]">
                        <ClearhaleMarkFull
                          key={`mf-dark-${sz}-${introKey}`}
                          size={sz}
                          variant="dark"
                          isBreathing={isBreathing}
                          introAnimation={sz >= 64}
                          idPrefix={`mf-d-${sz}`}
                        />
                      </div>
                      <span className="text-xs text-stone-500 font-mono">{sz}px</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. MARK-FLAT: Silhouette with Cut-Out Veins */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <span>2. mark-flat</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-normal">
                Sizes &lt; 32px, monochrome, favicon, dense UI
              </span>
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Punch-through negative space veins ensure ultra-crisp legibility even at 16px and 24px.
            </p>
          </div>

          <div
            className={`grid gap-6 ${
              selectedTheme === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* Flat on Light */}
            {(selectedTheme === 'both' || selectedTheme === 'light') && (
              <div className="bg-[#FAFAFA] p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm text-stone-900">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Flat Silhouette on Light
                  </span>
                  <span className="text-xs text-stone-400">Teal #0D5C52 / Mono</span>
                </div>

                <div className="flex flex-wrap items-end gap-6 sm:gap-8 justify-around py-4">
                  {sizes.map((sz) => (
                    <div key={`mflat-light-${sz}`} className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center min-w-[32px] min-h-[32px]">
                        <ClearhaleMarkFlat
                          size={sz}
                          color="#0D5C52"
                          idPrefix={`mflat-l-${sz}`}
                        />
                      </div>
                      <span className="text-xs text-stone-400 font-mono">{sz}px</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flat on Dark */}
            {(selectedTheme === 'both' || selectedTheme === 'dark') && (
              <div className="bg-[#0A0A0A] p-6 sm:p-8 rounded-2xl border border-stone-800 shadow-sm text-stone-100">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-400/80">
                    Flat Silhouette on Dark
                  </span>
                  <span className="text-xs text-stone-500">Mint #34D399</span>
                </div>

                <div className="flex flex-wrap items-end gap-6 sm:gap-8 justify-around py-4">
                  {sizes.map((sz) => (
                    <div key={`mflat-dark-${sz}`} className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center min-w-[32px] min-h-[32px]">
                        <ClearhaleMarkFlat
                          size={sz}
                          color="#34D399"
                          idPrefix={`mflat-d-${sz}`}
                        />
                      </div>
                      <span className="text-xs text-stone-500 font-mono">{sz}px</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. LOCKUP: Mark + Wordmark "clearhale" */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <span>3. lockup</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-normal">
                Header, desktop sidebar, marketing headers
              </span>
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Mark paired with lowercase "clearhale" wordmark in semi-bold Plus Jakarta Sans.
            </p>
          </div>

          <div
            className={`grid gap-6 ${
              selectedTheme === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* Lockup Light */}
            {(selectedTheme === 'both' || selectedTheme === 'light') && (
              <div className="bg-[#FAFAFA] p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm text-stone-900 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Lockup on Light
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-white/70 rounded-xl border border-stone-200/60 flex items-center justify-between">
                    <span className="text-xs text-stone-400 font-mono">Large (64px)</span>
                    <ClearhaleLockup
                      size="lg"
                      variant="light"
                      isBreathing={isBreathing}
                      subtitle="Breathe clearer, one smart choice at a time."
                      idPrefix="lockup-lg-l"
                    />
                  </div>

                  <div className="p-4 bg-white/70 rounded-xl border border-stone-200/60 flex items-center justify-between">
                    <span className="text-xs text-stone-400 font-mono">Medium (40px)</span>
                    <ClearhaleLockup
                      size="md"
                      variant="light"
                      isBreathing={isBreathing}
                      subtitle="Breathe clearer"
                      idPrefix="lockup-md-l"
                    />
                  </div>

                  <div className="p-4 bg-white/70 rounded-xl border border-stone-200/60 flex items-center justify-between">
                    <span className="text-xs text-stone-400 font-mono">Small (26px, flat mark)</span>
                    <ClearhaleLockup
                      size="sm"
                      variant="light"
                      useFlatMark={true}
                      idPrefix="lockup-sm-l"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Lockup Dark */}
            {(selectedTheme === 'both' || selectedTheme === 'dark') && (
              <div className="bg-[#0A0A0A] p-6 sm:p-8 rounded-2xl border border-stone-800 shadow-sm text-stone-100 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-400/80">
                    Lockup on Dark
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-stone-900/60 rounded-xl border border-stone-800 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-mono">Large (64px)</span>
                    <ClearhaleLockup
                      size="lg"
                      variant="dark"
                      isBreathing={isBreathing}
                      subtitle="Breathe clearer, one smart choice at a time."
                      idPrefix="lockup-lg-d"
                    />
                  </div>

                  <div className="p-4 bg-stone-900/60 rounded-xl border border-stone-800 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-mono">Medium (40px)</span>
                    <ClearhaleLockup
                      size="md"
                      variant="dark"
                      isBreathing={isBreathing}
                      subtitle="Breathe clearer"
                      idPrefix="lockup-md-d"
                    />
                  </div>

                  <div className="p-4 bg-stone-900/60 rounded-xl border border-stone-800 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-mono">Small (26px, flat mark)</span>
                    <ClearhaleLockup
                      size="sm"
                      variant="dark"
                      useFlatMark={true}
                      idPrefix="lockup-sm-d"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 4. PWA ICONS & MASKABLE */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <span>4. PWA App Icons & Maskable</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-normal">
                192px, 512px, Android Maskable safe zone, Favicon
              </span>
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Tested for installability, Android adaptive launcher rings, and browser favicon bars.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Standard 192px Light */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center text-center">
              <span className="text-xs font-semibold uppercase text-stone-400 mb-4">
                PWA Icon (192px)
              </span>
              <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-md border border-stone-200 dark:border-stone-800 bg-[#FAFAFA] flex items-center justify-center p-3">
                <ClearhaleMarkFull size={92} variant="light" idPrefix="pwa-192-demo" />
              </div>
              <span className="text-xs text-stone-400 font-mono mt-4">/icon-192.png</span>
            </div>

            {/* Standard 512px Light */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center text-center">
              <span className="text-xs font-semibold uppercase text-stone-400 mb-4">
                PWA Icon (512px)
              </span>
              <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-md border border-stone-200 dark:border-stone-800 bg-[#FAFAFA] flex items-center justify-center p-3">
                <ClearhaleMarkFull size={96} variant="light" idPrefix="pwa-512-demo" />
              </div>
              <span className="text-xs text-stone-400 font-mono mt-4">/icon-512.png</span>
            </div>

            {/* Maskable Safe Zone */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center text-center">
              <span className="text-xs font-semibold uppercase text-stone-400 mb-4">
                Maskable Safe Zone (Circle)
              </span>
              <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-md border-2 border-dashed border-teal-500 bg-[#FAFAFA] flex items-center justify-center p-3">
                <ClearhaleMarkFull size={72} variant="light" idPrefix="pwa-mask-demo" />
              </div>
              <span className="text-xs text-stone-400 font-mono mt-4">/icon-maskable-512.png</span>
            </div>

            {/* Favicon Simulation */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center text-center">
              <span className="text-xs font-semibold uppercase text-stone-400 mb-4">
                Browser Tab Favicon (16/32px)
              </span>
              <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-xl p-3 border border-stone-300 dark:border-stone-700 flex items-center gap-2">
                <div className="p-1 bg-white dark:bg-stone-900 rounded shadow-xs">
                  <ClearhaleMarkFlat size={16} color="#0D5C52" idPrefix="tab-fav-demo" />
                </div>
                <span className="text-xs font-medium truncate text-stone-700 dark:text-stone-300">
                  Clearhale • Breathe
                </span>
              </div>
              <span className="text-xs text-stone-400 font-mono mt-4">/favicon.svg (Flat silhouette)</span>
            </div>
          </div>
        </section>

        {/* 5. DOWNLOADS & ASSETS REPOSITORY */}
        <section className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Exported Brand Assets</h2>
            <span className="text-xs text-stone-500 font-mono">/public/brand/</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              { name: 'mark-full-light.svg', desc: 'Full 3D soft gradient leaf-lungs (light)' },
              { name: 'mark-full-dark.svg', desc: 'Full 3D brighter mint stop (dark)' },
              { name: 'mark-flat-light.svg', desc: 'Silhouette with cutout veins (#0D5C52)' },
              { name: 'mark-flat-dark.svg', desc: 'Silhouette with cutout veins (#34D399)' },
              { name: 'lockup-light.svg', desc: 'Mark + "clearhale" text lockup (light)' },
              { name: 'lockup-dark.svg', desc: 'Mark + "clearhale" text lockup (dark)' },
              { name: 'icon-192.png', desc: '192x192 raster PNG for PWA homescreen' },
              { name: 'icon-512.png', desc: '512x512 raster PNG for splash screens' },
              { name: 'icon-maskable-512.png', desc: '512x512 Android adaptive maskable icon' },
              { name: 'favicon.svg', desc: 'Scalable vector browser favicon' },
              { name: 'favicon.ico', desc: 'Multi-resolution legacy favicon' },
            ].map((file) => (
              <a
                key={file.name}
                href={`/brand/${file.name}`}
                download
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400 group-hover:underline">
                    {file.name}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    {file.desc}
                  </div>
                </div>
                <Download className="w-4 h-4 text-stone-400 group-hover:text-teal-600 shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
