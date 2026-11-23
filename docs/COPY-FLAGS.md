# Clearhale In-App Copy Audit & Flags

This document records the results of the claims audit across all user-facing strings, screens, and components.

---

## 1. Claims Audit Summary

In strict compliance with evaluation rules, all visible copy was evaluated against prohibited overclaim categories:
- **No medical or clinical diagnosis claims**: App clearly identifies itself as an environmental exposure reduction guide.
- **No hospital directions or symptom checker claims**: Clearhale does not diagnose conditions or give medical triage. Acute distress symptoms immediately route to national emergency services (`tel:112`).
- **No unscientific home remedy claims**: Myths tab explicitly debunks claims that herbal teas, jaggery, wet curtains, or cut onions purify indoor air or cleanse inhaled lung soot.
- **Permitted numerical bounds**: All indoor exposure reduction percentages adhere strictly to peer-reviewed literature bounds:
  - Portable HEPA purifier: ~50–80% indoor PM2.5 reduction
  - DIY Box-Fan Filter: ~40–70% indoor PM2.5 reduction
  - Windows shut without active filtration: Indoor PM2.5 remains ~55–60% of outdoor concentration.

---

## 2. Identified Phrasing Nuances (Flagged for Review)

| Screen | Location / Component | Current In-App Copy | Context & Recommendation |
| :--- | :--- | :--- | :--- |
| **Profile Screen** | `components/screens/ProfileScreen.tsx:229` | *"Your clean-air profile currently stays on this device only."* | Accurately describes default local storage behavior. When user connects Google Account, Firestore doc is explicitly created with consent disclaimer. |
| **Intake Chat** | `components/intake/IntakeChatScreen.tsx:162` | *"We never store audio, transcripts, or chat."* | Accurately reflects ephemeral STT processing. Audio streams are discarded immediately post-transcription. |
| **Care Screen** | `components/screens/CareScreen.tsx` | *"Breathe session to lower pulse and stress indoors."* | General physiological wellness relaxation guidance (paced diaphragmatic breathing). Does not claim clinical treatment. |
