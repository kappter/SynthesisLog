# Synthesis Log AI - Project TODO

## Core Features
- [x] Database schema for term banks, reflections, and sync metadata
- [x] Backend tRPC procedures for AI chat integration
- [x] Backend procedures for term management and reflections
- [x] Google Sheets integration for term banks sync
- [ ] Google Sheets integration for reflections sync
- [x] Four-stage circular reflection workflow UI
- [x] AI chat interface integrated into each stage form
- [x] Term rotation queue system with day navigation
- [x] CSV upload for custom term lists
- [x] Preset term sets (music-core, feel-good, verbs-motion)
- [x] Progress tracking with visual progress bar
- [x] Date management (start date, end date calculation)
- [x] JSON export/import for local backup
- [x] Dark/light theme toggle
- [ ] Real-time sync status indicators
- [ ] Run summary view with motion highlights
- [x] Vitest tests for core procedures

## Perpetual Spiral Features
- [x] In-app AI chat panels (no page jumping)
- [x] Expanded preset lists (Art, Geography, CS, Physics, Biology, etc.)
- [x] Signature hue for each term list
- [x] Perpetual spiral with seamless list transitions
- [x] Day N-2 transition zone with visual cues
- [x] Color-coded multi-segment progress bar
- [x] Prompt to continue spiral on Day N-2
- [ ] Data sustainability with export warnings at capacity limits

## Multi-Set Selection Features
- [x] Multi-select UI for choosing 2+ lists at outset
- [x] Three-mode selector: Sequential, Shuffled, Blended
- [x] Sequential mode: Terms in original order within each list
- [x] Shuffled mode: Terms randomized within each list separately
- [x] Blended mode: All selected lists shuffled together (interleaved)
- [x] Source list indicator dots on term cards
- [x] Blended mode progress bar with gradient of all hues
- [x] Update "Today's four-term set" to show source lists
- [ ] Vitest tests for multi-set queue logic

## Variable-Depth Reflection System
- [x] Design stage mappings for 2, 3, 4, 5-step models
- [x] Update spiralQueue.ts to support variable depth
- [x] Add reflectionDepth field to database schema
- [x] Create depth selector UI component
- [x] Adapt CircularWorkflow to show 2-5 stages dynamically
- [ ] Update StageForm to handle combined stages (e.g., "History + Concrete/Abstract") - Needs implementation
- [x] Update progress calculations for different depths
- [x] Update transition zone logic (Day N-depth+1)
- [x] Add depth indicator to progress bar
- [ ] Vitest tests for all depth models

## Bug Fixes
- [x] Fix ListSelectorMulti dialog scrolling - Start Spiral button not accessible

## Critical Bugs
- [x] Second stage never becomes active in any depth model (2-5)
- [x] Fifth stage doesn't show up in 5-step mode - FIXED

## New Features
- [x] Add Clear/Reset button in prominent location to reset the entire spiral

## New Bugs to Fix
- [x] "Today's four-term set" always shows "four" instead of correct depth count (2-5)
- [x] AI prompts need more personality and pedagogical depth

## UI Text Updates
- [x] Update tagline to "Multi-stage circular reflection on a rotating term bank"
- [x] Fix summary label in start screen to show correct stage count (2-5) instead of always "four"

## Reflection History Calendar
- [x] Design calendar data structure for tracking reflections by date
- [x] Add backend tRPC procedures for fetching reflection history (using localStorage)
- [x] Create calendar UI component with monthly view
- [x] Add color-coded dots for each list on calendar days
- [x] Implement day detail view for viewing past reflections (click to navigate)
- [x] Add ability to edit past reflections from calendar (navigate and edit)
- [x] Add month navigation (previous/next month)
- [ ] Add filtering by list or date range
- [x] Show reflection completion status (partial vs complete)

## Calendar Improvements
- [x] Make calendar collapsible with header button (collapsed by default)
- [x] Move calendar below stage forms (under prompt area)
- [x] Add interactive day tooltips showing reflection summaries
- [x] Show first 100 characters of each reflection in tooltip

## New Bugs
- [x] "Today's _-term set" showing underscore instead of correct number

## PDF Export Feature
- [x] Design PDF export structure (Motion proposals + statistics)
- [x] Implement backend PDF generation with all Motion proposals
- [x] Add statistics: term count, completion rate, date range
- [x] Create PDF export button in UI
- [x] Test PDF generation and download

## New Bug Reports (Jan 2026)
- [x] "Today's X-term set" displays correct count but lists one extra term - FIXED by filtering to show only non-null active stages
- [x] Rename 'fourTermSet' variable to 'activeTermSet' for clarity - COMPLETED across all components
- [x] AI Assistant panel closes/resets after saving reflections - FIXED by using stable ID based on currentDay

## Printable Worksheet Feature
- [x] Create PrintableWorksheet component with planner size options (A5, A6, Half-letter, Personal, Pocket)
- [x] Design printer-friendly layout with 4 reflection stage prompts
- [x] Add "Print Today" button to SynthesisLog header
- [x] Implement CSS @media print rules for clean printing
- [x] Include proper margins for hole punching
- [x] Test with different planner sizes and browsers
- [x] Add DNA strand progress graphic at bottom of worksheet

## Single-Page Worksheet Redesign
- [x] Redesign worksheet layout to fit all content on one 8.5" × 11" page
- [x] Add current month calendar to header section
- [x] Make DNA strand graphic more compact for single-page layout
- [x] Reduce reflection box sizes to fit 4 stages on one page
- [x] Remove planner size selector (focus on standard letter size that users can scale)
- [x] Test print output to ensure everything fits on one page

## Public README / About Page [COMPLETED]
- [x] Create /about route with full capability documentation
- [x] Document all features: spiral system, reflection depths, AI integration, multi-list support
- [x] Include philosophy section (connection-making, Tool inspiration, "spiral out")
- [x] Add visual feature overview
- [x] Link from main app header

## Calendar Export (.ics - Google Calendar Compatible) [COMPLETED]
- [x] Design morning/evening prompt structure per day based on active stages
- [x] Implement RFC 5545 compliant .ics file generation on server
- [x] Morning event: context/history stage prompts with term names
- [x] Evening event: amalgamation/motion stage prompts with term names
- [x] Proper UTC timestamps, PRODID, VCALENDAR wrapper for Google Calendar
- [x] Add "Export Calendar" button to SynthesisLog header
- [x] Test .ics import into Google Calendar

## Completed (Apr 2026)
- [x] Public /about page with full capability documentation, philosophy, and feature overview
- [x] About link added to main app header
- [x] ICS calendar export (RFC 5545, Google Calendar compatible) - 51KB, 992 lines, 36 events for 18-day spiral
- [x] Morning events (8:00 AM) with context/history stage prompts + term names
- [x] Evening events (7:00 PM) with amalgamation/motion stage prompts + term names
- [x] VALARM reminders (5 min before each event)
- [x] TZID=America/Denver timezone support
- [x] Export Calendar button in SynthesisLog header

## TOK (Theory of Knowledge) Term Bank [COMPLETED]
- [x] Add Foundation Set: Knowledge/Belief, Truth/Justification, Certainty/Doubt, Objectivity/Subjectivity, Evidence/Interpretation
- [x] Add Human Lens Set: Perception/Reality, Emotion/Reason, Intuition/Logic, Bias/Awareness, Memory/Reconstruction
- [x] Add Social Knowledge Set: Authority/Trust, Consensus/Truth, Language/Meaning, Perspective/Limitation, Culture/Knowledge
- [x] Add Modern/Relevant Set: Information/Misinformation, Algorithm/Bias, Data/Interpretation, Speed/Accuracy, Signal/Noise
- [x] Build 30-day TOK spiral pack with curated pair ordering
- [x] Add TOK bank to preset list selector with distinct indigo/blue hue
- [x] Test TOK terms in spiral workflow - Day 1 starts with "Authority"

## Worksheet Print Positioning Fix
- [x] Fix worksheet content printing at bottom half of page instead of top - FIXED by using position:fixed and display:none on body children in print CSS

## IB TOK Compliance & Canvas Submission (Apr 2026)
- [x] Rewrite About page with IB TOK alignment section (reflection stages → TOK layers mapping)
- [x] Add TOK Spiral term pair list to About page (15 pairs shown)
- [x] Add Canvas submission step-by-step guide (3-step: export → upload → load on new device)
- [x] Add browser storage warning (localStorage is local only, must export before switching devices)
- [x] Add privacy note (all data stays in browser, nothing sent to server)
- [x] Add suggested Canvas assignment prompt with grading rubric (0.0–4.0 scale)
- [x] Add TOK Exhibition and Essay connection section
- [x] Mark 4-Step Deep as recommended for IB TOK in depth models table
- [x] Harden JSON import: reset file input after import, handle v1 files, load current day reflections immediately, show day count in success toast
- [x] JSON export confirmed: exports all reflections from localStorage (all days), full spiral state, version 2 format

## Spiral Orbit Animation (Apr 2026)
- [x] Build SpiralOrbitAnimation canvas component — central TOPIC node, 6 concept spheres (History, Context, Concrete, Abstract, Amalgamation, Motion)
- [x] Sphere drift-in from random edge, full orbit, drift-out to opposite edge
- [x] Pulse ripples at 4 evenly-spaced reflection points per orbit
- [x] Central node breathes and pulses in sync with sphere reflections
- [x] Trail effect behind orbiting spheres
- [x] Return sequence: all spheres return staggered, grow to larger radius, unique motion types (figure-8, retrograde, spiral-in, wobble, normal)
- [x] Dashed orbit rings, legend, stage label overlay
- [x] Embedded in About page hero section with caption

## Animation Redesign — Staggered Queue + Interest Scores (Apr 2026)
- [x] Rewrite SpiralOrbitAnimation: staggered entry every quarter-rotation (not sequential)
- [x] Build-up sequence: 1 orbiter → 2 → 3 → 4 → 5 simultaneous
- [x] Steady-state: oldest term exits when it completes full rotation, new term enters at 12 o'clock
- [x] Pulse on full rotation completion (reflection complete moment)
- [x] Return phase: all completed terms return with randomized interest-score radius + floating score number
- [x] At least one unique return motion (retrograde, figure-8) per run
- [x] Randomize topic labels from TOK term pool on each page load
- [x] Speed slider in animation canvas (bottom-right, unobtrusive)
- [x] Speed slider in main app header/settings — synced via localStorage

## GitHub Export Package (Apr 2026)
- [x] Standalone HTML/CSS/JS single-file export (zero dependencies, open in browser)
- [x] React/TypeScript component (SpiralOrbitAnimation.tsx) with props interface
- [x] Annotated README.md with key concept callouts, configuration table, and usage examples
- [x] ZIP archive packaged and uploaded for download

## Download Animation Button (Apr 2026)
- [x] Upload standalone HTML to webdev CDN and add Download Animation button to About page

## Header UI & Feature Fixes (Apr 2026)
- [ ] Remove animation speed slider from main nav header (belongs only in About page canvas)
- [ ] Fix light/dark toggle stacking/overlap in header
- [ ] Fix Export PDF — currently does nothing
- [ ] Fix Print Today — loads preview but blanks the page on print

## Mobile Responsiveness (Apr 2026)
- [x] Make entire app responsive for phone and tablet (mobile-first layout)
- [x] Header: collapse action buttons into DropdownMenu overflow on mobile, inline on md+
- [x] Remove animation speed slider from main nav header (lives only in About page canvas)
- [x] Fix light/dark toggle stacking/overlap in header
- [x] Fix Export PDF — changed to publicProcedure so it works without login
- [x] Fix Print Today — improved print CSS to target Radix portal correctly
- [x] Responsive layout for spiral view (CircularWorkflow scales), stage forms (1-col mobile), save button (full-width mobile)

## Print Fix (Apr 2026)
- [x] Fix Print Today blank page — rewrite to open self-contained popup window and call print() from there (bypasses Radix portal issue entirely)

## Per-Stage Importance Rating (Apr 2026)
- [x] Add 1–10 dot importance slider to each StageForm card
- [x] Extend reflection data shape to store { text, rating } per stage
- [x] Persist ratings in localStorage JSON alongside reflection text (backward-compatible with old string format)
- [x] Wire animation return sphere size to student's actual average rating per term
- [ ] Show average rating badge on each term chip in the main view (future)

## Export PDF Bug Fix (Apr 2026)
- [x] Diagnose and fix Export PDF error — was protectedProcedure (login required), changed to publicProcedure

## Three-Issue Fix (Apr 2026)
- [x] Fix second-position stage not rendering consistently in 3-step mode — replaced hardcoded 4-step stage IDs with emptyReflections() depth-aware helper
- [x] Display current spiral topic name in center circle of CircularWorkflow — currentListName prop added
- [x] Redesign Export PDF as attractive full report with all entries, timestamps, ratings, and Motion Proposals summary
- [x] Fix duplicate useState import in About.tsx causing Vite pre-transform error

## Prompt Standardization (Apr 2026)
- [x] Standardize all stage prompts in PrintableWorksheet, reflectionDepth, and pdfExport to be rich and detailed
- [x] Add prompt text to PDF report stage blocks (italic, muted)

## Footer & Portfolio Link (Apr 2026)
- [x] Add small subtle footer with portfolio link (https://kappter.github.io/portfolio/) to main app layout

## Animation Label Fix & Window Tabs (Apr 2026)
- [x] Remove duplicate floating term label above sphere — show term name only inside sphere
- [x] Replace floating label with stage-position indicator (e.g. "Day 3 · History")
- [x] Add 2/3/4/5 window-size tabs to About page animation section
- [x] windowSize prop added to SpiralOrbitAnimation; key reset triggers fresh animation on tab change
- [x] STAGE_NAMES map covers all 4 depth models (2–5 stages)

## Orbital Stagger Fix (Apr 2026)
- [x] Replace hardcoded ¼-turn stagger with 360°÷windowSize so 2→180°, 3→120°, 4→90°, 5→72°
- [x] Ensure all N spheres are simultaneously visible at steady state for each window size

## Orbital Stagger Fix (Apr 2026)
- [x] Fix orbital stagger: changed from hardcoded QUARTER to TAU/windowSize so all window sizes show evenly distributed spheres (2→180°, 3→120°, 4→90°, 5→72°)
- [x] Fix exit threshold: changed from TAU to TAU+(ws-1)*(TAU/ws) so all N spheres are simultaneously visible before the oldest one exits

## Tools Integration (Apr 2026)
- [x] Add TOK Spiral Report tool as React page at /tools/report (iframe embed of standalone HTML)
- [x] Add Student JSON Maker tool as React page at /tools/student-maker
- [x] Add Teacher Batch Tool as React page at /tools/teacher-batch
- [x] Expand footer with links to all three tools and About page
- [x] Consistent Synthesis Log header on each tool page (Back to App, tool name, cross-links)
- [x] Serve tool static files from client/public/tools/ so relative JS/CSS references work

## Chart & Animation Bugs (Apr 2026)
- [x] Fix concept growth line chart Y-axis — only renders 0-4 instead of 0-10 (changed hardcoded /4 to /10 in drawLineChart and bar chart maxValue)
- [x] Fix spiral orbit animation — spheres bunch together instead of evenly spaced (stagger counter now uses entering+orbiting spheres, not just orbiting)
- [x] Fix Recurring Concepts panel — now shows immediately in Blended mode with all terms pre-populated at default weight 1.0; amber highlight activates once a term has been engaged

## Animation Redesign — Precise Orbit Spec (Apr 2026)
- [x] Each sphere does exactly ONE full orbit (TAU), then exits
- [x] Pulses fire at exactly N evenly-spaced points per orbit (N = windowSize: 2,3,4,5)
- [x] All active spheres are equally spaced around the orbit at all times (TAU/windowSize apart)
- [x] On exit, sphere flies to a visible stacked ellipsis queue on the right side of canvas
- [x] Completed spheres wait in the queue stack until all spheres have finished their orbit
- [x] After full spiral concludes, all queued spheres re-enter orbit together (return phase)
- [x] Return phase shows interest scores on re-entering spheres

## Adaptive Blended Mode v1 (May 2026)
- [x] Concept weight metadata: dynamicWeight, timesSelected, timesReferenced, lastSeenCycle, manualBoost
- [x] Weight gain rules: +1 on selection, +2 on high rating, +3 on manual reference in reflection
- [x] Weight decay: multiply by 0.92 each cycle
- [x] Blended mode selection: 70% random, 30% weighted recurrence
- [x] Recurring Concepts UI panel showing top 3 weighted concepts
- [x] JSON export/import preserves weight metadata (version 3 format)
- [x] Sequential and Shuffled modes unchanged
- [x] Adaptive engine lives in shared/spiralQueue.ts; UI label "Blended" unchanged

## Accessibility & Deprecation Fixes (May 2026)
- [x] Add id/name attributes to all form fields missing them (speed slider + 3 file inputs)
- [x] Associate all <label> elements with their form fields via htmlFor/id pairing (3 import labels + radio mode labels)
- [x] Unload event listener is in framework OAuth code (not our source) — cannot be removed, noted as expected

## Export PDF Bug (May 2026)
- [x] Fix exportPDF tRPC 400 error — reflection fields (history/analysis/synthesis) sent as objects instead of strings (flattened to .text string in handleExportPDF)

## Animation Rewrite — 12-Term Buildup Model (May 2026)
- [x] Always 12 random TOK topics per run, reshuffled on each restart
- [x] Day 1: 1 sphere, 1 full orbit, N pulses (N = window size)
- [x] Days 2–N: buildup phase — one new sphere enters each day, equally spaced
- [x] Days N+1 onward: steady state — N spheres always in orbit, exit/enter one at a time
- [x] After all 12 complete their orbit: return phase with interest scores
- [x] Fix Export PDF 400 error — flatten reflection objects to strings before sending

## Spiral Wind-Down Bug (May 2026)
- [x] Fix wind-down: terms now advance through stage positions based on days elapsed since entry (stageIndex = dayIndex - termEntryDay), not queue length — verified correct for 4-step Biology example Days 30-33

## IB Conference AI Improvements (May 2026)
- [ ] Cache AI chat history per stage tile (keyed by dayIndex+stageId+term) in sessionStorage so it persists as users navigate days
- [ ] Strip AI content from all save/export paths — never allow AI text in user notes, JSON export, or PDF export
- [ ] Add global AI features toggle (localStorage) — when off, hide all AI tiles for a clean purist view

## IB AI Export/Import Completeness (May 2026)
- [x] Include aiChats (per-tile AI conversation history, clearly labelled) in JSON export (version 4)
- [x] Include aiEnabled (AI toggle preference) in JSON export and import
- [x] Import restores aiChats to sessionStorage and aiEnabled to localStorage on load
- [x] User reflection text (notes) and AI chat content structurally separate in JSON schema (version 4)
- [x] Wire AI cache state and toggle into SynthesisLog.tsx with lifted props to StageForm
- [x] Add four external TOK resource links to footer (Exhibition Brainstorm, Essay Brainstorm, Essay Orbital Outline, Common Topics Reference)

## TOK Pathways Feature (May 2026)
- [ ] Build shared/tokPathways.ts — concept-to-AOK/Theme mapping with Exhibition object category prompts and Essay KQ frames
- [ ] Build scoring engine — weighted ratings by stage (Abstract ×1.4, Amalgam ×1.3, Motion ×1.1, Concrete ×1.0, History ×0.8)
- [ ] Live TOK Pathways panel in spiral view — AOK heat map, top 3 Exhibition prompts, top 3 Essay KQ frames
- [ ] Panel visible from Day 1, updating as ratings accumulate
- [ ] Links to Exhibition Amalgamator and Essay Brainstorm tools from the panel
- [ ] Standard report mode — clean reflection report, no IB-specific language
- [ ] IB TOK report mode — all Standard content plus Assessment Pathways section with AOK heat map and recommendations
- [ ] Report type selector (Standard / IB TOK) in Export PDF dialog and Report Viewer
- [ ] TOK Pathways data included in JSON export/import

## TOK Pathways Panel + IB PDF Report (Jun 2026)
- [x] Wire TOKPathwaysPanel into SynthesisLog.tsx with computed termRatings from all localStorage days
- [x] Update STAGE_WEIGHTS in tokPathways.ts to handle combined stage IDs (foundation, application, analysis, synthesis, concrete_abstract)
- [x] Add reportType field to ExportData interface in pdfExport.ts ('standard' | 'ib-tok')
- [x] Add IB TOK Assessment Pathways section to PDF: AOK heat map, top concepts, Exhibition prompts, Essay KQ frames
- [x] Update exportPDF router to accept reportType parameter
- [x] Add PDF report type picker dialog to SynthesisLog.tsx (Standard vs IB TOK)
- [x] Refactor handleExportPDF to open dialog; add doExportPDF for the actual mutation call

## Strategic Product Review (Jun 2026)
- [x] Review uploaded product prompts and recommend a prioritized future direction for Synthesis Log AI

## Isolated GitHub Pages Static Proof of Concept (Jun 2026)
- [x] Create an isolated migration branch or workspace without changing Manus production or main
- [x] Map every client-to-server dependency from the actual source
- [x] Add explicit VITE_STATIC_MODE behavior with no required tRPC, OAuth, database, or Forge calls
- [x] Move core calendar export and static-mode PDF outcome to browser-only behavior where practical
- [x] Add GitHub Pages-compatible Vite build, routing configuration, and deployment workflow
- [x] Validate static workflow, JSON disaster recovery, tools, and zero-backend network isolation
- [x] Write STATIC_MODE_FEASIBILITY.md with results, differences, risks, and files changed
