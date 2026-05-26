# User Study Plan - Phonikud TTS Evaluation

## Overview
Evaluate 4 TTS models trained on Hebrew Phonikud dataset with native speakers rating naturalness and accuracy.

## Goals
- Collect ratings from ~15 native Hebrew speakers
- Each person rates 20 sentences × 4 models = 80 ratings
- Each rating has 2 questions (naturalness + accuracy) = 160 responses per person
- Total: ~2,400 responses across all participants

## Models Being Tested
1. Gemini (gemini_unvocalized)
2. Piper Medium - ours (piper-phonikud)
3. StyleTTS2 - ours (phonikud_stts2)
4. RoboShaul Nakdimon - best pre-phonikud (roboshaul_nakdimon)

## Data Structure

### CSV Export Format
```
name | email | sentence_id | model | naturalness | accuracy | timestamp
```

Example:
```
John Doe | user@example.com | gold_000_line_012 | gemini_unvocalized | 4 | 5 | 2024-01-17T10:30:00Z
John Doe | user@example.com | gold_000_line_012 | piper-phonikud | 3 | 4 | 2024-01-17T10:30:45Z
```

## User Flow

### 1. Welcome & Setup Page (Hebrew)
**Fields:**
- Name (text input)
- Email (email input)
- Are you a native Hebrew speaker? (yes/no radio)

**Validation:**
- If "no" → Show Hebrew message: "תודה על העניין! מחקר זה מיועד לדוברי עברית שפת אם בלבד. נשמח לשתף את התוצאות בסיום המחקר."
- If "yes" → Continue to evaluation

### 2. Evaluation Flow
**Structure:**
- Show one sentence at a time
- Display sentence text in Hebrew
- Present 4 audio players (one per model, randomized order)
- For each audio, ask 2 questions:
  - Naturalness (טבעיות): 1-5 scale
  - Accuracy (דיוק בהגייה): 1-5 scale

**Progress:**
- Show progress indicator: "משפט X מתוך 20"
- Show overall progress bar
- "הבא" button to move to next sentence

**Randomization:**
- Shuffle sentence order per user
- Shuffle model order per sentence
- Keep models anonymous (label as A, B, C, D)

### 3. Thank You Page
- "תודה על השתתפותך!"
- Explain results will be published
- Optional: Add contact for questions

### 4. Hidden Results Page
**Route:** `/results` or `/admin/results`

**Display:**
- Total submissions count
- Submissions per model
- Basic stats table:
  - Model name
  - Mean naturalness
  - Mean accuracy
  - Standard error for both
- Download CSV button
- Eventually: Cohen's Kappa for inter-annotator agreement

**Data Source:**
- Fetch from Firebase using existing exportToCSV function
- Parse and calculate statistics client-side

## Technical Considerations

### State Management
- Track current sentence index
- Store all ratings in memory before submission
- Submit all at once at the end OR submit incrementally per sentence

### Data Storage
- Use existing Firebase structure
- Each submission = one rating (user + sentence + model)
- 80 submissions per completed user study

### UI/UX
- Mobile-friendly (many users on phones)
- Large touch targets for ratings
- Clear audio controls
- Prevent accidental navigation away (confirmation dialog)
- Auto-save progress to localStorage

### Validation
- Ensure all questions answered before "Next"
- Email validation
- Prevent duplicate submissions (same email)

## Hebrew UI Text

### Labels
- Naturalness: "טבעיות הדיבור"
- Accuracy: "דיוק ההגייה"
- Scale: "לא טבעי בכלל (1) ... טבעי מאוד (5)"
- Progress: "התקדמות"
- Next: "הבא"
- Previous: "הקודם"
- Submit: "שלח"

### Instructions
Opening page:
```
ברוכים הבאים למחקר הערכת הפקת דיבור בעברית!

במחקר זה תתבקשו להאזין ל-20 משפטים בעברית, כאשר כל משפט מוקרא על ידי 4 מערכות שונות.
לכל הקלטה תתבקשו לדרג שני פרמטרים:
1. טבעיות הדיבור (עד כמה זה נשמע טבעי ואנושי)
2. דיוק ההגייה (עד כמה המילים מבוטאות נכון)

הערכה: כ-15-20 דקות
```

## Success Metrics
- 15+ completed responses
- High completion rate (>80% of starters finish)
- IAA (Cohen's Kappa) > 0.6 (substantial agreement)
- Clear differentiation between models

## Next Steps
1. Build welcome/setup page with Hebrew RTL support
2. Create evaluation interface with audio players
3. Implement shuffling logic
4. Set up Firebase submission
5. Build results page
6. Test with 2-3 people before full launch
7. Deploy and share link
