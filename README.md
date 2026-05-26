# Phonikud User Study

This is a user study for the Phonikud project.

## Database

The database is hosted on [Firebase](https://console.firebase.google.com/u/0/project/phonikud-user-study)

Use Firestore rules that allow client submit only and block all client reads.
(`if true` = allow, `if false` = deny.)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{docId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
    match /comments/{docId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

## Analysis

`scripts/analyze.py` fetches submissions from Firestore, filters to participants who completed all 20 sentences, and computes CMOS scores (normalized so positive = styletts2 better) with 95% CIs.

1. Get service account key: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
2. Save as `service-account.json` in the repo root
3. Run: `uv run scripts/analyze.py`
4. Optional comments export: `uv run scripts/export_comments.py`
5. smoke test (submit + public-read denial): `pnpm --dir web exec tsx tests/manual/firebase-test.ts`
