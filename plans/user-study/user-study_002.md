# Hebrew TTS User Study - Implementation Plan

## Overview
Build a Hebrew-language web application for evaluating 4 TTS models. Users rate 20 sentences × 4 models on naturalness and accuracy (1-5 scale). Target: 15+ native Hebrew speakers.

## Current State
- React 19 + React Router 7 with Tailwind CSS v4
- Firebase configured with Submission interface
- Button component exists (shadcn/ui style)
- Audio files ready: `web/public/audio/<model>/*.m4a` (4 models, 20 files each)
- Sentences ready: `web/public/sentences.csv` (id|text format)
- No RTL support, no form components yet

## Implementation Phases

### Phase 1: Foundation & Utilities

**1.1 Type Definitions** (`src/types/survey.ts`)
```typescript
UserData: name, email, isNativeSpeaker, sessionId, sentenceOrder
Rating: sentenceId, model, naturalness, accuracy
SurveyState: currentSentenceIndex, ratings, modelShuffles, isComplete
```

**1.2 Shuffle Logic** (`src/lib/shuffle.ts`)
- Deterministic seeded shuffling (Fisher-Yates with sessionId seed)
- `shuffleArray()` - generic shuffle function
- `generateShuffles()` - creates sentenceOrder + modelShuffles per user

**1.3 Sentence Loader** (`src/lib/sentences.ts`)
- Fetch and parse `sentences.csv`
- Return array of `{id, text}` objects

**1.4 Validation** (`src/lib/validation.ts`)
- Email validation (regex)
- Name validation (min 2 chars)
- Rating validation (1-5 range)

**1.5 Update Firebase** (`src/lib/firebase/index.ts`)
- Add `submitBatch()` for incremental submission
- Add stats helpers for Results page

### Phase 2: UI Components (shadcn/ui pattern)

**2.1 Form Components** (`src/components/ui/`)
- `input.tsx` - Text input with RTL support
- `label.tsx` - Form labels
- `radio-group.tsx` - Yes/No radio buttons
- `slider.tsx` - 1-5 rating slider (critical)
- `progress.tsx` - Progress bar
- `card.tsx` - Content container (recreate)

**2.2 Custom Components**
- `AudioPlayer.tsx` - Audio playback with A/B/C/D labels
  - Play/pause, progress, duration
  - RTL-friendly layout

- `RatingInput.tsx` - Dual sliders (naturalness + accuracy)
  - Hebrew labels: "טבעיות הדיבור" / "דיוק ההגייה"
  - Visual feedback (stars or numbers)

- `SentenceCard.tsx` - Hebrew sentence display
  - Large text, RTL, proper spacing

- `ProtectedRoute.tsx` - Route guard for /evaluation

**Dependencies to add:**
```bash
pnpm add @radix-ui/react-slider @radix-ui/react-radio-group @radix-ui/react-progress uuid
```

### Phase 3: State Management

**3.1 Context Providers**
- `UserContext.tsx` - User data (name, email, sessionId, shuffles)
- `SurveyContext.tsx` - Survey state (ratings, progress, completion)

**3.2 Custom Hooks**
- `useLocalStorage.ts` - Auto-save/restore survey state
  - Save on rating change (debounced 500ms)
  - Restore on mount
  - Clear on completion

- `useShuffleLogic.ts` - Generate deterministic shuffles
  - Called once on Welcome submission
  - Returns sentenceOrder and modelShuffles

- `useSurveyProgress.ts` - Navigation and validation
  - Check if current sentence is complete (all 8 ratings)
  - Handle next/previous
  - Calculate progress percentage

**3.3 Update main.tsx**
Wrap app in context providers:
```tsx
<UserProvider>
  <SurveyProvider>
    <BrowserRouter>...</BrowserRouter>
  </SurveyProvider>
</UserProvider>
```

### Phase 4: Routes & Pages

**4.1 Welcome Page** (`src/routes/Welcome.tsx`)
- RTL Hebrew form
- Fields: Name, Email, "האם אתה דובר עברית שפת אם?" (yes/no)
- Validation (client-side)
- If no → show rejection message: "תודה על העניין! מחקר זה מיועד לדוברי עברית שפת אם בלבד."
- If yes → generate shuffles → navigate to /evaluation

**4.2 Evaluation Page** (`src/routes/Evaluation.tsx`)
- Progress bar + text: "משפט X מתוך 20"
- Current sentence display (Hebrew, RTL, large text)
- 4 AudioPlayer components (shuffled models, labeled A/B/C/D)
- 4 RatingInput components (one per audio)
- Previous/Next buttons
  - Next disabled until all 8 ratings complete
  - Submit to Firebase after each "Next" (4 ratings at a time)
- On last sentence: navigate to /thank-you

**4.3 Thank You Page** (`src/routes/ThankYou.tsx`)
- Hebrew message: "תודה על השתתפותך במחקר!"
- Clear localStorage
- Link to home

**4.4 Results Page** (`src/routes/Results.tsx`)
- Hidden route: `/results`
- Show:
  - Total submissions count
  - Stats table (per model): mean naturalness, mean accuracy, stderr
  - Download CSV button
- Future: Cohen's Kappa calculation

**4.5 Update Router** (`src/main.tsx`)
```tsx
<Routes>
  <Route path="/" element={<Welcome />} />
  <Route path="/evaluation" element={
    <ProtectedRoute><Evaluation /></ProtectedRoute>
  } />
  <Route path="/thank-you" element={<ThankYou />} />
  <Route path="/results" element={<Results />} />
</Routes>
```

### Phase 5: RTL & Hebrew Support

**5.1 Global RTL** (`src/index.css`)
```css
[dir="rtl"] {
  direction: rtl;
}
.hebrew-text {
  direction: rtl;
  text-align: right;
}
```

**5.2 Document Setup** (`src/main.tsx`)
```typescript
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'he');
```

**5.3 Component RTL**
- Use Tailwind RTL utilities: `ps-*`, `pe-*` instead of `pl-*`, `pr-*`
- Hebrew text: explicit `dir="rtl"` and `text-right`
- Form inputs: right-aligned text

### Phase 6: Data Flow

**Incremental Submission Strategy:**
1. User rates all 4 models for current sentence (8 ratings total)
2. On "Next" click: submit 4 Submission objects to Firebase
3. Update localStorage with submission status
4. On page reload: skip already-submitted sentences
5. On completion: navigate to Thank You, clear localStorage

**LocalStorage Schema:**
```typescript
Key: `phonikud-survey-${sessionId}`
Value: {
  userData: UserData,
  surveyState: SurveyState,
  submittedSentences: string[], // IDs of submitted sentences
  lastUpdated: ISO timestamp
}
```

## Critical Files to Modify/Create

### Create (Priority Order)
1. `src/types/survey.ts` - Type definitions
2. `src/lib/shuffle.ts` - Shuffling logic
3. `src/lib/sentences.ts` - CSV loader
4. `src/components/ui/slider.tsx` - Rating input (critical)
5. `src/components/ui/input.tsx` - Text input
6. `src/components/ui/radio-group.tsx` - Yes/No selection
7. `src/components/ui/progress.tsx` - Progress bar
8. `src/components/ui/card.tsx` - Container
9. `src/components/AudioPlayer.tsx` - Audio playback
10. `src/components/RatingInput.tsx` - Dual sliders
11. `src/contexts/UserContext.tsx` - User state
12. `src/contexts/SurveyContext.tsx` - Survey state
13. `src/hooks/useLocalStorage.ts` - Persistence
14. `src/hooks/useShuffleLogic.ts` - Shuffle generation
15. `src/routes/Welcome.tsx` - Welcome page
16. `src/routes/Evaluation.tsx` - Main evaluation (most complex)
17. `src/routes/ThankYou.tsx` - Completion page
18. `src/routes/Results.tsx` - Admin page
19. `src/components/ProtectedRoute.tsx` - Route guard

### Modify
1. `src/main.tsx` - Add routes, context providers, RTL setup
2. `src/index.css` - Add RTL styles
3. `src/lib/firebase/index.ts` - Add batch submission helpers
4. `package.json` - Add new dependencies

## Hebrew UI Text

**Welcome Page:**
- Heading: "ברוכים הבאים למחקר הערכת הפקת דיבור בעברית"
- Instructions: "במחקר זה תתבקשו להאזין ל-20 משפטים בעברית..."
- Name: "שם מלא"
- Email: "כתובת אימייל"
- Question: "האם אתה דובר עברית שפת אם?"
- Rejection: "תודה על העניין! מחקר זה מיועד לדוברי עברית שפת אם בלבד."
- Submit: "התחל"

**Evaluation Page:**
- Progress: "משפט {X} מתוך 20"
- Naturalness: "טבעיות הדיבור"
- Accuracy: "דיוק ההגייה"
- Scale labels: "1 - לא טבעי", "5 - טבעי מאוד"
- Previous: "הקודם"
- Next: "הבא"
- Submit (last): "סיים"

**Thank You:**
- "תודה רבה על השתתפותך!"
- "התוצאות יפורסמו בסיום המחקר"

## Verification Steps

1. **Welcome Flow:**
   - [ ] Form validates inputs
   - [ ] "No" shows rejection message
   - [ ] "Yes" generates shuffles and navigates
   - [ ] Data saved to context + localStorage

2. **Evaluation Flow:**
   - [ ] Sentences display in Hebrew RTL
   - [ ] Audio players work (4 models, shuffled labels)
   - [ ] Sliders accept 1-5 ratings
   - [ ] Next disabled until all 8 ratings complete
   - [ ] Progress bar updates
   - [ ] Firebase receives 4 submissions on Next
   - [ ] LocalStorage updates
   - [ ] Page reload restores state

3. **Completion:**
   - [ ] Thank you page displays
   - [ ] LocalStorage cleared
   - [ ] Can start new session

4. **Results Page:**
   - [ ] Shows total submissions
   - [ ] Calculates mean/stderr per model
   - [ ] CSV downloads correctly

5. **RTL & Hebrew:**
   - [ ] All text right-aligned
   - [ ] Forms flow RTL
   - [ ] Audio players layout correct
   - [ ] Mobile responsive

6. **Build:**
   - [ ] `pnpm run check-types` passes
   - [ ] `pnpm run lint` passes
   - [ ] `pnpm run build` succeeds
   - [ ] GitHub Pages deployment works

## Key Decisions

1. **Incremental Submission**: Submit after each sentence to prevent data loss
2. **Deterministic Shuffling**: Use sessionId as seed for consistency
3. **React Context**: Sufficient for this app size, avoid external state libraries
4. **Manual Validation**: Simple forms don't need react-hook-form
5. **Global RTL**: Entire app is Hebrew, use `dir="rtl"` on root

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Audio loading slow | Lazy load per sentence, preload next |
| LocalStorage quota | Store only necessary data, clear old sessions |
| Network failure during submit | Retry logic, store failed submissions |
| Hebrew font rendering | Use system fonts, test cross-browser |
| .m4a compatibility | Already converted from WAV, test browsers |

## Success Criteria

- [ ] 15+ participants complete full survey
- [ ] Completion rate >80%
- [ ] No data loss reports
- [ ] All submissions have correct format
- [ ] Results page shows meaningful stats
- [ ] Mobile users can complete survey
- [ ] Average completion time: 15-20 minutes
