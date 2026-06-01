# STUDY GROUP ASSIGNMENT

The study uses three public assignment groups:

```text
Group A: items 001-050
Group B: items 051-100
Group C: items 101-150
```

Send each group link to exactly three participants.

## CALCULATION

The study has 150 items. Each item should be rated by 3 participants:

```text
150 items * 3 ratings per item = 450 total ratings
```

There are 9 participants:

```text
450 total ratings / 9 participants = 50 ratings per participant
```

Therefore:

```text
3 groups * 50 items = 150 items
3 participants per group * 50 ratings = 150 ratings per group
3 groups * 150 ratings = 450 total ratings
```

## PARTICIPANT URLS

Participants must use an assigned group URL:

```text
https://your-site.example/?group=A
https://your-site.example/?group=B
https://your-site.example/?group=C
```

For the GitHub Pages deployment, use:

```text
https://renikud.github.io/milim-user-study/?group=A
https://renikud.github.io/milim-user-study/?group=B
https://renikud.github.io/milim-user-study/?group=C
```

`group` is a query parameter. Do not put it in the path.

Correct:

```text
https://renikud.github.io/milim-user-study/?group=A
```

Wrong:

```text
https://renikud.github.io/milim-user-study/group=A
```

The wrong form returns 404 on GitHub Pages because it looks like a real route/file path.

The app accepts lowercase values too, but send uppercase links.

If the URL has no valid `group` parameter, the app blocks the study and shows an invalid-link message.

## FIREBASE FIELD

Each rating stores the assigned group in:

```ts
study_group: 'A' | 'B' | 'C'
```

Use this field later to verify that each group received exactly three complete participants.
