# CritRoom — AI mock interviews for product designers

Practice portfolio walkthroughs, case-study presentations, app critiques and design challenges with an AI interviewer on camera, then get a scored feedback report.

## Run locally
```bash
npm install
cp .env.example .env.local   # add your Anthropic API key
npm run dev                  # open http://localhost:3000 in Chrome or Edge
```
Without a key the app runs in **demo mode** (scripted questions, heuristic report). You can also paste a key in the dashboard ("Add API key"); it's stored in your browser only.

## Deploy to Vercel
1. Push this folder to a GitHub repo and import it at vercel.com/new (or run `npx vercel` in this folder).
2. In Project → Settings → Environment Variables add `ANTHROPIC_API_KEY`.
3. Redeploy.

## Interview formats
- **Product Designer interview** (main): questions are drawn from a level-based bank (Junior, Mid-level, Senior, Lead / Principal) and balanced across product thinking, managerial & leadership, and communication. After each answer the AI may ask up to 2 cross-questions based on what you said. Browse the bank at `/questions`; edit it in `lib/questionBank.ts`.
- Portfolio walkthrough, Case-study presentation, App critique, Design challenge: focused practice rounds.

Vetted reference answers live in `lib/referenceAnswers.ts` (keyed by question id). The report includes a **Seniority check** (the level each answer demonstrates vs your target) and ends with an **Answer guide**: a brief model answer plus what interviewers listen for, for every question asked (including cross-questions).

## How it works
- **Login**: dummy auth — any email + 6-char password creates a local account (demo@critroom.app / demo1234).
- **Interview room**: camera + mic via `getUserMedia`, full session recorded with `MediaRecorder` (saved in IndexedDB, never uploaded). Questions are read aloud with the browser's speech synthesis; answers are transcribed live with the Web Speech API and are editable before submitting.
- **AI interviewer** (`/api/turn`): Claude asks main questions and decides when to probe with a follow-up (max one per question).
- **Feedback** (`/api/report`): Claude grades the transcript against format-specific rubrics, quotes your words as evidence, rewrites stronger answers using only your facts (placeholders for gaps), and reviews up to 12 webcam stills + pace/filler stats for on-camera presence.
- Models are configurable with `ANTHROPIC_MODEL_TURN` / `ANTHROPIC_MODEL_REPORT` (default `claude-sonnet-5`).
