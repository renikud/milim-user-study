# ReNikud: Audio-Supervised Hebrew Grapheme-to-Phoneme Conversion

Maxim Melichov

Yakov Kolani

Morris Alper

*Reichman University*

*Independent Researcher*

*Carnegie Mellon University*

***Abstract*****—Grapheme-to-phoneme** **(G2P)** **conversion** **for** **Mod-** everyday spoken Hebrew. For instance, the word ⁧ךרדבו⁩is for-

**ern** **Hebrew** **is** **needed** **for** **applications** **like** **text-to-speech** **(TTS),**mally vocalized and pronounced asubadˈeʁeχ/, but in natural

**but** **is** **challenging** **due** **to** **the** **language’s** **abjad** **writing** **system,**speech, it is pronounced vebadˈeʁeχ/. Similarly,

םילשוריב

**which** **leaves** **vowels** **largely** **unwritten,** **creating** **substantial** **ambi-** is formally /biʁuʃalˈajim/, but native speakers typically say

**guity.** **Standard** **approaches** **first** **predict** **vowel** **diacritics** **(nikud)** bejeʁuʃalˈajim/ [4], [5].

**to** **produce** **International** **Phonetic** **Alphabet** **(IPA)** **transcriptions,**

**but** **this** **is** **limited:** **vocalization** **data** **is** **scarce** **and** **laborious** **to** Another issue is a lack of scalable data sources for directly

**produce,** **it** **does** **not** **specify** **features** **such** **as** **lexical** **stress,** **and**learning G2P. Vocalization models [6], [7] learn from Hebrew

**it** **reflects** **formal** **grammatical** **rules** **rather** **than** **everyday** **spo-**text with manually annotated vowel diacritics, data which

**ken** **pronunciation.** **Direct** **sequence-to-sequence** **IPA** **prediction,** is scarce and laborious to produce. Similarly, methods such

**meanwhile,** **struggles** **on** **limited** **data** **and** **fails** **to** **exploit** **the** as [3], [8] that learn from IPA annotations are bottlenecked

**character-level** **alignment** **characteristic** **of** **abjads.** **Our** **method,**

**ReNikud,** **overcomes** **these** **limitations** **with** **two** **key** **insights:** **(1)**by data availability. Conversely, another abundant source of

**Weak** **audio** **supervision** **via** **a** **phoneme-based** **automatic** **speech**data on pronunciation exists—unlabelled Hebrew audio—but

**recognition** **(ASR)** **pseudo-labeling** **pipeline** **on** **thousands** **of** **hours**existing methods can only learn from text.

**of** **unlabeled** **Hebrew** **audio,** **yielding** **phonemic** **transcriptions** **that** Finally, while methods using vocalization poorly reflect

**reflect** **natural** **spoken** **norms** **without** **manual** **annotation.** **(2)** **A** spoken pronunciation, they have been shown to outperform

**pseudo-vocalization** **architecture** **that** **predicts** **IPA** **phonemes** **at**

**each** **character** **position,** **enforcing** **character-level** **alignment** **as** direct sequence-to-sequence (seq2seq) prediction of IPA [3],

**an** **inductive** **bias.** **Results** **on** **existing** **Hebrew** **G2P** **benchmarks**the latter of which struggles to learn on limited data while

**and** **the** **new** **targeted** **MILIM** **benchmark** **for** **spoken** **Hebrew**failing to use character-level alignment with the input transcript

**show** **that** **ReNikud** **surpasses** **previous** **state-of-the-art** **methods.** as an inductive bias.

**We** **will** **release** **our** **code** **and** **trained** **models** **to** **support** **further**

2

Our method, *ReNikud* , directly addresses these challenges.

**work** **on** **Hebrew** **TTS** **and** **speech** **technologies.**

***Index*** ***Terms*****—Grapheme-to-Phoneme,** **Text-to-Speech,** **Modern** To reflect spoken norms and unlock abundant training data, we

**Hebrew,** **Weakly** **Supervised** **Learning,** **Automatic** **Speech** **Recog-**propose a novel pipeline to train G2P with*weak supervision*

**nition,** **Lexical** **Stress**

*from unlabeled Hebrew audio*. By applying an automatic

speech recognition (ASR)-based pseudo-labeling pipeline, we

I. Introduction

are able to extract pronunciation information and train on

thousands of hours of recordings, a scalable approach that

With increasing interest in text-to-speech (TTS) systems for effectively learns spoken Hebrew norms. To enforce character-

low-resource languages, the modern Hebrew language poses level alignment between Hebrew characters and phonemes, we

particular challenges. Hebrew is written as an*abjad*—a writ- introduce a *pseudo-vocalization* architecture. Like traditional

ing system that normally does not indicate vowel sounds [1]. vocalization, this predicts phonetic content aligned with each

Consequently, many words are homographs and require seman- character position, but rather than predicting traditional*nikud*

tic context for correct pronunciation. For example, the word symbols it directly predicts character-aligned IPA phonemes.

1

םירפסמ⁦can be read as mispaʁˈim *numbers*), /mispaʁˈajim By using the orthographic structure of Hebrew text, this⁩

*scissors*), or mesapʁˈim/ ( *telling*). As this ambiguity con- increases data efficiency relative to seq2seq baselines, as we

founds TTS generations, leading open-source approaches first demonstrate.

predict *nikud* (vocalization, i.e., conventional vowel diacritics) Our results on existing Hebrew G2P benchmarks show

to condition synthesis [2], [3].

that ReNikud succeeds in leveraging audio data to better

One issue is the mismatch between written and spoken reflect actual Hebrew speech. Furthermore, because standard

Hebrew. Firstly, nikud does not fully specify phonetic features benchmarks predominantly evaluate formal text, they often

such as lexical stress, e.g., ⁧הריב⁩may be pronounced as b'iʁa fail to capture the complexities of modern spoken Hebrew.

*beer*) or /biʁ'a/ ( *capital city* ). Secondly, nikud convention- To address this critical gap, we introduce MILIM as a core

ally reflects traditional grammatical rules that do not match contribution. This novel, targeted benchmark systematically

evaluates difficult phonetic phenomena—such as slang, foreign

Equal contribution 1We place the IPA stress mark directly before the stressed vowel, following 2

TTS conventions.

Rethinking Nikud


---

loanwords, acronyms, and complex homographs—providing

a much-needed framework for measuring how well models

handle the nuances of contemporary spoken Hebrew. We will release our code, data and trained models to spur

work on Hebrew speech technologies.

Figure 1: **System** **overview.** We first pseudo-label audio (left)

by creating a many-to-one FST alignment between unvocalized Hebrew text and IPA phonemes derived from two parallel

ASR runs applied to Hebrew audio. We then train a pseudo- vocalization architecture (right) where unvocalized Hebrew

characters are passed through a character encoder to predict a phonetic triplet (consonant, stress, and vowel) at each position via parallel classification heads.

II. Method

The ReNikud pipeline consists of two stages, shown in Fig- ure 1: audio pseudo-labeling (Section II-A), and our pseudo- vocalization architecture trained on this data (Section II-B).

*A. Audio Pseudo-Labeling*

To learn pronunciation from unlabeled audio at scale, we

construct a pipeline that extracts character-aligned IPA anno- tations using two parallel ASR systems, as shown in Figure 1 (upper left). We extract Hebrew orthographic transcripts with a standard pretrained Hebrew ASR model, and IPA transcripts with a custom ASR model trained to output IPA when applied to Hebrew audio. By applying both ASR systems to a large- scale, unlabeled Hebrew audio corpus, we extract parallel

Hebrew text and IPA transcriptions that serve*pseudo-labels* as

providing weak supervision for our downstream G2P model. To find character-level correspondences between ortho-

graphic and IPA transcripts, we perform a string alignment process based on the Hebrew orthography’s abjad structure. In general, abjads encode consonants linearly with interleaved, unwritten vowels, meaning that graphemes map monotonically to (consonant, vowel) pairs. As Hebrew also has unwritten lexical stress, each grapheme maps to *phonetic*a* triplet* en-

coding such a pair and a binary stress indicator. We find this alignment with a simple finite state transducer (FST) handling known consonant values, including one-to-many (e.g.,⁧ב ⁩b,

v/) and many-to-one (e.g., ⁧ט ת ⁩t/) mappings, as well as

orthographic complexities such as:

- **Digraphs:** Loanwords in Modern Hebrew frequently use

an apostrophe (*geresh*) to denote non-native phonemes

(e.g., ⁧׳ז⁩for /ʒ/; the base letter⁧ז ⁩normally represents /z/).

The FST assigns the digraph phoneme to the base letter and passes over the*geresh*

- Word-final⁧ח ⁩χ/) may occur with an additional*preced-*

*ing* a/ vowel (*patah gnuva*), e.g., ⁧חול⁩l'uaχ/. We handle

this reordering with a special combinedaχ / value for the

vowel slot.

- **Silent** **letters** : The Hebrew letters⁧ו, י ה א ⁩may either

indicate consonant sounds or may be silent*matres lectio-*

*nis*). We handle the latter case with a null) consonant

class.

An example of the resulting alignment between Hebrew

characters and phonetic triplets is shown in Table I.

**Word** **Char**

**Consonant** **Vowel** **Stress**

| םולש(/⁦ʃal'om/) ⁩ש | /⁦ʃ/ / | a/ 0 |⁩
|---|---|---|
| ל | /⁦l/ / | o/ 1 |⁩
| ו | ∅ ∅ | 0 |
| ם | /⁦m/ | ∅ 0 |⁩

ספי׳צ⁦tʃ'ips⁩

צ

tʃ/ /

i/ 1

י פ ס

| חופת(/⁦tap'uaχ/) ⁩ת | /⁦t/ / | a/ 0 |⁩
|---|---|---|
| פ | /⁦p/ / | u/ 1 |⁩
| ו | ∅ ∅ | 0 |
| ח | ∅ | /⁦aχ/ 0 |⁩

Table I: **Examples** **of** **FST-derived**

Hebrew characters and phonetic

stress).

We filter for quality by checking for agreement

the orthographic and IPA transcripts, retaining only utterances where both ASR systems produce transcripts with matching word counts. In addition, we filter for successful FST align- ment, extracting maximal contiguous aligned sub-sequences. This yields 1.52M valid utterances from the original 474K sentences, retaining approximately 60% of words.

*B. Pseudo-Vocalization Architecture*

Our goal is to create

unvocalized Hebrew text directly to IPA strings. Because He-

brew is an abjad, there is a strong, local relationship between individual written letters and their phonetic realizations, which standard sequence-to-sequence models inductive bias. To mitigate this, we

strained, per-character classification problem—a method we term *Pseudo-Vocalization*, illustrated in Figure 1 (right). While

a single Hebrew character typically corresponds to more than one IPA symbol (e.g., a

∅ ∅ ∅ ∅ p s

triplets 0 0

0 0

**alignment** between (consonant, vowel,

between

a Hebrew G2P model that maps

fail to exploit as an

frame the G2P task as a con-

consonant followed by a vowel),


---

we resolve this by having every Hebrew letter independently predict exactly one phonetic triplet, as defined in Section II-A. The core model is a character-level transformer encoder, with three parallel, independent classification heads that si- multaneously predict the phonetic attributes for each character directly from the encoder’s hidden states:

- **Consonant** **Head:** Selects from 25 IPA consonants or

null (

- **Vowel** **Head:** Selects from 5 vowels, null ), or the

special /aχ/ token (see Section II-A).

- **Stress** **Head:** Binary classifier for lexical stress.

At inference time, realizations are predicted by takingIt should be a gray dotted line, not solid black, and in caption

the argmax of logits for each head. In addition, we apply

*constrained decoding* to enforce hard constraints on Hebrew

letters and phonetic realizations: the argmax is calculated only over possible consonantal realizations of a letter (e.g.,⁧ב ⁩can

only be realized as b/ or /v/). We also enforce a word-level

constraint that exactly one lexical stress is predicted.[Morris:

do we ablate the effect of constrained decoding?]

III. Experiments and Results

*A. Experimental Setup*

As our ASR model for outputting orthographic transcripts, we employ the Whisper Large v3 Turbo checkpoint fine-

tuned on Hebrew by ivrit.ai [9]. For ASR prediction of IPA, we adapt this model with two fine-tuning stages: (A) We

first train on IPA pseudo-labels produced by Phonikud [3]

3

applied to transcripts from the*SASpeech* [10] ( 18h ) and

*Recital* [11] ( 50h) audio corpora. (B) We then fine-tune on

the train split of the*ILSpeech* [3] ( 2h) audio corpus, con-

taining expert-annotated gold IPA transcripts. After training until convergence, this model achieves strong performance on held-out data (e.g., 2.4% Character Error Rate on the test

set of ILSpeech) and in qualitative inspection of predictions, supporting its use in our pipeline. Our G2P model is initialized with a dicta-

il/dictabert-large-char encoder with three added

classification heads as described in Section II-B. For training data, we apply our pseudo-labeling pipeline (Section II-A) to Knesset Vox [12], a corpus of 1.7K hours of parliamentary

recordings. We re-segment the raw audio into 5–15 second clips, as ASR quality degrades on longer inputs, and process each clip through both orthographic and IPA ASR models to obtain parallel transcripts. After FST alignment and filtering for transcript agreement and length outliers 1 5 IQR),

the pipeline yields 1.52M aligned Hebrew-to-IPA sentences. Models are trained until convergence on a held-out validation set.

*B. MILIM Benchmark* 4

We introduce the MILIM benchmark, a corpus of Hebrew

sentences with paired IPA annotations for targeted words in

3Filtered from the original 26h to remove segments with filler words. 4Meaning “words” in Hebrew; this benchmark evaluates pronunciation at the word level.

Figure 2: Word accuracy rate (left) and character accuracy rate (right). [Max: should i add the name Gemini-3.1-pro? in the graph or in caption?][Morris: in caption or paper text is fine.

we should say that it provides an upper bound]

context. This is designed to assess Hebrew G2P models’ ability to perform complex phonetic disambiguation in challenging Hebrew contexts, such as spoken norms differing from formal language. The benchmark contains eleven categories each

consisting of 150–151 sentences containing one or more

targeted words (totals: 1,653 sentences, 3,110 target words

inclusing ILSpeech). These were produced with a semi-manual procedure including manual production as well as verification and correction of items produced by Gemini-3.1-pro when

shown existing items as in-context seeds. MILIM also includes the test split of ILSpeech as an additional control category (using version 2, with minor orthographic fixes from the

original ILSpeech release).

Examples from MILIM are shown in Table II. The cate- gories test the following challenges:

- **Gender:** Pronouns and suffixes whose pronunciation de-

pends on the contextually licensed gender of the referent.

- **Homographs:** Identically spelled words with different

meanings and pronunciations (excluding minimal stress pairs, a separate category).

- **Slang:** Informal vocabulary absent from standard dictio-

naries.

- **Colloquial:** Words where everyday spoken pronunciation

diverges from prescriptive norms.

- **Rare** **Phonemes:** Words with rare or non-native

phonemes marked by geresh diacritics.

- **Foreign:** category covers loanwords and non-native vo-

cabulary in Hebrew script like Instagram, Telegram etc.

- **Acronyms:** Hebrew acronyms requiring correct stress and

vowel resolution.

- **Penultimate** **Stress:** Words stressed on the penultimate

syllable, unlike Hebrew’s default final stress.

- **Minimal** **Stress** **Pairs:** Word pairs distinguished only by

stress placement.

- **Names:** Proper nouns, which often have non-standard

pronunciation patterns.

- **ILSpeech-v2:** Control from the existing ILSpeech bench-

mark.


---

**Cat.** **Input**

Gender

Acronyms

Penult.

Rare Ph. Foreign

רהמלכאת

ILSpeech

Table II: Selected examples from MILIM, split by category (Cat.). Abbreviated category names are penultimate stress (Penult.),

rare phonemes (Rare Ph.), homographs (Homogr.), colloquial (Colloq.), and minimal stress pairs (Min. Str.).

**Target**

ךתיארדסבלכה

ן״מאב

**IPA** **Cat.** **Input**

ידיגת ךתיא⁦ʔitˈaχ/ Names⁩

ן״מאבתרישאוה⁦beʔamˈan/ Homogr.⁩

םחל ירטםחליתינק⁦lˈeχem/ Min. Str.⁩

ךליבשבספי׳ציתאבהספי׳צ⁦tʃˈips/ Slang⁩

ביוו

הפשיבוטביווהזיא⁦vˈajb/ Colloq.⁩

םוליצימיהאמתושעללכואינא*(⁦Full Sentence)* ʔanˈi ʔuχˈal laʔasˈot mˈeʔa jemˈej tsilˈum beχˈodeʃ⁩

שדוחב

Stress  Phonemes

Homog.

**Target**

**IPA**

ילשהלוחכההצלוחההפיאיהיליהיל⁦lˈihi⁩

בשיאוהשןמזבןיינעמרפסארקאוהרפס⁦sˈefeʁ/~/sapˈaʁ⁩

םישנרפסלצא וידלילשםיגשיההמחורתחנולהיהתחנ⁦nˈaχat/~/naχˈat⁩

לולסמהלעםולשבתחנסוטמה ירמגלבונגםדאןבאוהבונג⁦ɡanˈuv⁩

תכמותהחפשמוםירבחביולתלכההחפשמו⁦vemiʃpaχˈa⁩

Pairs

Stress

Gender Acronyms Penult. Rare Foreign

*Proprietary / Non-Realtime Models* Gemini 26.3

/ 4.2 23.0 / 5.4 10.6 / 1.3 44.4 / 9.2 28.4

*Dedicated G2P Models* ReNikud (Ours) **47.4 14.3** **34.2 8.9** **19.9 3.6** **58.3 17.0** **46.5 11.1** **29.3**

Phonikud (Baseline) 61.2 / 20.0 64.5 / 23.6 42.4 / 9.1 82.8 / 27.9 65.8 / 18.2 34.7 / 11.1 23.2 / 10.0 59.0 / 20.6 91.4 / 20.8 30.7 / 11.1 16.2 / 4.1 32.7 / 10.0

Table III: Detailed G2P evaluation on MILIM (WER / CER,

in %). Bolding denotes the best-performing dedicated G2P model.

*C. G2P Evaluation*

We evaluate all models on MILIM using word-level WER

and CER against gold IPA annotations, micro-averaged across categories (Table III, Figure 2). ReNikud outperforms all baselines overall, with the largest gains on categories reflecting spoken Hebrew norms.[Mor-

ris: should we add qual examples? or point to same ones

as ablations?] On colloquial items, ReNikud correctly

predicts spoken forms such as

החפשמו⁦vemiʃpaχˈa⁩

where both Phonikud and Gemini default to the prescriptive umiʃpaxˈa/—reflecting the well-known divergence between

the formal “bumaf” conjunction rule and everyday speech.

On slang, ReNikud correctly resolves items like ⁧החידאפ⁩

fadˈiχa/ (Phonikud: */padiχˈa/). On foreign items, ReNikud

maps non-native phonemes correctly, e.g., ⁧רניוו ⁩wˈineʁ (Phonikud: */vinˈeʁ/).

We also report Gemini 3.1 Pro as an upper bound; however,

as Gemini generated the test sentences (excluding ILSpeech), its scores may reflect upward bias. Moreover, LLMs are

impractical for G2P in applications like real-time TTS that require low latency and open, reproducible models.

*D. Transfer to Diacritization*

Diacritization (*nikud* prediction) is closely related to G2P,

as both require resolving per-character phonetic ambiguities. However, diacritic annotation requires specialist linguistic

knowledge that most native speakers lack, making labeled data

scarce and difficult to scale—unlike unlabeled audio, which

Names Stress Slang ColloquialMin. ILSpeech-test**OVERALL**

/ 4.3 25.3 / 6.2 5.9 / 1.5 30.1 / 7.0 74.2 / 16.1 16.7 / 4.4 4.6 / 1.2 16.3 / 3.6

**9.5** **18.2 9.8** **37.8 11.2** **53.6 9.3** **27.3 10.4** **11.6 3.0** **22.8 6.5**

Figure 3: Diacritization performance on test set over the

different number of sentences in the training

is abundant. We hypothesize that phonetic representations

learned from audio supervision can transfer to diacritization. We retain the pre-trained ReNikud encoder and replace the phonetic classification heads with a nikud prediction head,

following the per-character methodology of DictaBERT [7].

We fine-tune on subsets of 1k, 2.5k, 5k, and 10k sentences from the Knesset corpus (processed via the Dicta Nakdan

API), with 10k held out for validation. We evaluate on 100 manually corrected sentences from the Nakdimon test set [6] (originally consisting of automatic pseudo-labels with frequent inaccuracies), comparing against a DictaBERT baseline trained with identical hyperparameters and early stopping. As shown in Figure 3, the ReNikud-initialized encoder converges sig- nificantly faster at extremely small data sizes (1k: 23.6% vs. 37.4% WER, p < 0 001), suggesting that audio-supervised

pretraining provides useful representations for diacritization when labeled data is severely limited. The model maintains a statistically significant advantage up to 10k sentences (13.4%

vs. 15.7% WER, p < 0 001), steadily approaching the perfor- 5

mance of the fully-trained DictaBERT-Menaked(Table IV).

*E. Ablations*

We ablate both architecture and data source choices; per-

category qualitative examples are in Table V. **Architecture.** We compare our pseudo-vocalization heads

against ByT5-Small (seq2seq) and a CTC network on the same DictaBERT encoder, all trained on identical Knesset Vox data (Table VI). Our method outperforms both overall. Without

5dicta-il/dictabert-large-char-menaked


---

**Model** **Train**

**Size** **WER**

DictaBERT-Menaked (undisclosed) 10.2

**CER** **EM**

1.7 29

**V**

**ReNikud (Ours)**

Dicta 100k

Table IV: Diacritization performance on the test set (corpus-

level WER/CER and sentence-level Exact Match, in %) ris: missing decimal place in EM; do we need this table?] nope where did you pu]

**Cat.** **Word** **Target** **Ours**

| Gender | ⁧ךלצא/⁩ʔetslˈeχ/ | X | /ʔˈetslχ/ / | ʔetslˈχa/ |
|---|---|---|---|---|
| Homogr. | ⁧לצב×2 / ⁩betsˈel/, | /batsˈal/ X, X | /btsˈel/, /bˈatsal/ | / betsˈel/, /betsˈel/ |
| Colloq. | ⁧םיקרבו/⁩vebʁakˈim/ | X | /uvʁakˈim/ / | ubʁakˈim/ |
| Slang | ⁧הרפכ/⁩kapˈaʁa/ | X | /kapaʁˈa/ / | kapeʁˈa/ |
| Acronym | ⁧א״דמב/⁩bemˈada/ | X | /bemadˈa/ / | bemadˈa/ |
| Penult. | ⁧טפסנוק/⁩kˈonsept/ | X | /konsˈept/ / | konsˈept/ |
| Rare Ph. | ⁧רנא׳זה/⁩haʒˈaneʁ/ | X | /haʒanˈeʁ/ / | haʒˈaneʁ/ |
| Foreign | ⁧רקאה/⁩hˈakeʁ/ | X | /hakˈeʁ/ / | haʔakˈeʁ/ |

100k 10.7

1.8 29

10.9

1.8 31

[Mor-

[Max:

**Phonikud** **ByT5**

Table V: Qualitative examples of G2P predictions on MILIM.

X = matches target. Common error patterns include stress

misplacement (Phonikud, ByT5), formal conjunction defaults (Phonikud), and phoneme insertion (ByT5).

character-level alignment as an inductive bias, the seq2seq

baseline frequently mispredicts vowels, stress placement, and other underspecified phonetic features—e.g., inserting a glottal stop in ⁧הפאל⁩lˈafa leʔapˈa/) or defaulting to final stress

on penultimate-stressed words ( ⁧הלחא⁩ʔˈaχla ʔaχlˈa/). The

CTC baseline shares our encoder but still underperforms,

particularly on stress and vowel accuracy.[Morris: TODO:

test seq2seq with DictaBERT encoder to isolate architecture from encoder choice.]

**Data** **source.** We compare three data conditions with the

same architecture: audio-derived IPA from Knesset Vox (our full pipeline), text-derived IPA from Phonikud applied to the same Knesset Vox transcripts, and training on Phonikud’s

original text corpus. Audio-derived labels outperform text-

derived labels across all MILIM categories (Table III), with the largest gains on colloquial and slang items where spoken and written norms diverge most.

IV. Related Work

Explicit G2P conversion for Hebrew was recently introduced by Kolani et al. [3], following prior works on Hebrew dia- critization [6], [7]. These approaches are bottlenecked by the availability of annotated textual data, while we use audio as a

scalable source of pronunciation information. Among prior works learning pronunciation from audio

in other language settings, we distinguish between two ap-

proaches:

(1) **Audio-supervised** methods such as ours use audio duringmethodology is its reliance on ASR-generated pseudo-labels,

training to improve pronunciation knowledge. Most similaras inherent transcription errors from the ASR model naturally

to our work, a few studies use audio to improve G2P

English [13], [14] or in multilingual settings [15]. However, these works train on labeled audio as a supplementary signal

**Val.** **(250)** **Test** **(3,108)**

**Method**

WER CER WER CER

*Architecture comparison (all trained on Knesset Vox, audio-derived IPA):*

Seq2Seq (ByT5-Small) 24.1 4.9 32.1 11.0

CTC (DictaBERT encoder) 21.2 3.8 27.9 8.9

Encoder-Decoder (DictaBERT) 14.1 2.7 27.0 7.6

Ours (Unconstrained) 14.3 2.7 24.9 7.1

**Ours** **(Constrained)** **13.7**

**2.7** **24.3** **6.6**

*Data source comparison (all using our architecture):* Phonikud text corpus 23.4 6.8 32.6 11.0

Knesset Vox, Phonikud-labeled IPA 20.7 4.5 33.0 9.9

**Knesset** **Vox,** **ASR-derived** **IPA** **(Ours)** **13.7** **2.7** **24.3** **6.6**

Uses ByT5 encoder; see text.

Table VI: Ablation G2P performance comparison. Error rates

are reported as percentages for Word Error Rate (WER) and Character Error Rate (CER). The Test set reflects the full

MILIM suite.

to labelled text, while we use large-scale unlabeled audio as our primary training signal. Additionally, we operate on the Hebrew language which has a high degree of orthographic ambiguity and phonetic features unspecified in text (stress,

spoken norms, etc.), and our pseudo-vocalization architecture uses abjad-style alignment as an inductive bias. (2) **Audio-guided** methods also take audio along with text at

inference time for G2P [16]–[18] or abjad diacritization [19], [20]. While adding audio as an additional input can provide a richer signal, we focus on the case where only text is available at inference time.

V. Conclusion

We introduced ReNikud, a framework for Hebrew G2P

conversion that encompasses both a*Pseudo-Vocalization* ar-

chitecture and a methodology for leveraging audio data. By re- framing the unconstrained sequence-to-sequence problem into a per-character phonetic triplet classification task (Consonant, Vowel, Stress), our approach introduces an inductive bias

matching the abjad structure of Hebrew orthography, unlike existing approaches and baselines. To train this architecture, we developed a weak-supervision

pipeline utilizing a monotonic FST to align continuous IPA transcriptions from an adapted Whisper ASR model with

unvocalized Hebrew graphemes. We also propose the MILIM

benchmark, on which evaluations show that ReNikud out-

performs prior methods on Hebrew G2P—particular in chal- lenging cases such as colloquial slang, rare phonemes, and penultimate stress. Finally, we demonstrate the broader utility of our character-level encoder by adapting it to traditional

Hebrew text diacritization, achieving competitive accuracy

with substantially less training data than standard approaches.

**Limitations** **and** **Future** **Work:** A primary limitation of our

forpropagate into the G2P training data. Furthermore, because our FST alignment mechanism enforces a strict character-

to-phoneme mapping, the aligner tends to discard highly


---

informal spoken variants that deviate significantly from the written orthography (for example, when a speaker colloquially pronounces the first-person ⁧בותכא⁩as /jixtov/).

Additionally, since the Knesset Vox dataset consists entirely

of parliamentary speeches, the training corpus is

toward formal discourse; further work could incorporate more

diverse sources of conversational audio. Finally, our framework shows promise for additional languages (i.e., Arabic) sharing

challenges such as unwritten vowels and diverging written and spoken norms.

References

[1] P. T. Daniels and W. Bright, *The world’s writing systems*

[2] V.

skewed

University Press, 1996.

Pratap, A. Tjandra, B. Shi, P. Tomasello, A. Babu, S. Kundu,

A. Elkahky, Z. Ni, A. Vyas, M. Fazel-Zarandi technology to 1,000+ languages,” *Journal of Machine Learning Re-*

*search*, vol. 25, no. 97, pp. 1–52, 2024.

[3] Y. Kolani, M. Melichov, C. Calev, and M. Alper, “Phonikud: Hebrew grapheme-to-phoneme conversion for real-time text-to-speech,” *preprint arXiv:2506.12311*, 2025.

[4] A. Aharoni, “Vocalization of modern hebrew,” in *Hebrew Language and Linguistics*, G. Khan, S. Bolozky, S. E. Fassberg,

G. A. Rendsburg, A. D. Rubin, O. Schwarzwald, and T. Zewi, Eds. Leiden: Brill, 2013, vol. 3, pp. 944–951. [5] H. Neudecker, “Vocalization of modern hebrew and colloquial pro- nunciation,” in *Encyclopedia of Hebrew Language and Linguistics*

G. Khan, S. Bolozky, S. E. Fassberg, G. A. Rendsburg, A. D. Rubin,

O. Schwarzwald, and T. Zewi, Eds. Leiden: 951–953. [6] E. Gershuni and Y. Pinter, “Restoring hebrew diacritics without a dic- tionary,” in *Findings of the Association for Computational Linguistics:*

*NAACL 2022*, 2022, pp. 1010–1018.

[7] S. Shmidman, A. Shmidman, and M. Koppel, “Dictabert: A state-of-

the-art bert suite for modern hebrew,” 2023. [8] J. Zhu, C. Zhang, and D. Jurgens, “Byt5 model for massively multi- lingual grapheme-to-phoneme conversion,” in*Proc. Interspeech 2022*

2022, pp. 446–450.

[9] ivrit.ai, “ivrit-ai/whisper-large-v3-turbo,” [https://huggingface.co/ivrit-ai/](https://huggingface.co/ivrit-ai/) whisper-large-v3-turbo, 2025.

[10] O. Sharoni, R. Shenberg, and E. Cooper, “Saspeech: A hebrew single speaker dataset for text to speech and voice conversion,” *Interspeech*, 2023.

[11] ivrit.ai, “ivrit-ai/crowd-recital,” [https://huggingface.co/datasets/ivrit-ai/](https://huggingface.co/datasets/ivrit-ai/) crowd-recital, 2025.

[12] Y. Marmor, A. Zulti, D. Krongauz, A. Gabet, Y. Snapir, Y. Lifshitz, and E. Segal, “Voxknesset: A large-scale longitudinal hebrew speech dataset for aging speaker modeling,” 2026.

*et al.* , “Scaling speech

*Encyclopedia of*

Brill, 2013, vol. 3, pp.

[Online].

. Oxford

*arXiv*

*Proc.* in

Available:

[https://arxiv.org/abs/2603.01270](https://arxiv.org/abs/2603.01270)

[13] S. Sun, K. Richmond, and H. Tang, “Improving seq2seq tts frontends with transcribed speech audio,” *IEEE/ACM Transactions on Audio,*

*Speech, and Language Processing*, vol. 31, pp. 1940–1952, 2023.

[14] S. Sun and K. Richmond, “Acquiring pronunciation knowledge from transcribed speech audio via multi-task learning,” 2024. [Online].

Available: [https://arxiv.org/abs/2409.09891](https://arxiv.org/abs/2409.09891)

[15] M. S. Ribeiro, G. Comini, and J. Lorenzo-Trueba, “Improving grapheme- to-phoneme conversion by learning pronunciations from speech record- ings,” *arXiv preprint arXiv:2307.16643*, 2023.

[16] J. Route, S. Hillis, I. C. Etinger, H. Zhang, and A. W. Black, “Multi- modal, multilingual grapheme-to-phoneme conversion for low-resource languages,” in *Proceedings of the 2nd Workshop on Deep Learning*

*Approaches for Low-Resource NLP (DeepLo 2019)*, 2019, pp. 192–201.

[17] H. Gao, M. Hasegawa-Johnson, and C. D. Yoo, “G2pu: grapheme-to- phoneme transducer with speech units,” in*ICASSP 2024-2024 IEEE*

*International Conference on Acoustics, Speech and Signal Processing* *(ICASSP)*. IEEE, 2024, pp. 10 061–10 065.

[18] C.-J. Li, K. Chang, S. Bharadwaj, E. Yeo, K. Choi, J. Zhu, D. Mortensen, and S. Watanabe, “Powsm: A phonetic open whisper-style speech

foundation model,” *arXiv preprint arXiv:2510.24992*, 2025.

[19] S. Shatnawi, S. Alqahtani, and H. Aldarmaki, “Automatic restoration of diacritics for speech data sets,” 2024. [Online]. Available:

[https://arxiv.org/abs/2311.10771](https://arxiv.org/abs/2311.10771)

[20] A. Ghannam, N. Alharthi, F. Alasmary, K. Al Tabash, S. Sadah, and

L. Ghouti, “Abjad ai at nadi 2025: Catt-whisper: Multimodal diacritic restoration using text and speech representations,” pp. 757–761, 2025.
