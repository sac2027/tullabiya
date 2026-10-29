# الطلّابية Interactive Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully clickable, bilingual (Arabic RTL first, English LTR), mobile-first front-end prototype of the Deanship of Student Affairs monthly magazine, launching with issue 21, with simulated data behind one replaceable `Api` seam.

**Architecture:** A static-first Astro site with `/ar/` and `/en/` routes. Content (issue 21, events, units, people, polls, hunt) lives in typed, zod-validated JSON with Arabic as the source language and optional English. Interactive parts are Preact islands that talk only to an `Api` interface; the prototype implements it as `LocalApi` (browser storage plus seeded numbers plus simulated live ticks). Personalization (profile, favorites, ordering, gendered Arabic address, share cards) is shared state in nanostores.

**Tech Stack:** Node 22 LTS, Astro (current stable), TypeScript strict, Preact + nanostores, zod, Vitest, Playwright (Chromium) + `@axe-core/playwright`, Pagefind, Python 3 + PyMuPDF (PDF page rendering only).

**Spec:** `docs/superpowers/specs/2026-10-29-tullabiya-design.md` (in the session folder). Visual reference: `work/mockup/index.html` (copied into the repo in Task 0). Read both before starting.

## Global Constraints

- Node 22 LTS; TypeScript `strict`; unit tests in `tests/unit` (Vitest), end-to-end in `tests/e2e` (Playwright, Chromium, projects `desktop` 1440x900 and `mobile` 390x844). `npm run check` runs type check, unit and e2e and must pass before every commit.
- Arabic is the source language. English is optional per field (`Localized.en`); a missing English value falls back to Arabic and the UI shows a "not translated" note. Machine-made English is marked `enStatus: 'machine'`.
- Primary layout is 390px wide; every touch target is at least 44x44px.
- Every heading (`h1` to `h3`) fits in two lines or fewer at 390px and at 1440px, in both languages. Each page has exactly one `h1`.
- Banned in CSS/markup: gradients, `backdrop-filter`, glass panels, eyebrow labels above headings, tiny tracked uppercase labels, monospace text, icon-topped feature cards, 1px divider lines, shadows on resting elements, emoji as UI. Letter-spacing is `0` for Arabic.
- Logical CSS properties only (`inline-start`, `padding-inline`, `inset-inline-*`); physical `left/right` only inside `clip-path` and `transform` with a `[dir=ltr]` counterpart.
- Pages must render readable content without JavaScript. Islands use `client:visible` or `client:idle`.
- The prototype makes no network requests except static assets. All state goes through `Api`; nothing else touches `localStorage`.
- Colors and fonts exactly as the spec's constraints (brand hexes, KFUPM Display, IBM Plex Sans Arabic); Green `#009767` is never used for body-size text.
- Motion: transform and opacity only; honor `prefers-reduced-motion` (no travel, no bar-growth animation).
- Sample or invented content (polls, riddle, perks, interactions) is allowed only because the site shows one banner saying so. Never invent proof such as quotes, counts of real people or press.
- Commit messages are conventional (`feat:`, `test:`, `chore:`) and end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

Failure modes the spec implies but no feature task names; each has a test in the task that owns the code.
1. Display names that break the hero or avatar: 60-character names, a single letter, Arabic mixed with Latin, emoji, only spaces. Expect: hero `h1` stays within two lines, avatar shows a correct first character, no horizontal scroll at 390px. (Task 7)
2. Arabic riddle answers typed the way people type: with diacritics, tatweel, alef/ya/ta-marbuta variants, Arabic-Indic digits, extra spaces, mixed case Latin. Expect: a correct answer is accepted however it is typed. (Task 11)
3. Calendar files with Arabic text: lines folded in the middle of a multi-byte character, unescaped commas, wrong all-day end date. Expect: Apple, Google and Outlook import the event once, on the right day, with readable text. (Task 5)
4. Poll integrity and privacy: voting twice (reload, second tab), zero votes, percentages that add up to 99 or 101, breakdowns that identify individuals in tiny colleges. Expect: one vote per user, no NaN, totals of exactly 100, breakdown hidden below 20 votes. (Tasks 6 and 10)
5. Language and storage resilience: switching language mid-article, a story with no English text, plural phrases at 0, 1, 2, 3-10, 11+, and browsers where storage throws (private mode). Expect: same page in the other language, honest fallback, correct Arabic plurals, and a working page. (Tasks 2 and 6)

---

## File Structure

Repo root `tullabiya/` (default: a new folder inside the folder the owner chooses for this work).

```
tullabiya/
  astro.config.mjs  tsconfig.json  vitest.config.ts  playwright.config.ts  package.json
  public/fonts/                 KFUPM-{Regular,Bold,Black}.ttf, IBMPlexSansArabic-{Light,Regular,Medium,Bold}.ttf, OFL-IBMPlex.txt
  public/archive/NN/            cover.jpg, p01.jpg…, issue.pdf   (generated, Task 15)
  docs/reference/mockup/        copy of work/mockup (visual reference only)
  scripts/                      render_pages.py, ingest_archive.py, archive-sources.json, check-budget.mjs
  src/styles/                   tokens.css fonts.css base.css fast.css
  src/i18n/                     index.ts ui.ar.json ui.en.json
  src/lib/                      model.ts contrast.ts name.ts personalization.ts ics.ts calendarLinks.ts entities.ts
                                strip.ts poll.ts hunt.ts fingerprint.ts progress.ts shareCard.ts sanitize.ts calendarGrid.ts
  src/lib/api/                  Api.ts LocalApi.ts storage.ts index.ts
  src/lib/store.ts              nanostores atoms
  src/content/                  config.ts issues/21.json stories/*.json events.json units.json people.json qa.json polls.json hunts.json archive.json community.json
  src/layouts/Base.astro
  src/components/               TopBar Hero FavoritesBand NewsBlock VoicesBlock OpportunitiesBlock Footer EndOfIssue (.astro)
  src/components/islands/       LangSwitch ProfileChip Onboarding EntityChip AddToCalendar MonthStrip PulsePoll SeriousPoll HuntBlock
                                QaDeck Reactions SubmitBox ShareQuote ReadingProgress CalendarView OpportunityRow PageViewer SearchBox MyCorner (.tsx)
  src/pages/index.astro         redirect to saved or default language
  src/pages/[lang]/             index, calendar, opportunities, community, my, archive/index, archive/[n], issue/[n]/[slug] (.astro)
  src/pages/calendar/[lang].ics.ts
  tests/unit/  tests/e2e/
```

Assets for issue 21 photos live in `src/assets/issue21/` (cover, orient-expo, orient-booth, orient-chess, council, murshid, musab, kfupm-sign), copied from `work/mockup/img/`.

---

### Task 0: Toolchain, scaffold, assets

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `src/pages/index.astro`, `src/pages/[lang]/index.astro`, `src/layouts/Base.astro` (stub), `tests/e2e/smoke.spec.ts`
- Copy: fonts to `public/fonts/`, `work/mockup` to `docs/reference/mockup/`, mockup photos to `src/assets/issue21/`

**Interfaces:**
- Produces: `npm run check`, `npm run dev`, `npm run build`, `npm run preview`; routes `/ar/` and `/en/` with `<html lang dir>`.

- [ ] **Step 1: Install Node 22 LTS.** Ask the owner to approve `winget install OpenJS.NodeJS.LTS`, reopen the shell, run `node -v` (expect `v22.x`) and `npm -v`.
- [ ] **Step 2: Scaffold.** `npm create astro@latest tullabiya -- --template minimal --typescript strict --no-git --install`; then `npm i preact @astrojs/preact nanostores @nanostores/preact zod` and `npm i -D vitest @playwright/test @axe-core/playwright pagefind` and `npx playwright install chromium`; `git init`. Pin exact versions in `package.json`.
- [ ] **Step 3: Copy assets** as listed above. Keep file names.
- [ ] **Step 4: Write the failing test** `tests/e2e/smoke.spec.ts`:

```ts
test('root redirects to /ar/ and the page is RTL Arabic', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/ar\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
test('/en/ is LTR English', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});
```

- [ ] **Step 5: Run** `npx playwright test tests/e2e/smoke.spec.ts` (webServer = `npm run dev`). Expected: FAIL.
- [ ] **Step 6: Implement** Astro i18n config (`defaultLocale: 'ar'`, `locales: ['ar','en']`, `prefixDefaultLocale: true`); `[lang]/index.astro` with `getStaticPaths` for both languages and `Base.astro` setting `lang`/`dir`; `index.astro` redirects client-side to the saved language (`lang` key via Task 2 later) else `/ar/`, with a `<noscript>` link. Add `"check": "astro check && vitest run && playwright test"`. Run the smoke test: PASS.
- [ ] **Step 7: Commit** `chore: scaffold Astro prototype with Arabic/English routes`.

---

### Task 1: Tokens, fonts, base layout, theme

**Files:**
- Create: `src/styles/{tokens,fonts,base,fast}.css`, `src/lib/contrast.ts`, `tests/unit/contrast.test.ts`, `tests/e2e/theme.spec.ts`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Produces: CSS variables `--turq --green --beige --sand --yellow --blue --paper --ink --eng --comp --biz --dbe --chem --pet --gen --me --bg --bg2 --fg --fg2 --quiet`; `[data-theme=dark]` overrides; `contrastRatio(a: string, b: string): number` (hex in, WCAG ratio out); `.fast-photo`, `.fast-label`, `.fast-bar` classes (slanted shapes with `[dir=ltr]` mirrors); `Base.astro` props `{ lang: Lang; title: string }`.

- [ ] **Step 1: Failing test** `contrast.test.ts` asserting `contrastRatio` for the pairs the site uses: ink on paper >= 7; turquoise on paper >= 4.5; beige on turquoise >= 4.5; ink on yellow >= 4.5; ink on beige >= 4.5; beige on dark ground `#0A2F33` >= 4.5; and that `contrastRatio('#009767','#ECE0C7') < 4.5` (documents why green never carries body text). Also a test reading `tokens.css` and asserting every hex used in a `--*` token appears in the spec's brand list or the three derived values.
- [ ] **Step 2: Run** `npx vitest run tests/unit/contrast.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `contrastRatio` in `src/lib/contrast.ts` (relative luminance per WCAG 2.1) and the token/font/base CSS, porting values and rules from `docs/reference/mockup/index.html`. `Base.astro` preloads `KFUPM-Black.ttf` and `IBMPlexSansArabic-Regular.ttf`, and has an inline pre-paint script that reads `theme` inside try/catch and sets `data-theme`.
- [ ] **Step 4: Run** the unit test: PASS.
- [ ] **Step 5: E2E** `theme.spec.ts`: toggling the theme sets `data-theme=dark`, survives reload, and with storage blocked (`context.addInitScript` making `localStorage` throw) the page still loads in light theme; `document.fonts` reports KFUPM Display weight 900 as loaded on `/ar/`. Implement the toggle button in `TopBar` stub. Run: PASS.
- [ ] **Step 6: Commit** `feat: brand tokens, fonts, theme toggle`.

---

### Task 2: i18n core and language switch

**Files:**
- Create: `src/lib/model.ts`, `src/i18n/{index.ts,ui.ar.json,ui.en.json}`, `src/components/islands/LangSwitch.tsx`, `tests/unit/i18n.test.ts`, `tests/e2e/lang.spec.ts`

**Interfaces:**
- Produces in `model.ts`: `type Lang = 'ar'|'en'`; `type Localized = { ar: string; en?: string; enStatus?: 'machine'|'reviewed' }`; `type CollegeId = 'eng'|'comp'|'biz'|'dbe'|'chem'|'pet'|'gen'`; `type SectionId = 'news'|'guest'|'experience'|'contributions'|'last'`; `interface Profile { name: string; college: CollegeId; address: 'neutral'|'m'|'f'; avatar?: string }`; `interface Favorites { sections: SectionId[]; units: string[] }`.
- Produces in `i18n/index.ts`: `t(lang: Lang, key: UiKey, params?: Record<string, string|number>): string` (selects key variants `.m/.f/.n` when `params.address` is set); `plural(lang: Lang, n: number, forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }): string`; `formatDate(lang: Lang, isoDate: string, opts?: { weekday?: boolean; hijri?: boolean }): string` (Latin digits, Gregorian unless `hijri`); `localized(v: Localized, lang: Lang): { text: string; fallback: boolean }`; `switchPath(pathname: string, to: Lang): string`; `UiKey` derived from `ui.ar.json`.

- [ ] **Step 1: Write failing tests** in `i18n.test.ts`: `plural('ar', n, forms)` selects `zero, one, two, few, few, many, other` for n = 0, 1, 2, 5, 10, 11, 100; `plural('en', 1, ...)` is `one` and 2 is `other`; `formatDate('ar','2026-09-15',{weekday:true})` contains `الثلاثاء`, `15` and `2026` and no Arabic-Indic digits; with `{hijri:true}` it contains an Arabic-Indic or Latin year starting `14`; `localized({ar:'مرحبا'}, 'en')` returns `{text:'مرحبا', fallback:true}`; `switchPath('/ar/archive/21','en') === '/en/archive/21'` and `switchPath('/en/','ar') === '/ar/'`; `ui.ar.json` and `ui.en.json` have identical key sets; `t` throws on an unknown key.
- [ ] **Step 2: Run** `npx vitest run tests/unit/i18n.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the signatures above with `Intl.PluralRules`, `Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory' | 'en-GB')` and `ar-SA-u-ca-islamic-umalqura` for Hijri. Seed `ui.*.json` with every string the mockup uses (use the mockup's Arabic and English).
- [ ] **Step 4: Run** the unit test: PASS.
- [ ] **Step 5: E2E** `lang.spec.ts`: from `/ar/issue/21#guest` the switch lands on `/en/issue/21#guest`; the choice is remembered (visiting `/` afterwards goes to `/en/`); with storage blocked the switch still works and `/` falls back to `/ar/`. Implement `LangSwitch` (a plain link built with `switchPath`, plus a `lang` write through `storage.ts` once Task 6 exists; until then a local safe-storage helper that Task 6 replaces). Run: PASS.
- [ ] **Step 6: Commit** `feat: i18n core with Arabic plurals, dates and language switch`.

---

### Task 3: Content model and issue 21 content

**Files:**
- Create: `src/content/config.ts`, `src/content/issues/21.json`, `src/content/stories/21-*.json`, `src/content/{events,units,people,qa,polls,hunts,community}.json`, `scripts/render_pages.py`, `tests/unit/content.test.ts`
- Modify: `src/lib/model.ts` (add content types)

**Interfaces:**
- Consumes: `Localized`, `CollegeId`, `SectionId`.
- Produces: types `Story { id; issue:number; section: SectionId; title: Localized; summary: Localized; body?: { ar: string[]; en?: string[] }; authorId?: string; unitIds: string[]; photo?: string; pdfPage: number; readingMinutes: number }`, `EventItem { id; title: Localized; description: Localized; start: string; end?: string; allDay: boolean; colleges: CollegeId[] | 'all'; unitId: string; kind: 'career'|'culture'|'national'|'conference'|'competition' }`, `Unit { id; name: Localized; email?: string }`, `Person { id; name: Localized; role: Localized; college?: CollegeId; contactable: boolean }`, `QaItem { id; guestId: string; q: Localized; a: Localized }`; `loadAll(): ContentBundle` in `src/content/index.ts`; `scripts/render_pages.py <pdf> <outdir> --dpi 110` writes `cover.jpg`, `p01.jpg…` and prints the page count.

- [ ] **Step 1: Failing test** `content.test.ts`: every JSON file parses with its zod schema; every `story.section` is a `SectionId`; every `authorId` and `unitIds` entry resolves; all events fall in 2026-09 (`2026-09-01` to `2026-09-30`); the events list contains exactly these dates/titles: 1 Career Talks, 1–2 SRC 2026 conference, 13 The Stage @ KFUPM, 15 BCG on Campus, 23 Khaleeji 27 opening, 23 Saudi National Day (عزنا بطبعنا), 29 Career Talks; BCG is all-day on `2026-09-15` (a Tuesday); every `en` value has `enStatus` set; story ids are unique.
- [ ] **Step 2: Run** `npx vitest run tests/unit/content.test.ts`. Expected: FAIL.
- [ ] **Step 3: Author content** from `الطلابية-21.pdf` (read the page images, not the garbled text layer): the 6 stories visible in the mockup plus the Guest of the 30th Q&A (4 pairs in the mockup), the caption-contest call and the نوافذ column as summaries; authors and guest as `people.json`; units: Deanship of Student Affairs, Student Recruitment & Training, Murshid program, Student Advisory Council (email `dsa-mag@kfupm.edu.sa` on the Deanship). Write English for every field and mark `enStatus: 'machine'`. `polls.json`: tea-or-coffee (options tea, coffee) and the 24-hour library serious poll; `hunts.json`: the September hunt (3 clues, answer variants, `closesAt: 2026-09-20T23:59:00+03:00`, perk "coffee on the Deanship"). All three are labelled sample in a `sample: true` field.
- [ ] **Step 4: Implement** zod schemas in `config.ts`, `loadAll()`, and `scripts/render_pages.py` (PyMuPDF `get_pixmap(dpi=...)`, JPEG). Run it on the issue 21 PDF into `public/archive/21/`; expected output prints `8`.
- [ ] **Step 5: Run** the unit test: PASS.
- [ ] **Step 6: Commit** `feat: typed content for issue 21`.

---

### Task 4: Entity chips and contact actions

**Files:**
- Create: `src/lib/entities.ts`, `src/components/islands/EntityChip.tsx`, `tests/unit/entities.test.ts`, `tests/e2e/entity-chip.spec.ts`

**Interfaces:**
- Consumes: `ContentBundle` (Task 3), `Profile`.
- Produces: `type EntityRef = { kind: 'person'|'unit'|'event'|'place'; id: string }`; `type EntityAction = { id: 'email'|'relay'|'calendar'|'remind'|'register'|'open'; label: Localized; href?: string }`; `actionsFor(ref: EntityRef, bundle: ContentBundle): EntityAction[]`; `<EntityChip ref lang />`.

- [ ] **Step 1: Failing tests** `entities.test.ts`: a contactable person returns `['relay','open']`; a non-contactable person returns `['open']`; a unit with email returns `email` first and its `href` is `mailto:dsa-mag@kfupm.edu.sa?subject=` followed by an encoded subject; an event returns `calendar, remind, register`; unknown id throws.
- [ ] **Step 2: Run** `npx vitest run tests/unit/entities.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `actionsFor`; `EntityChip` is a button that opens a popover (`role="dialog"`, labelled), closes on `Escape` and outside tap, returns focus to the chip, and renders the actions. The relay action opens a `SubmitBox` (Task 12) of kind `contact`; until then it renders a placeholder link.
- [ ] **Step 4: Run** unit test: PASS.
- [ ] **Step 5: E2E** `entity-chip.spec.ts` on a story page with a chip: opening shows actions; `Escape` closes and focus is back on the chip; at 390px the popover stays within the viewport (bounding box inside).
- [ ] **Step 6: Commit** `feat: actionable entity chips`.

---

### Task 5: Calendar files, links and subscribe feed

**Files:**
- Create: `src/lib/ics.ts`, `src/lib/calendarLinks.ts`, `src/components/islands/AddToCalendar.tsx`, `src/pages/calendar/[lang].ics.ts`, `tests/unit/ics.test.ts`

**Interfaces:**
- Consumes: `EventItem`, `Lang`.
- Produces: `type IcsEvent = { uid: string; title: Localized; description?: Localized; start: string; end?: string; allDay: boolean; tz?: 'Asia/Riyadh'; url?: string }`; `toIcsEvent(e: EventItem): IcsEvent`; `escapeText(s: string): string`; `foldLine(line: string): string` (CRLF + space continuation at 75 octets, never inside a UTF-8 sequence); `buildIcs(events: IcsEvent[], lang: Lang, opts?: { calName?: string }): string`; `googleUrl(e: IcsEvent, lang: Lang): string`; `outlookUrl(e: IcsEvent, lang: Lang): string`; `<AddToCalendar event lang />` (Apple/ICS download, Google, Outlook).

- [ ] **Step 1: Failing tests** in `ics.test.ts`: `folds a 200-character Arabic title so every physical line is at most 75 bytes, unfolding restores the title, and no line decodes with U+FFFD`; `escapes commas, semicolons, backslashes and newlines`; `all-day one-day event: DTSTART;VALUE=DATE:20260915 and DTEND;VALUE=DATE:20260916`; `two-day SRC 2026-09-01..2026-09-02 ends 20260903`; `timed event has TZID=Asia/Riyadh and a VTIMEZONE with offset +0300`; `uses CRLF and ends with END:VCALENDAR\r\n`; `UID is identical across two calls`; `summary follows the requested language and falls back to Arabic`; `googleUrl for the BCG event contains dates=20260915/20260916 and an encoded text parameter`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/ics.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** per RFC 5545; fold using `TextEncoder` and walk code points. `[lang].ics.ts` is a static endpoint (`getStaticPaths` for both languages) that emits one VCALENDAR with all events of the loaded content and `X-WR-CALNAME`.
- [ ] **Step 4: Run** unit tests: PASS.
- [ ] **Step 5: Verify build output:** `npm run build` then check `dist/calendar/ar.ics` contains seven `BEGIN:VEVENT`. Expected: count 7.
- [ ] **Step 6: Commit** `feat: ICS generation, calendar links and feed`.

---

### Task 6: Api seam, LocalApi and shared stores

**Files:**
- Create: `src/lib/api/{Api.ts,LocalApi.ts,storage.ts,index.ts}`, `src/lib/poll.ts`, `src/lib/progress.ts`, `src/lib/store.ts`, `tests/unit/api.contract.test.ts`, `tests/unit/poll.test.ts`
- Modify: `src/components/islands/LangSwitch.tsx` (use `storage.ts`)

**Interfaces:**
- Produces: `interface Api` with `getProfile(): Promise<Profile|null>`, `saveProfile(p: Profile): Promise<void>`, `clearProfile(): Promise<void>`, `getFavorites(): Promise<Favorites>`, `saveFavorites(f: Favorites): Promise<void>`, `getProgress(issue: number): Promise<IssueProgress>`, `markProgress(issue: number, patch: Partial<IssueProgress>): Promise<IssueProgress>`, `getPoll(id: string): Promise<PollState>`, `vote(id: string, optionId: string): Promise<PollState>`, `subscribePoll(id: string, cb: (s: PollState) => void): () => void`, `getHunt(id: string): Promise<HuntState>`, `submitHuntAnswer(id: string, text: string): Promise<HuntResult>`, `getReactions(storyId: string): Promise<ReactionState>`, `toggleReaction(storyId: string, kind: ReactionKind): Promise<ReactionState>`, `submitUserContent(kind: SubmissionKind, text: string, ref?: string): Promise<Submission>`, `listMySubmissions(): Promise<Submission[]>`, `upvoteQuestion(id: string): Promise<{ count: number; mine: boolean }>`, `getRegistrations(): Promise<string[]>`, `toggleRegistration(eventId: string): Promise<string[]>`, `getSaved(): Promise<string[]>`, `toggleSaved(storyId: string): Promise<string[]>`.
- Types: `IssueProgress { issue: number; sectionsRead: SectionId[]; voted: boolean; huntAttempted: boolean }`; `PollState { id: string; total: number; options: { id: string; count: number; pct: number }[]; myVote?: string; byCollege?: Partial<Record<CollegeId, { n: number; pct: Record<string, number> }> > }`; `HuntState { id: string; closesAt: string; attemptsLeft: number; clueIndex: number; takenSeats: number; solved?: { rank: number | null; seat: 'first'|'draw'|'none'; code: string } }`; `HuntResult { ok: boolean; reason?: 'wrong'|'closed'|'rate-limited'|'empty'; state: HuntState }`; `ReactionKind = 'useful'|'inspiring'|'metoo'`; `ReactionState { counts: Record<ReactionKind, number>; mine: ReactionKind[] }`; `SubmissionKind = 'guest-answer'|'ask-guest'|'caption'|'kudos'|'pitch'|'contact'|'comment'`; `Submission { id: string; kind: SubmissionKind; text: string; createdAt: string; status: 'pending' }`.
- `createLocalApi(deps?: { storage?: StorageLike; now?: () => number; rng?: () => number }): Api`; `getApi(): Api` (singleton); `safeStorage(): StorageLike` (try/catch, in-memory fallback); `largestRemainder(counts: number[]): number[]` (sums to 100, all zeros for zero total); `breakdownVisible(n: number, k?: number): boolean` (default `k = 20`); `issueState(p: IssueProgress): 'none'|'partial'|'complete'` (complete = all five sections read, voted, hunt attempted); nanostores `$profile`, `$favorites`, `$progress`, `$lang`.

- [ ] **Step 1: Failing tests.** `poll.test.ts`: `largestRemainder([1,1,1])` sums to 100; `[58,42]` returns `[58,42]`; `[0,0]` returns `[0,0]`; `breakdownVisible(19) === false`, `breakdownVisible(20) === true`. `api.contract.test.ts` (run against `createLocalApi` with a fake clock and seeded rng, written to be reusable for a future HTTP implementation): `vote is idempotent per user: a second vote returns the same state and does not increment`; `a second api instance sharing the same storage sees the earlier vote`; `getPoll with zero seeded votes returns pct 0, never NaN`; `byCollege is omitted for a college with fewer than 20 votes`; `submitUserContent returns status pending and the text never appears in any public list`; `listMySubmissions returns only the caller's items`; `all calls work when storage throws on every access`; `subscribePoll calls back on ticks and stops after unsubscribe`; `markProgress merges sectionsRead without duplicates`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/poll.test.ts tests/unit/api.contract.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `LocalApi` persists under one `tullabiya:v1` key per concern, seeds poll counts from `polls.json` (tea 58% of 1,200, coffee 42%), simulates live ticks (a timer adding 0 to 3 votes every 4 seconds to the seeded total only while subscribed), and enforces the 20-vote rule inside `getPoll`/`vote`. Hunt and reaction methods get stub bodies that throw `not implemented` until Tasks 11 and 12 replace them; their contract tests are added in those tasks.
- [ ] **Step 4: Run** tests: PASS.
- [ ] **Step 5: Commit** `feat: Api seam with simulated LocalApi and shared stores`.

---

### Task 7: Personalization (profile, favorites, ordering, onboarding)

**Files:**
- Create: `src/lib/name.ts`, `src/lib/personalization.ts`, `src/components/islands/{ProfileChip,Onboarding}.tsx`, `tests/unit/name.test.ts`, `tests/unit/personalization.test.ts`, `tests/e2e/personalization.spec.ts`
- Modify: `src/i18n/ui.*.json` (gendered variants), `src/components/TopBar.astro`

**Interfaces:**
- Consumes: `Profile`, `Favorites`, `$profile`, `$favorites`, `getApi()`.
- Produces: `initial(name: string): string` (first grapheme via `Intl.Segmenter`, Latin uppercased, `''` for blank); `displayName(name: string, maxGraphemes?: number): string` (first word; if longer than `maxGraphemes` default 14, truncated at a grapheme with `…`); `dirFor(name: string): 'rtl'|'ltr'`; `resizeAvatar(file: File): Promise<string>` (256x256 square JPEG data URL; rejects non-images and files over 8 MB); `orderForYou<T extends { section: SectionId; colleges?: CollegeId[] | 'all' }>(items: T[], profile: Profile | null, favs: Favorites): T[]` (stable: pinned sections, then items targeting the profile's college, then the rest); `isForMyCollege(item: { colleges?: CollegeId[] | 'all' }, profile: Profile | null): boolean` (false for `'all'` and for no profile).
- UI keys: `end.caughtUp.m/.f/.n`, `hunt.progress.m/.f/.n`, `hero.sub` take `{ name, college, count, address }`.

- [ ] **Step 1: Failing tests.** `name.test.ts`: `initial('عبدالله') === 'ع'`; `initial('a') === 'A'`; `initial('👩‍💻 Sara') === '👩‍💻'`; `initial('   ') === ''`; `displayName('عبدالعزيز بن عبدالرحمن الفلاني') === 'عبدالعزيز'`; a single 40-letter word returns 14 graphemes plus `…`; `dirFor('Sara') === 'ltr'` and `dirFor('ريم') === 'rtl'`. `personalization.test.ts`: `orderForYou` puts pinned `guest` first, then college-targeted, preserves original order within groups, returns the input order when profile is null, ignores `'all'`; `t('ar','end.caughtUp.f',…)` output contains `وصلتِ`, the `.m` variant contains `وصلتَ`, and the `.n` variant contains neither of those verbs.
- [ ] **Step 2: Run** `npx vitest run tests/unit/name.test.ts tests/unit/personalization.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the signatures. `Onboarding` is a skippable bottom sheet (name, college from the 7 brand colleges with their colors, address preference "male / female / neutral" worded as "how should we address you", up to five pinned sections, optional photo). It opens on first visit when `$profile` is null and can be reopened from `ProfileChip`. `ProfileChip` shows the avatar (photo or initial in the college color with the contrast-correct ink) and `displayName`. A "try as" demo panel (three sample students, as in the mockup) is available only when the URL has `?demo=1`.
- [ ] **Step 4: Run** unit tests: PASS.
- [ ] **Step 5: E2E** `personalization.spec.ts`: first visit shows the sheet; skipping leaves the hero generic; completing with name `عبدالله` shows the name in the hero and the chip, persists across reload, and `My Corner` reset (Task 16) clears it; with a 60-character name and with `A`, `h1` height is at most two line-heights at 390 and 1440 and `document.documentElement.scrollWidth <= innerWidth`; uploading a non-image shows an error and keeps the old avatar.
- [ ] **Step 6: Commit** `feat: personalization with profile, pins and gendered Arabic address`.

---

### Task 8: Home page sections

**Files:**
- Create: `src/components/{TopBar,Hero,FavoritesBand,NewsBlock,VoicesBlock,OpportunitiesBlock,Footer}.astro`, `tests/e2e/home.spec.ts`, `tests/unit/style-rules.test.ts`
- Modify: `src/pages/[lang]/index.astro`, `src/styles/fast.css`

**Interfaces:**
- Consumes: `loadAll()`, `localized()`, `t()`, `EntityChip`, `orderForYou`, `$profile`.
- Produces: the home page composed in the mockup's order (hero, favorites band, month strip slot, pulse slot, news, hunt slot, guest slot, voices, opportunities, archive teaser, end-of-issue slot, footer) with named slots `#month`, `#pulse`, `#hunt`, `#guest`, `#arch` for islands added in later tasks.

- [ ] **Step 1: Failing tests.** `style-rules.test.ts` scans `src/**/*.{css,astro,tsx}` and fails on `gradient(`, `backdrop-filter`, `monospace`, `text-transform: uppercase`, `box-shadow` outside `.popover`/`.dialog`, `border: 1px`, and on physical `margin-left|margin-right|padding-left|padding-right|left:|right:` outside `clip-path`/`transform` lines. `home.spec.ts`, for `ar` and `en` at 390 and 1440: exactly one `h1`; `h1` is at most two lines; no horizontal scroll; every `section` has a heading; every `img` has non-empty `alt`; hero image has `width` and `height`; layout shift after load below 0.05 (PerformanceObserver); with JavaScript disabled the hero text, news and opportunities are present.
- [ ] **Step 2: Run** `npx vitest run tests/unit/style-rules.test.ts` and `npx playwright test tests/e2e/home.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the sections by porting the mockup's markup and CSS to Astro components (static HTML; interactive bits left as slots). Photos come from `src/assets/issue21/` through Astro's image component with explicit sizes. English layout mirrors via logical properties and the `[dir=ltr]` clip-path counterparts in `fast.css`. One top banner states that polls, riddle, perks and personalization names are sample data.
- [ ] **Step 4: Run** both test commands: PASS.
- [ ] **Step 5: Commit** `feat: bilingual home page sections`.

---

### Task 9: Month strip island

**Files:**
- Create: `src/lib/strip.ts`, `src/components/islands/MonthStrip.tsx`, `tests/unit/strip.test.ts`, `tests/e2e/month-strip.spec.ts`
- Modify: `src/pages/[lang]/index.astro` (mount in `#month`)

**Interfaces:**
- Consumes: `EventItem`, `Profile`, `isForMyCollege`, `AddToCalendar`, `EntityChip`.
- Produces: `type StripDay = { day: number; heightPct: number; kind: 'quiet'|'all'|'mine'; events: EventItem[] }`; `buildStrip(events: EventItem[], year: number, month: number, profile: Profile | null): StripDay[]`; `<MonthStrip events today lang />` where `today` is an ISO date (default from `?today=` for demo, else the real date clamped to the issue month).

- [ ] **Step 1: Failing tests** `strip.test.ts`: `buildStrip(events, 2026, 9, null)` has 30 entries; a day with an event is taller than every quiet day; a day with two events is taller than a day with one; the SRC two-day event marks days 1 and 2; with an engineering profile days 1, 15 and 29 are `mine` and day 13 is `all`; with `null` profile no day is `mine`; quiet heights are deterministic across calls.
- [ ] **Step 2: Run** `npx vitest run tests/unit/strip.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `buildStrip` and the island: 30 slanted bars (growth animation once on load, disabled for reduced motion), roving-tabindex keyboard navigation (arrows follow reading direction), a detail panel with the date, organizer, description and actions (`AddToCalendar`, a remind toggle stored via `getApi()`, contact link as an `EntityChip`), a legend using the profile's college color, and an avatar marker on today's bar. On narrow screens the strip scrolls horizontally and starts centered on the selected day.
- [ ] **Step 4: Run** unit test: PASS.
- [ ] **Step 5: E2E** `month-strip.spec.ts`: tapping day 15 shows BCG and the Add-to-calendar download is named `tullabiya-20260915.ics` and contains `BCG`; in `ar` day 1 is right of day 30, in `en` left of it; arrow keys move focus in reading direction; at 390px the selected day is within the scroll container's visible area.
- [ ] **Step 6: Commit** `feat: month strip with calendar actions`.

---

### Task 10: Campus Pulse

**Files:**
- Create: `src/components/islands/{PulsePoll,SeriousPoll}.tsx`, `tests/e2e/pulse.spec.ts`
- Modify: `src/lib/api/LocalApi.ts` (live tick tuning), `src/pages/[lang]/index.astro` (mount in `#pulse`), `src/styles/fast.css` (slanted option bars)

**Interfaces:**
- Consumes: `getApi().getPoll/vote/subscribePoll`, `PollState`, `$profile`, `breakdownVisible`.
- Produces: `<PulsePoll pollId lang />` (vote first, then bars and percentages with the user's college comparison line) and `<SeriousPoll pollId lang />` (yes/no, then "the Deanship answers in the next issue"; renders the answer text when the poll has `answer`).

- [ ] **Step 1: Failing e2e** `pulse.spec.ts`: before voting the poll DOM contains no `%`; after voting for tea percentages appear, sum to 100, and the chosen option has the `aria-pressed`-style marker; reload keeps the result; a second page in the same browser context shows the poll already voted; the comparison line mentions the college breakdown only when the API returns it, otherwise shows the "appears after 20 votes" note; with reduced motion the bars have no transition; the result is announced through an `aria-live` region.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/pulse.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** both islands against `Api` (no direct storage). Option buttons are 44px+ tall. The live subscription starts when the island is visible and stops on unmount.
- [ ] **Step 4: Run** the e2e test: PASS.
- [ ] **Step 5: Commit** `feat: Campus Pulse polls`.

---

### Task 11: The Month's Hunt

**Files:**
- Create: `src/lib/hunt.ts`, `src/components/islands/HuntBlock.tsx`, `tests/unit/hunt.test.ts`, `tests/e2e/hunt.spec.ts`
- Modify: `src/lib/api/LocalApi.ts` (implement `getHunt`, `submitHuntAnswer`), `tests/unit/api.contract.test.ts`, `src/pages/[lang]/index.astro` (mount in `#hunt`)

**Interfaces:**
- Consumes: `HuntState`, `HuntResult`, `$profile`, `displayName` (Task 7) and the gendered `hunt.progress.*` UI keys.
- Produces: `normalizeAnswer(s: string): string`; `type HuntSubmission = { userId: string; at: number; correct: boolean }`; `pickWinners(subs: HuntSubmission[], opts: { firstN: number; randomN: number; rng: () => number }): { first: string[]; random: string[] }`; `<HuntBlock huntId lang />`.

- [ ] **Step 1: Failing tests** `hunt.test.ts`: `normalizeAnswer('الأَحْرُفُ') === 'الاحرف'`; `'مكتبـــة' → 'مكتبه'`; `'إِلى' → 'الي'`; `'٢٠٢٦' → '2026'`; `'KFUPM  ' === 'kfupm'`; punctuation `،؟!.,?` removed. `pickWinners` with 20 correct submissions: `first` is the 10 earliest `at` (ties by `userId` ascending), `random` is 5 from the rest, no id in both lists; with 12 correct: 10 first and 2 random; with 3 correct: 3 first and none random; wrong submissions never win; a user's later duplicate is ignored; the same rng seed returns the same winners. Contract additions: a correct answer typed with diacritics is accepted; a fifth wrong attempt in an hour returns `rate-limited`; a submission after `closesAt` returns `closed`; an empty string returns `empty` and does not consume an attempt.
- [ ] **Step 2: Run** `npx vitest run tests/unit/hunt.test.ts tests/unit/api.contract.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `normalizeAnswer`: strip U+064B–U+065F and U+0670, remove U+0640, map `أإآٱ→ا`, `ى→ي`, `ة→ه`, Arabic-Indic digits to Latin, lowercase, drop punctuation, collapse whitespace, trim. `LocalApi` accepts an answer if its normalization equals a normalized `answers` variant, assigns a rank among seeded earlier solvers (seeded 7 of the first 10 taken), grants a one-time code `KFUPM-` plus four letters shown on solve and re-revealable. `HuntBlock` shows the three clue bars, the riddle, the clue photo (cropped so the answer is not legible), seats, countdown computed from `closesAt` and the personalized progress line from the gendered `hunt.progress.*` keys.
- [ ] **Step 4: Run** unit tests: PASS.
- [ ] **Step 5: E2E** `hunt.spec.ts`: wrong answer shows a retry message; a correct answer typed with diacritics shows the code and seat; the code is still shown after reload; after `closesAt` (`?now=` demo override) the form is replaced by a closed message.
- [ ] **Step 6: Commit** `feat: Month's Hunt with Arabic-aware answers and fair winners`.

---

### Task 12: Guest deck, reactions and submissions

**Files:**
- Create: `src/lib/sanitize.ts`, `src/components/islands/{QaDeck,Reactions,SubmitBox}.tsx`, `tests/unit/sanitize.test.ts`, `tests/e2e/engage.spec.ts`
- Modify: `src/lib/api/LocalApi.ts` (implement reactions, `submitUserContent`, `listMySubmissions`, `upvoteQuestion`), `tests/unit/api.contract.test.ts`, `src/pages/[lang]/index.astro` (mount in `#guest` and voices)

**Interfaces:**
- Produces: `sanitizeText(input: string, maxGraphemes?: number): string` (strip HTML tags, collapse whitespace, trim, cap at 280 graphemes); `<QaDeck items lang />`; `<Reactions storyId lang />` (useful, inspiring, "me too"); `<SubmitBox kind: SubmissionKind refId?: string lang />` (empty input rejected, shows a pending note with the reference id).

- [ ] **Step 1: Failing tests.** `sanitize.test.ts`: `<b>hi</b>` becomes `hi`; `<script>alert(1)</script>x` becomes `x` with no script text executed; repeated whitespace collapses; 300 graphemes are cut to 280 without splitting a combined character. Contract additions: `toggleReaction` twice returns the original count; `mine` lists only the caller's reactions; `upvoteQuestion` twice for the same question leaves count unchanged.
- [ ] **Step 2: Run** `npx vitest run tests/unit/sanitize.test.ts tests/unit/api.contract.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the three islands and API methods. The deck supports buttons, swipe and arrow keys where the arrow for "next" follows reading direction. The user's own submission text is shown back only as "Pending review", never as published content.
- [ ] **Step 4: Run** unit tests: PASS.
- [ ] **Step 5: E2E** `engage.spec.ts`: in `ar`, `ArrowLeft` advances the deck and in `en` `ArrowRight` does; submitting "وأنت؟" text shows the pending note with an id; submitting an empty box shows an error and no id; a reaction toggles `aria-pressed` and persists across reload.
- [ ] **Step 6: Commit** `feat: guest deck, reactions and moderated submissions`.

---

### Task 13: Story pages and personal share cards

**Files:**
- Create: `src/pages/[lang]/issue/[n]/[slug].astro`, `src/lib/shareCard.ts`, `src/components/islands/{ShareQuote,ReadingProgress}.tsx`, `tests/e2e/story.spec.ts`

**Interfaces:**
- Consumes: `Story`, `markProgress`, `$profile`, `Reactions`, `EntityChip`, `getApi().toggleSaved`.
- Produces: `renderShareCard(opts: { kind: 'quote'|'cover'; quote?: string; source: string; lang: Lang; profile?: Profile; coverUrl?: string }): Promise<{ blob: Blob; meta: { width: 1080; height: 1350; personalized: boolean } }>`; `<ShareQuote storyId lang />` (select text, share or download); `<ReadingProgress storyId lang />` (`role="progressbar"`).

- [ ] **Step 1: Failing e2e** `story.spec.ts`: scrolling a story to the end marks its section read and the home progress line increases; selecting a sentence shows a share button; `renderShareCard` (called through `page.evaluate`) returns a PNG of 1080x1350 with `personalized: true` when a profile exists and `false` otherwise; when `navigator.share` is undefined the share button downloads a PNG; stories without English text show the Arabic body with a "not translated" note in `en`; a story page contains the printed-page image (`pdfPage`) under "read as printed".
- [ ] **Step 2: Run** `npx playwright test tests/e2e/story.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the page template (title, byline as `EntityChip`, reading time via `plural`, body or summary, printed-page image, reactions, save-for-later, listen button hidden when `speechSynthesis` is unavailable) and `renderShareCard` (awaits `document.fonts.load` for KFUPM Display and Plex, draws with `ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'`, uses the FAST container crop for the `cover` kind, the avatar when present, and the name as "for {name}").
- [ ] **Step 4: Run** the e2e test: PASS.
- [ ] **Step 5: Commit** `feat: story pages with personal share cards`.

---

### Task 14: Calendar and Opportunities pages

**Files:**
- Create: `src/lib/calendarGrid.ts`, `src/components/islands/{CalendarView,OpportunityRow}.tsx`, `src/pages/[lang]/{calendar,opportunities}.astro`, `tests/unit/calendarGrid.test.ts`, `tests/e2e/calendar.spec.ts`

**Interfaces:**
- Consumes: `EventItem`, `AddToCalendar`, `getApi().getRegistrations/toggleRegistration`, `buildIcs`.
- Produces: `buildMonthGrid(year: number, month: number, opts?: { weekStart?: 0|6 }): (number | null)[][]` (default week starts Sunday); `daysUntil(isoDate: string, now: Date): number`.

- [ ] **Step 1: Failing tests** `calendarGrid.test.ts`: September 2026 grid has 5 rows, first row has `null` for Sunday and Monday and `1` under Tuesday; `weekStart: 6` shifts the columns; `daysUntil('2026-09-15', new Date('2026-09-12T10:00:00+03:00')) === 3`; past dates return negative numbers.
- [ ] **Step 2: Run** `npx vitest run tests/unit/calendarGrid.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the pure functions, the month grid with list view and filters (college, kind), the subscribe block (`webcal://` link to `/calendar/{lang}.ics` and a download) with "add all events", and opportunity rows (register toggle, add to calendar, ask the organizer via `EntityChip`, days-left text via `plural`).
- [ ] **Step 4: Run** unit test: PASS.
- [ ] **Step 5: E2E** `calendar.spec.ts`: filtering by Engineering reduces the event count; register toggles persist after reload; "add all" downloads an ICS with seven `BEGIN:VEVENT`; the opportunities page shows "3 days left" for BCG when `?now=2026-09-12`.
- [ ] **Step 6: Commit** `feat: calendar and opportunities pages`.

---

### Task 15: Archive, viewer and search

**Files:**
- Create: `scripts/ingest_archive.py`, `scripts/archive-sources.json`, `src/lib/fingerprint.ts`, `src/components/islands/{PageViewer,SearchBox}.tsx`, `src/pages/[lang]/archive/{index,[n]}.astro`, `src/content/archive.json`, `tests/unit/fingerprint.test.ts`, `tests/e2e/archive.spec.ts`
- Modify: `package.json` (`"build": "astro build && pagefind --site dist"`)

**Interfaces:**
- Consumes: `issueState`, `$progress`, `scripts/render_pages.py` (Task 3).
- Produces: `fingerprint(issue: number, bars?: number): number[]` (deterministic heights, each between 18 and 95, default 9 bars); `archive.json` entries `{ number: number; pages: number; month?: string }` for issues 1–22; `<PageViewer issue pages lang />`; `<SearchBox lang />` (dynamic import of `/pagefind/pagefind.js`).

- [ ] **Step 1: Failing tests** `fingerprint.test.ts`: same issue returns the same array; length equals `bars`; every value is within 18–95; issues 20 and 21 differ.
- [ ] **Step 2: Run** `npx vitest run tests/unit/fingerprint.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `fingerprint`. Write `archive-sources.json` with the 22 PDF URLs the owner supplied. `ingest_archive.py` downloads each PDF (ask the owner to approve the 22 downloads first, state total size), runs `render_pages.py`, copies the PDF to `public/archive/NN/issue.pdf`, and writes `archive.json`. Issue 21 uses the local PDF already rendered in Task 3.
- [ ] **Step 4: Pages.** The wall shows 22 fingerprint tiles (lit, partial or dim from `issueState`), an issue page with a swipe and arrow-key page viewer, thumbnails, download link and lazy image loading; no invented dates (show `month` only when present).
- [ ] **Step 5: Search.** Add `data-pagefind-body` to story pages and run the build. `SearchBox` shows results with titles and links and a helpful empty state.
- [ ] **Step 6: E2E** `archive.spec.ts` (against `npm run preview`): 22 tiles; issue 21 viewer navigates pages with arrow keys; searching `الإرشاد` returns the Murshid story; searching a nonsense term shows the empty state; the download link responds with a PDF content type.
- [ ] **Step 7: Run** `npx vitest run tests/unit/fingerprint.test.ts`: PASS, then the e2e test: PASS. If Pagefind returns nothing for Arabic, record the failure and fall back to a simple client-side filter over story titles and summaries without hiding the failure in the report.
- [ ] **Step 8: Commit** `feat: archive wall, page viewer and search`.

---

### Task 16: My Corner and end of issue

**Files:**
- Create: `src/components/islands/MyCorner.tsx`, `src/components/EndOfIssue.astro`, `src/pages/[lang]/my.astro`, `tests/unit/progress.test.ts`, `tests/e2e/my.spec.ts`
- Modify: `src/lib/progress.ts`, `src/pages/[lang]/index.astro` (end slot)

**Interfaces:**
- Produces: `nextIssueDate(issueDate: string): string` (first day of the following month, ISO); `issueState(p: IssueProgress)` (from Task 6); `<MyCorner lang />` (edit profile and photo, pinned sections and units, fingerprint collection, saved stories, notification preferences marked "preview" with WhatsApp channel and X links, export data as JSON, reset everything).

- [ ] **Step 1: Failing tests** `progress.test.ts`: `nextIssueDate('2026-09-01') === '2026-10-01'`; `'2026-12-01' → '2027-01-01'`; `issueState` is `none` with no activity, `partial` with some, `complete` only with all five sections read, voted and hunt attempted.
- [ ] **Step 2: Run** `npx vitest run tests/unit/progress.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the functions, page and the end-of-issue block ("you're caught up", next issue date formatted with `formatDate`, gendered closing line) that appears after all five sections are read.
- [ ] **Step 4: Run** unit test: PASS.
- [ ] **Step 5: E2E** `my.spec.ts`: completing the five sections, a vote and a hunt attempt lights issue 21's tile on the archive wall and shows the end-of-issue block; export downloads valid JSON containing the profile; reset clears profile, pins and progress and the hero is generic again; saved stories list matches saved items.
- [ ] **Step 6: Commit** `feat: My Corner and end-of-issue screen`.

---

### Task 17: Community pages

**Files:**
- Create: `src/pages/[lang]/community.astro`, `tests/e2e/community.spec.ts`
- Modify: `src/content/community.json`, `src/components/islands/SubmitBox.tsx`

**Interfaces:**
- Consumes: `SubmitBox`, `getApi().listMySubmissions/upvoteQuestion`.
- Produces: community hub with write for us (pitch), ask the next guest (seeded approved questions with one upvote each per user), caption contest (the kfupm-sign photo), kudos wall (seeded approved kudos; sending creates a pending submission) and a "my submissions" list showing only pending items.

- [ ] **Step 1: Failing e2e** `community.spec.ts`: upvoting a question once increments it and a second click does not; a pitch submission appears in "my submissions" as pending and never in the public lists; the kudos form rejects empty text; English and Arabic pages both render all four modules.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/community.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the page and seed data (clearly sample).
- [ ] **Step 4: Run** the e2e test: PASS.
- [ ] **Step 5: Commit** `feat: community hub`.

---

### Task 18: Quality sweep and handoff

**Files:**
- Create: `tests/e2e/a11y.spec.ts`, `tests/e2e/keyboard.spec.ts`, `tests/e2e/longtext.spec.ts`, `scripts/check-budget.mjs`, `README.md`, `docs/handoff.md`
- Modify: whatever the failures require

**Interfaces:**
- Consumes: every route above.
- Produces: green `npm run check`; `npm run budget` (fails when home JavaScript exceeds 120 KB gzipped or a hero image exceeds 250 KB); `README.md` (run, structure, content authoring for a new issue, replacing `LocalApi` with a real implementation); `docs/handoff.md` (sample content to replace, derived colors awaiting sign-off, machine-translated English awaiting review, open owner decisions).

- [ ] **Step 1: Write the sweep tests.** `a11y.spec.ts`: axe has zero serious or critical violations on `/`, `/calendar`, `/opportunities`, `/community`, `/my`, `/archive`, `/archive/21`, one story, for `ar` and `en` and both themes. `keyboard.spec.ts`: from the page top, Tab reaches the skip link, nav, profile chip, hero actions, favorites, month strip, poll options, hunt input, deck controls and footer links in reading order with a visible focus ring. `longtext.spec.ts`: with `?longtext=1` (a test-only flag that multiplies every UI string by 1.4) no page has horizontal scroll at 390px and no heading exceeds two lines.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/a11y.spec.ts tests/e2e/keyboard.spec.ts tests/e2e/longtext.spec.ts`. Fix every failure at its source (not by relaxing the tests), re-run until PASS.
- [ ] **Step 3: Budget.** Implement `scripts/check-budget.mjs` reading `dist/`; run `npm run build && npm run budget`. Expected: exit code 0.
- [ ] **Step 4: Worst-case pass.** Run the `anthropic-skills:break-ui` skill against the home page and the story page; fix what breaks.
- [ ] **Step 5: Docs.** Write `README.md` and `docs/handoff.md`.
- [ ] **Step 6: Final run.** `npm run check` all green, then open `npm run preview` in the browser pane at 390px and 1440px in both languages and look at every page.
- [ ] **Step 7: Commit** `chore: quality sweep, budgets and handoff docs`.

---

## Self-Review

- **Spec coverage:** intent, month-strip concept, personalization (Task 7 and 13, 16), Pulse (6, 10), Hunt with first 10 plus random 5 (11), moderation (6, 12, 17), entity actions (4), calendar actions (5, 9, 14), archive and search (15), bilingual and RTL (2, 8), mobile (8, 18), no-JS rendering (8), brand contrast (1). Owner answers on channels (WhatsApp, X, email) appear as the notification preview block in Task 16 and the footer in Task 8; real delivery is out of scope per the spec.
- **Types:** `Profile`, `Favorites`, `SectionId`, `CollegeId`, `Localized` (Task 2); `EventItem`, `Story` (Task 3); `Api`, `PollState`, `HuntState`, `IssueProgress`, `Submission` (Task 6); later tasks use the same names. `HuntSubmission` (Task 11) is the winners-picker input and is kept distinct from `Submission` (moderated user content).
- **Gaps found and fixed:** `enStatus` rule added to the content test; a missing gendered neutral variant added to Task 7; `?now=` and `?today=` demo overrides added so dates are testable.
- **Proportion:** each task gives signatures, test names with exact values and run commands; implementation bodies are left to the implementer except the Arabic normalization rules and the RFC folding constraint, which the tests do not fully determine.
