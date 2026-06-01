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

## ASSIGNMENT ALGORITHM

The app loads the canonical item list from:

```text
web/public/colloquial_formal_informal_renikud_study_150/metadata.csv
```

The file order is treated as the source of truth. The current metadata contains item IDs `001` through `150` in order.

The app defines:

```ts
STUDY_GROUPS = ['A', 'B', 'C']
GROUP_SIZE = 50
```

The URL query parameter is parsed as:

```ts
group = new URLSearchParams(window.location.search).get('group')
group = group.trim().toUpperCase()
```

Only `A`, `B`, and `C` are valid. Missing or invalid values block the study.

The selected group is converted to a zero-based group index:

```ts
A -> 0
B -> 1
C -> 2
```

The item slice is then:

```ts
start = groupIndex * GROUP_SIZE
end = start + GROUP_SIZE
assignedItems = allItems.slice(start, end)
```

This gives:

```text
A: allItems.slice(0, 50)    -> IDs 001-050
B: allItems.slice(50, 100)  -> IDs 051-100
C: allItems.slice(100, 150) -> IDs 101-150
```

Within a participant's assigned 50 items, item order is shuffled per session. The assignment set does not change; only presentation order changes.

For each item, the formal/informal samples are also randomized into blinded labels `A` and `B`. The submitted row stores both the blinded order and the user's preference:

```ts
variant_a: 'formal' | 'informal'
variant_b: 'formal' | 'informal'
preference: -3 | -2 | -1 | 0 | 1 | 2 | 3
```

Positive `preference` means sample A was preferred. Negative `preference` means sample B was preferred. Zero means similar.

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
