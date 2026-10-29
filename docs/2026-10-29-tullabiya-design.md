# الطلّابية Interactive: design

Status: written from the Phase 1 strategy and the owner's Phase 2 answers. Needs owner approval before the plan runs. The approach choice in section 5 is the assistant's recommendation; the owner has not picked it.

## 1. Intent

KFUPM's Deanship of Student Affairs publishes a monthly student magazine (الطلّابية, 22 issues so far, 8-page Arabic PDF). Students rarely open a PDF twice. This project replaces it with an official, bilingual (Arabic RTL first, English LTR), mobile-first website that students open every month because it is useful, personal and a little competitive. Issue 21 (September 2026) is the launch content. A new issue publishes on the first day of each month.

Why it should work: every item in the PDF becomes something a student can act on (add to calendar, contact the author or unit, register, vote, solve). The site talks to each student by name, remembers what they pinned, and ends when they are done.

## 2. Goals, non-goals, anti-goals

Goals
- A fully clickable front-end prototype with simulated data that the Deanship council can review on a phone.
- The visual concept in `work/mockup/index.html` (the month as thirty slanted bars, FAST Matrix and Container from the KFUPM brand guide) carried through every page.
- Personalization as a first-class feature: name, photo, college, pinned sections, gendered Arabic address, personal share cards.
- Habit features: Campus Pulse polls, the Month's Hunt (first 10 correct plus 5 random), fingerprint collection in the archive.
- Every entity in an article (person, unit, event, place) is actionable.
- Archive of all 22 issues (cover, pages, PDF download) with search over site content.

Non-goals (this plan)
- No real backend, SSO, email, push or WhatsApp delivery, and no CMS. The code keeps one seam (`Api`) so those can replace the simulation.
- No OCR of the 22 PDFs (Arabic text extraction from the PDFs is unreliable; OCR is a later step).
- No editorial moderation console. All user-submitted content only reaches a "pending" state.
- No campus map and no prayer-times widget.

Anti-goals (a failure even if it works)
- Infinite scroll, loss-aversion streaks, guilt notifications. The issue is finite and ends with a "you're caught up" screen.
- Showing a student's name, photo or answers to anyone else without an explicit opt-in.
- A generic card-grid look. Gradients, glass panels, eyebrow labels, tiny tracked capitals, monospace and icon-topped cards are out.

## 3. Owner decisions (from the Phase 2 answers)

- Launch issue 21; monthly cadence, new issue on the 1st.
- Operated by a Deanship council of employees, advised by students. Authoring must be form-based later (no code).
- Official site with a playful student voice. College accent colors may be used.
- Perks funded by the Deanship; winners: first 10 correct plus 5 random from the remaining correct submitters.
- Everything user-submitted is pre-moderated. Respectful tone only. The Deanship answers the serious poll in the next issue.
- Archive: PDFs only. PDF viewer plus OCR search is the long-term design.
- Audience: 90% mobile; WhatsApp channels and X are the social channels; the university uses email.
- Translation: automatic where possible; otherwise the council publishes immediately in one language. Students are comfortable being contacted.
- Identity and hosting: not for the prototype.

## 4. Constraints

- Brand: palette Turquoise `#115F66`, Green `#009767`, Beige `#ECE0C7`, Sand `#A48A70`, Yellow `#F0BA4F`, Blue `#71B8D4`; college colors Business `#004A81`, Computing & Mathematics `#6BBDBE`, Engineering & Physics `#F58220`, Design & Built Environment `#8D5035`, Chemicals & Materials `#F0BA4F`, Petroleum & Geosciences `#A31F34`, General Studies `#3D3C7F`. Fonts: KFUPM Display (Regular, Bold, Black) and IBM Plex Sans Arabic (OFL; ship `OFL.txt`). Derived colors (paper `#F7F2E6`, ink `#0B3A3F`, dark ground `#0A2F33`) are the assistant's and need sign-off.
- Green `#009767` fails contrast for body text on Beige and Paper; Turquoise carries text, Green carries fills.
- Tone: official brand voice for chrome and news; student voice only in student-authored sections.
- 90% mobile: 390px is the primary layout. Touch targets at least 44px.
- Static-first: pages render without JavaScript; interactive parts are islands.
- Hunt answers, poll votes and user submissions never leave the browser in the prototype.

## 5. Approaches considered

A. Astro (static pages, bilingual routes) with Preact islands, Vitest and Playwright. Recommended. Fast on phones, content in typed files that a CMS can replace, islands only where the page is interactive, first-class i18n routing.
B. Hand-written multi-page HTML/CSS/JS (what the mockup is). Fastest to start, but 10+ bilingual pages, shared state and tests would mean rebuilding templating and routing by hand.
C. A single-page React or Next.js app. Strong for app-like state, but heavier on phones, weaker for the content-first reading experience, and server features are unused here.

## 6. Left to the builder

Exact copy for unauthored UI strings (follow the mockup's voice), English text for issue 21 (mark as machine-translated), spacing details, animation timings within the motion rules, file naming inside the structure given in the plan.
