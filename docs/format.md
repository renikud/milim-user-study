# FIREBASE SUBMISSION FORMAT

Each submitted rating row uses this format:

```ts
{
  email: string;
  sentence_id: string;
  study_group: 'A' | 'B' | 'C';
  variant_a: 'formal' | 'informal';
  variant_b: 'formal' | 'informal';
  preference: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  timestamp: Date;
}
```

`preference` is relative to samples A and B:

```text
 3 = A הרבה יותר
 2 = A יותר
 1 = A קצת יותר
 0 = דומה
-1 = B קצת יותר
-2 = B יותר
-3 = B הרבה יותר
```

The preferred variant can be derived later:

```ts
const preferredVariant =
  preference > 0 ? variant_a :
  preference < 0 ? variant_b :
  'similar';
```

All sentence text, target word index, IPA, and WAV filenames are recovered from:

```text
web/public/colloquial_formal_informal_renikud_study_150/metadata.csv
```
