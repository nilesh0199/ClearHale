import os

def create_svg_assets():
    os.makedirs('public/brand', exist_ok=True)
    
    # -------------------------------------------------------------
    # 1. MARK FULL (LIGHT)
    # -------------------------------------------------------------
    mark_full_light = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none">
  <defs>
    <!-- Main Lobe Vertical Gradient (Deep Teal to Fresh Mint) -->
    <linearGradient id="cf-lobe-grad-light" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#0B4F45" />
      <stop offset="52%" stop-color="#147264" />
      <stop offset="100%" stop-color="#4FAE8F" />
    </linearGradient>

    <!-- Trachea Gradient -->
    <linearGradient id="cf-trachea-grad-light" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3FA686" />
      <stop offset="100%" stop-color="#147264" />
    </linearGradient>

    <!-- Upper-Left Edge Shading / Highlight -->
    <linearGradient id="cf-edge-light" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.32" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- Glossy Highlight (Faint, 18-22%) -->
    <linearGradient id="cf-gloss-light" x1="0%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- Lower-Right Dark Inner Shade (Subtle depth) -->
    <radialGradient id="cf-shade-light" cx="80%" cy="85%" r="70%">
      <stop offset="0%" stop-color="#052E28" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#052E28" stop-opacity="0" />
    </radialGradient>

    <!-- Ground Contact Shadow Blur -->
    <filter id="cf-shadow-blur-light" x="-30%" y="-80%" width="160%" height="260%">
      <feGaussianBlur stdDeviation="2.4" />
    </filter>
  </defs>

  <!-- #shadow : Soft lifted shadow under lobes -->
  <g id="shadow">
    <ellipse cx="50" cy="93.5" rx="33" ry="4" fill="#0B4F45" opacity="0.13" filter="url(#cf-shadow-blur-light)" />
  </g>

  <!-- #lobe-left : Viewer's Left Lobe (anatomical right lung, slightly smaller ~92%) -->
  <g id="lobe-left" style="transform-origin: 45px 80px;">
    <!-- Base Shape -->
    <path d="M 30 20 C 18 28, 9 44, 9 58 C 9 71, 17 83, 30 85 C 36 86, 42 84, 45 80 C 47 73, 47 61, 46 49 C 45 38, 41 27, 30 20 Z"
          fill="url(#cf-lobe-grad-light)" />
    <!-- Lower Right Inner Shade -->
    <path d="M 30 20 C 18 28, 9 44, 9 58 C 9 71, 17 83, 30 85 C 36 86, 42 84, 45 80 C 47 73, 47 61, 46 49 C 45 38, 41 27, 30 20 Z"
          fill="url(#cf-shade-light)" />
    <!-- Upper Left Edge Highlight -->
    <path d="M 30 20 C 18 28, 9 44, 9 58 C 9 71, 14 78, 22 83"
          stroke="url(#cf-edge-light)" stroke-width="1.6" stroke-linecap="round" fill="none" />
  </g>

  <!-- #lobe-right : Viewer's Right Lobe (anatomical left lung, fuller) -->
  <g id="lobe-right" style="transform-origin: 55px 81px;">
    <!-- Base Shape -->
    <path d="M 72 17 C 84 25, 93 42, 93 57 C 93 72, 85 84, 71 87 C 64 88, 58 85, 55 81 C 53 74, 53 62, 54 50 C 55 38, 60 25, 72 17 Z"
          fill="url(#cf-lobe-grad-light)" />
    <!-- Lower Right Inner Shade -->
    <path d="M 72 17 C 84 25, 93 42, 93 57 C 93 72, 85 84, 71 87 C 64 88, 58 85, 55 81 C 53 74, 53 62, 54 50 C 55 38, 60 25, 72 17 Z"
          fill="url(#cf-shade-light)" />
    <!-- Upper Left Edge Highlight -->
    <path d="M 54 50 C 55 38, 60 25, 72 17 C 78 21, 84 29, 88 38"
          stroke="url(#cf-edge-light)" stroke-width="1.6" stroke-linecap="round" fill="none" />
  </g>

  <!-- #highlight : Soft upper-left glossy sheen on each lobe -->
  <g id="highlight" pointer-events="none">
    <!-- Left Lobe Gloss -->
    <path d="M 28 23 C 19 30, 12 44, 12 55 C 12 48, 17 34, 28 27 Z" fill="url(#cf-gloss-light)" />
    <!-- Right Lobe Gloss -->
    <path d="M 70 20 C 80 27, 88 41, 88 53 C 88 46, 81 31, 70 24 Z" fill="url(#cf-gloss-light)" />
  </g>

  <!-- #trachea : Central windpipe and branching bronchi -->
  <g id="trachea">
    <!-- Trachea main tube -->
    <path d="M 50 13 L 50 31" stroke="url(#cf-trachea-grad-light)" stroke-width="3.2" stroke-linecap="round" fill="none" />
    
    <!-- Subtle trachea cartilage rings -->
    <line x1="48.2" y1="18" x2="51.8" y2="18" stroke="#7EE3C3" stroke-width="0.9" stroke-linecap="round" opacity="0.6" />
    <line x1="48.2" y1="22.5" x2="51.8" y2="22.5" stroke="#7EE3C3" stroke-width="0.9" stroke-linecap="round" opacity="0.6" />
    <line x1="48.2" y1="27" x2="51.8" y2="27" stroke="#7EE3C3" stroke-width="0.9" stroke-linecap="round" opacity="0.6" />

    <!-- Bronchi branching into lobes -->
    <path d="M 50 31 C 49 37, 47 41, 44 44" stroke="url(#cf-trachea-grad-light)" stroke-width="2.6" stroke-linecap="round" fill="none" />
    <path d="M 50 31 C 51 37, 53 41, 56 44" stroke="url(#cf-trachea-grad-light)" stroke-width="2.6" stroke-linecap="round" fill="none" />
  </g>

  <!-- #veins : Leaf veins / bronchial tree with embossed depth -->
  <g id="veins">
    <!-- Emboss Shadow Underpass (Offset slightly down-right) -->
    <g stroke="#052E28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.32" transform="translate(0.3, 0.4)">
      <!-- Left Vein Underpass -->
      <path d="M 44 44 C 39 47, 34 38, 30 23" stroke-width="2.0" />
      <path d="M 41 53 C 32 59, 23 68, 17 72" />
      <path d="M 38 45 C 27 47, 19 50, 13 52" />
      <path d="M 34 35 C 26 34, 20 33, 16 32" />
      <path d="M 39 48 C 42 42, 43 37, 44 32" />
      <!-- Right Vein Underpass -->
      <path d="M 56 44 C 61 47, 66 37, 71 20" stroke-width="2.0" />
      <path d="M 59 53 C 68 59, 77 68, 83 73" />
      <path d="M 62 45 C 73 47, 81 50, 87 52" />
      <path d="M 66 35 C 74 34, 80 33, 84 32" />
      <path d="M 61 48 C 58 42, 57 37, 56 32" />
    </g>

    <!-- Main Lighter Vein Strokes (Gently embossed finish) -->
    <g id="vein-strokes" stroke="#99F6E4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9">
      <!-- Left Veins -->
      <g id="veins-left">
        <!-- Midrib -->
        <path d="M 44 44 C 39 47, 34 38, 30 23" stroke-width="2.0" />
        <!-- Branch 1 (lower) -->
        <path d="M 41 53 C 32 59, 23 68, 17 72" />
        <!-- Branch 2 (middle) -->
        <path d="M 38 45 C 27 47, 19 50, 13 52" />
        <!-- Branch 3 (upper) -->
        <path d="M 34 35 C 26 34, 20 33, 16 32" />
        <!-- Branch 4 (medial) -->
        <path d="M 39 48 C 42 42, 43 37, 44 32" />
      </g>
      <!-- Right Veins -->
      <g id="veins-right">
        <!-- Midrib -->
        <path d="M 56 44 C 61 47, 66 37, 71 20" stroke-width="2.0" />
        <!-- Branch 1 (lower) -->
        <path d="M 59 53 C 68 59, 77 68, 83 73" />
        <!-- Branch 2 (middle) -->
        <path d="M 62 45 C 73 47, 81 50, 87 52" />
        <!-- Branch 3 (upper) -->
        <path d="M 66 35 C 74 34, 80 33, 84 32" />
        <!-- Branch 4 (medial) -->
        <path d="M 61 48 C 58 42, 57 37, 56 32" />
      </g>
    </g>
  </g>
</svg>'''

    # -------------------------------------------------------------
    # 2. MARK FULL (DARK)
    # Brighter mint top stop (#34D399 / #5CE1B6), softer shadow
    # -------------------------------------------------------------
    mark_full_dark = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none">
  <defs>
    <!-- Main Lobe Vertical Gradient (Deep Teal to Brighter Mint) -->
    <linearGradient id="cf-lobe-grad-dark" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#0E544A" />
      <stop offset="48%" stop-color="#148371" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>

    <!-- Trachea Gradient -->
    <linearGradient id="cf-trachea-grad-dark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#5CE1B6" />
      <stop offset="100%" stop-color="#148371" />
    </linearGradient>

    <!-- Upper-Left Edge Shading / Highlight -->
    <linearGradient id="cf-edge-dark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- Glossy Highlight (Faint, 20-24%) -->
    <linearGradient id="cf-gloss-dark" x1="0%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- Lower-Right Dark Inner Shade -->
    <radialGradient id="cf-shade-dark" cx="80%" cy="85%" r="70%">
      <stop offset="0%" stop-color="#04201C" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#04201C" stop-opacity="0" />
    </radialGradient>

    <!-- Softer Dark Mode Ground Contact Shadow Blur -->
    <filter id="cf-shadow-blur-dark" x="-30%" y="-80%" width="160%" height="260%">
      <feGaussianBlur stdDeviation="3.0" />
    </filter>
  </defs>

  <!-- #shadow : Softer shadow for dark surfaces -->
  <g id="shadow">
    <ellipse cx="50" cy="93.5" rx="34" ry="4.2" fill="#000000" opacity="0.32" filter="url(#cf-shadow-blur-dark)" />
  </g>

  <!-- #lobe-left -->
  <g id="lobe-left" style="transform-origin: 45px 80px;">
    <path d="M 30 20 C 18 28, 9 44, 9 58 C 9 71, 17 83, 30 85 C 36 86, 42 84, 45 80 C 47 73, 47 61, 46 49 C 45 38, 41 27, 30 20 Z"
          fill="url(#cf-lobe-grad-dark)" />
    <path d="M 30 20 C 18 28, 9 44, 9 58 C 9 71, 17 83, 30 85 C 36 86, 42 84, 45 80 C 47 73, 47 61, 46 49 C 45 38, 41 27, 30 20 Z"
          fill="url(#cf-shade-dark)" />
    <path d="M 30 20 C 18 28, 9 44, 9 58 C 9 71, 14 78, 22 83"
          stroke="url(#cf-edge-dark)" stroke-width="1.6" stroke-linecap="round" fill="none" />
  </g>

  <!-- #lobe-right -->
  <g id="lobe-right" style="transform-origin: 55px 81px;">
    <path d="M 72 17 C 84 25, 93 42, 93 57 C 93 72, 85 84, 71 87 C 64 88, 58 85, 55 81 C 53 74, 53 62, 54 50 C 55 38, 60 25, 72 17 Z"
          fill="url(#cf-lobe-grad-dark)" />
    <path d="M 72 17 C 84 25, 93 42, 93 57 C 93 72, 85 84, 71 87 C 64 88, 58 85, 55 81 C 53 74, 53 62, 54 50 C 55 38, 60 25, 72 17 Z"
          fill="url(#cf-shade-dark)" />
    <path d="M 54 50 C 55 38, 60 25, 72 17 C 78 21, 84 29, 88 38"
          stroke="url(#cf-edge-dark)" stroke-width="1.6" stroke-linecap="round" fill="none" />
  </g>

  <!-- #highlight -->
  <g id="highlight" pointer-events="none">
    <path d="M 28 23 C 19 30, 12 44, 12 55 C 12 48, 17 34, 28 27 Z" fill="url(#cf-gloss-dark)" />
    <path d="M 70 20 C 80 27, 88 41, 88 53 C 88 46, 81 31, 70 24 Z" fill="url(#cf-gloss-dark)" />
  </g>

  <!-- #trachea -->
  <g id="trachea">
    <path d="M 50 13 L 50 31" stroke="url(#cf-trachea-grad-dark)" stroke-width="3.2" stroke-linecap="round" fill="none" />
    <line x1="48.2" y1="18" x2="51.8" y2="18" stroke="#A7F3D0" stroke-width="0.9" stroke-linecap="round" opacity="0.7" />
    <line x1="48.2" y1="22.5" x2="51.8" y2="22.5" stroke="#A7F3D0" stroke-width="0.9" stroke-linecap="round" opacity="0.7" />
    <line x1="48.2" y1="27" x2="51.8" y2="27" stroke="#A7F3D0" stroke-width="0.9" stroke-linecap="round" opacity="0.7" />
    <path d="M 50 31 C 49 37, 47 41, 44 44" stroke="url(#cf-trachea-grad-dark)" stroke-width="2.6" stroke-linecap="round" fill="none" />
    <path d="M 50 31 C 51 37, 53 41, 56 44" stroke="url(#cf-trachea-grad-dark)" stroke-width="2.6" stroke-linecap="round" fill="none" />
  </g>

  <!-- #veins -->
  <g id="veins">
    <g stroke="#04201C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.4" transform="translate(0.3, 0.4)">
      <path d="M 44 44 C 39 47, 34 38, 30 23" stroke-width="2.0" />
      <path d="M 41 53 C 32 59, 23 68, 17 72" />
      <path d="M 38 45 C 27 47, 19 50, 13 52" />
      <path d="M 34 35 C 26 34, 20 33, 16 32" />
      <path d="M 39 48 C 42 42, 43 37, 44 32" />
      <path d="M 56 44 C 61 47, 66 37, 71 20" stroke-width="2.0" />
      <path d="M 59 53 C 68 59, 77 68, 83 73" />
      <path d="M 62 45 C 73 47, 81 50, 87 52" />
      <path d="M 66 35 C 74 34, 80 33, 84 32" />
      <path d="M 61 48 C 58 42, 57 37, 56 32" />
    </g>

    <g id="vein-strokes" stroke="#A7F3D0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.95">
      <g id="veins-left">
        <path d="M 44 44 C 39 47, 34 38, 30 23" stroke-width="2.0" />
        <path d="M 41 53 C 32 59, 23 68, 17 72" />
        <path d="M 38 45 C 27 47, 19 50, 13 52" />
        <path d="M 34 35 C 26 34, 20 33, 16 32" />
        <path d="M 39 48 C 42 42, 43 37, 44 32" />
      </g>
      <g id="veins-right">
        <path d="M 56 44 C 61 47, 66 37, 71 20" stroke-width="2.0" />
        <path d="M 59 53 C 68 59, 77 68, 83 73" />
        <path d="M 62 45 C 73 47, 81 50, 87 52" />
        <path d="M 66 35 C 74 34, 80 33, 84 32" />
        <path d="M 61 48 C 58 42, 57 37, 56 32" />
      </g>
    </g>
  </g>
</svg>'''

    # -------------------------------------------------------------
    # 3. MARK FLAT (LIGHT & DARK / MONOCHROME)
    # Silhouette with crisp negative cut-outs for veins.
    # Reads sharply at 16px, 24px, 32px.
    # -------------------------------------------------------------
    def get_mark_flat(color):
        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none">
  <defs>
    <!-- Mask to punch cut-out negative space veins through the solid silhouette -->
    <mask id="cf-flat-mask-{color.replace('#', '')}">
      <rect width="100" height="100" fill="white" />
      <!-- Cut-out veins -->
      <g stroke="black" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Left veins cutout -->
        <path d="M 44 44 C 39 47, 34 38, 30 23" stroke-width="2.8" />
        <path d="M 41 53 C 32 59, 23 68, 17 72" stroke-width="2.2" />
        <path d="M 38 45 C 27 47, 19 50, 13 52" stroke-width="2.2" />
        <path d="M 34 35 C 26 34, 20 33, 16 32" stroke-width="2.2" />
        <path d="M 39 48 C 42 42, 43 37, 44 32" stroke-width="2.2" />
        <!-- Right veins cutout -->
        <path d="M 56 44 C 61 47, 66 37, 71 20" stroke-width="2.8" />
        <path d="M 59 53 C 68 59, 77 68, 83 73" stroke-width="2.2" />
        <path d="M 62 45 C 73 47, 81 50, 87 52" stroke-width="2.2" />
        <path d="M 66 35 C 74 34, 80 33, 84 32" stroke-width="2.2" />
        <path d="M 61 48 C 58 42, 57 37, 56 32" stroke-width="2.2" />
      </g>
    </mask>
  </defs>

  <!-- Masked Lobes -->
  <g mask="url(#cf-flat-mask-{color.replace('#', '')})">
    <!-- Left Lobe -->
    <path d="M 30 20 C 18 28, 9 44, 9 58 C 9 71, 17 83, 30 85 C 36 86, 42 84, 45 80 C 47 73, 47 61, 46 49 C 45 38, 41 27, 30 20 Z"
          fill="{color}" />
    <!-- Right Lobe -->
    <path d="M 72 17 C 84 25, 93 42, 93 57 C 93 72, 85 84, 71 87 C 64 88, 58 85, 55 81 C 53 74, 53 62, 54 50 C 55 38, 60 25, 72 17 Z"
          fill="{color}" />
  </g>

  <!-- Trachea (Solid silhouette with crisp gap) -->
  <g>
    <path d="M 50 14 L 50 31" stroke="{color}" stroke-width="3.4" stroke-linecap="round" fill="none" />
    <path d="M 50 31 C 49 37, 47 41, 44 44" stroke="{color}" stroke-width="2.8" stroke-linecap="round" fill="none" />
    <path d="M 50 31 C 51 37, 53 41, 56 44" stroke="{color}" stroke-width="2.8" stroke-linecap="round" fill="none" />
  </g>
</svg>'''

    mark_flat_light = get_mark_flat('#0D5C52')
    mark_flat_dark = get_mark_flat('#34D399')
    mark_flat_mono = get_mark_flat('#18181B')

    # -------------------------------------------------------------
    # 4. LOCKUP (LIGHT & DARK)
    # Mark + "clearhale" semi-bold sans text in SVG
    # -------------------------------------------------------------
    def get_lockup(mark_content, text_color, is_dark=False):
        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" width="280" height="64" fill="none">
  <!-- Mark icon scaled to 54x54 -->
  <g transform="translate(4, 5) scale(0.54)">
    {mark_content}
  </g>
  <!-- Wordmark Text -->
  <text x="68" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', 'Segoe UI', sans-serif" font-size="28" font-weight="600" letter-spacing="-0.03em" fill="{text_color}">clearhale</text>
</svg>'''

    # Extract inner SVG contents for embedding in lockup
    def extract_inner(svg_str):
        start = svg_str.find('>') + 1
        end = svg_str.rfind('</svg>')
        return svg_str[start:end].strip()

    lockup_light = get_lockup(extract_inner(mark_full_light), '#121615', False)
    lockup_dark = get_lockup(extract_inner(mark_full_dark), '#F4F4F5', True)

    # -------------------------------------------------------------
    # 5. PWA ICONS & MASKABLE
    # -------------------------------------------------------------
    def get_pwa_icon(bg_color, mark_svg, is_maskable=False):
        # For maskable icons, standard Android safe zone is 80% (scale 0.72)
        scale = 0.72 if is_maskable else 0.82
        translate = 512 * (1 - scale) / 2
        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="{bg_color}" />
  <g transform="translate({translate:.1f}, {translate:.1f}) scale({scale * 5.12:.3f})">
    {extract_inner(mark_svg)}
  </g>
</svg>'''

    pwa_light = get_pwa_icon('#FAF9F6', mark_full_light, False)
    pwa_dark = get_pwa_icon('#121615', mark_full_dark, False)
    pwa_maskable_light = get_pwa_icon('#FAF9F6', mark_full_light, True)
    pwa_maskable_dark = get_pwa_icon('#121615', mark_full_dark, True)

    # Write files to disk
    files = {
        'public/brand/mark-full-light.svg': mark_full_light,
        'public/brand/mark-full-dark.svg': mark_full_dark,
        'public/brand/mark-flat-light.svg': mark_flat_light,
        'public/brand/mark-flat-dark.svg': mark_flat_dark,
        'public/brand/mark-flat-mono.svg': mark_flat_mono,
        'public/brand/lockup-light.svg': lockup_light,
        'public/brand/lockup-dark.svg': lockup_dark,
        'public/brand/icon-192.svg': pwa_light,
        'public/brand/icon-512.svg': pwa_light,
        'public/brand/icon-maskable-512.svg': pwa_maskable_light,
        'public/brand/icon-dark-512.svg': pwa_dark,
        'public/brand/favicon.svg': mark_flat_light,
        'public/icon.svg': pwa_light,
        'public/favicon.svg': mark_flat_light,
    }

    for path, content in files.items():
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Generated {path}")

if __name__ == '__main__':
    create_svg_assets()
