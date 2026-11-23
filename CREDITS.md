# Clearhale UI Credits & Attribution

This project incorporates design inspiration and open-source interface components adapted for Clearhale's restrained environmental health aesthetic.

## Component & Motion Sources

1. **React Bits (`reactbits.dev`)**
   - **Creator**: David Haz & community
   - **License**: MIT License
   - **Components Adapted**:
     - `Particles`: Canvas-based atmospheric floating particle field with dynamic AQI/PM2.5 density and action-thinning factor.
     - `SpotlightCard`: Cursor-tracked radial highlight on card borders and surfaces with restrained opacity and desktop-only pointer gating.
     - `BlurText`: Character and word spring blur-fade text reveal for hero headlines.
     - `ShinyText`: Smooth linear gradient shine animation for AI thinking states and highlight badges.
     - `CountUp`: Monotonic, tabular numeral count-up with smooth exponential easing.
     - `AnimatedList`: Spring-driven staggered entrance list container for checklists and cards.
   - **Source Directory**: `components/ui/rb/`

2. **Motion / Framer Motion (`motion.dev`)**
   - **Creator**: Framer B.V.
   - **License**: MIT License
   - **Usage**: Shared element layout animations (`layoutId="care-tab-pill"` and family switcher), monotonic countdown ring transitions, spring-physics accordion reveals, and `useReducedMotion` accessibility gates.

3. **MotionSites (`motionsites.ai`)**
   - **Inspiration**: Atmospheric micro-breathing rhythm on the welcome hero mark and floating depth hierarchy without heavy video or excessive glassmorphism.

4. **Lucide Icons (`lucide.dev`)**
   - **License**: ISC License
   - **Usage**: Consistent 1.75–2px stroke iconography across mobile and desktop interfaces.

5. **Canvas Confetti (`github.com/catdad/canvas-confetti`)**
   - **Creator**: Kiril Vatev
   - **License**: MIT License
   - **Usage**: Tactile reward particle burst upon completing smog mitigation actions.

6. **Open-Meteo API (`open-meteo.com`)**
   - **License**: CC-BY 4.0
   - **Usage**: High-resolution hourly air quality forecast models for Indian cities.

7. **OpenAQ API (`openaq.org`)**
   - **License**: CC-BY 4.0 / Open Data Commons
   - **Usage**: Reference physical ground monitoring station measurements from official government authorities (CPCB, DPCC, SPCBs) accessed via OpenAQ v3 API.
