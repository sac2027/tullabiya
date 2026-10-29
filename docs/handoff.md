# Handoff: what is sample, what needs sign-off, what comes next

## Sample content to replace before launch

- `src/data/polls.json`: the three polls, their questions and every seeded count.
- `src/data/hunts.json`: the September riddle, clues, accepted answers, the "7 of 10 seats taken",
  the prize and the closing date.
- `src/data/community.json`: the four guest questions with their vote counts and the three kudos.
  The three previous captions are real (issue 21, page 7).
- `src/components/islands/ProfileChip.tsx`: the three `?demo=1` students and the reading history that
  lights archive tiles for them.
- Reaction counts are generated from each story id (`LocalApi.seedReactions`).
- `events.json`: the `colleges` targeting of Career Talks and BCG is an editorial guess; the printed
  calendar does not say which colleges each event is for.
- The notification preferences in My Corner are a preview with nothing behind them.

## Decisions awaiting the council

- Derived colors: paper `#F7F2E6`, ink `#0B3A3F`, dark-mode ground `#0A2F33`. Every other color is
  from the brand guide; secondary tones are mixed from brand colors in CSS.
- The college accent colors are used for the reader's own events and the poll breakdown, as agreed.
- The student voice: section names, the hunt copy, the end-of-issue line and the greeting are
  informal by design; news and the Deanship's own lines keep the brand register.
- Every English string in `src/data/**` and `src/i18n/ui.en.json` is marked or should be treated as
  machine-translated until reviewed (`enStatus: "machine"`).

## The prototype clock

`src/lib/clock.ts` pins "today" to 12 September 2026 so the September issue reads as current.
Set `DEMO_TODAY` to `null` for launch; the real date then drives the strip, the opportunities board
and the hunt's closing state.

## Not built (by agreement)

- No backend, SSO, email, push or WhatsApp delivery, no CMS. `Api` is the seam; the contract tests
  are the acceptance tests for the real implementation.
- No OCR of the 22 PDFs. Search covers the site's own stories. OCR of the PDFs and a per-issue
  text index is the next step for archive search.
- `scripts/ingest_archive.py` downloads and renders issues 1–20 and 22 from the Deanship site. It was
  run once on 29 Oct 2026; the files are git-ignored (only issue 21 is committed), so a fresh clone
  runs it again before the archive viewer covers every issue.
- Moderation console. Submissions are stored on the device with status `pending` and are never
  shown publicly; the real backend needs a review queue.
- Campus map, prayer times, per-college feeds beyond event targeting.

## Known limits

- The share card draws text with canvas; Arabic shaping depends on the browser's canvas text
  engine (fine in Chromium, Safari and Firefox).
- `speechSynthesis` Arabic voices depend on the device; the Listen button hides where none exist.
- The e2e suite runs with 3 workers; Chromium's download pipeline is flaky under parallel load, so
  the ICS tests capture the download anchor instead of the OS download.
- Pagefind indexes at build time only; the dev server falls back to a title/summary filter.

## Operations

- Publishing: see README "Publishing a new issue".
- `npm run check` must pass before every release: type check, 120+ unit tests, 130+ e2e tests
  (desktop and phone), axe accessibility sweep, keyboard order, lengthened-text layout, and the
  performance budget (home JS under 120 KB gzipped, hero image under 250 KB).
