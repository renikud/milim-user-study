# Firebase Setup

## Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Enable Firestore Database (Production mode)

## Get Config

1. Project Settings → Your apps → Add web app
2. Copy the `firebaseConfig` object
3. Paste into `lib/firebase/index.ts`

## Firestore Rules

Go to Firestore Database → Rules and set:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{document=**} {
      allow read, write: if true;
    }
    match /comments/{document=**} {
      allow read, write: if true;
    }
  }
}
```

Click **Publish**.

## Test

```bash
# Test submission
pnpx tsx tests/manual/firebase-test.ts submit

# Export to CSV
pnpx tsx tests/manual/firebase-test.ts export
```
