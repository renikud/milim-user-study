# ReNikud: Audio-Supervised Hebrew Grapheme-to-Phoneme Conversion

Maxim Melichov

Yakov Kolani

Morris Alper

*Reichman University*

*Independent Researcher*

*Carnegie Mellon University*

***Abstract*****—Grapheme-to-phoneme** **(G2P)** **conversion** **for** **Mod-** everyday spoken Hebrew. For instance, the word ⁧ךרדבו⁩is for-

**ern** **Hebrew** **is** **needed** **for** **applications** **like** **text-to-speech** **(TTS),**mally vocalized and pronounced asubadˈeʁeχ/, but in natural

**but** **is** **challenging** **due** **to** **the** **language’s** **abjad** **writing** **sys-**speech, it is pronounced vebadˈeʁeχ/. Similarly,

םילשוריב

**tem,** **which** **leaves** **vowels** **largely** **unwritten,** **creating** **widespread** is formally /biʁuʃalˈajim/, but native speakers typically say

**ambiguity.** **Standard** **approaches** **first** **predict** **vowel** **diacritics** bejeʁuʃalˈajim/ [4], [5].

**(nikud)** **to** **produce** **International** **Phonetic** **Alphabet** **(IPA)** **tran-**

**scriptions,** **but** **this** **is** **limited:** **vocalization** **data** **is** **scarce** **and** Another issue is a lack of scalable data sources for directly

**laborious** **to** **produce,** **it** **does** **not** **specify** **features** **such** **as** **lexical**learning G2P. Vocalization models [6], [7] learn from Hebrew

**stress,** **and** **it** **reflects** **formal** **grammatical** **rules** **rather** **than** text with manually annotated vowel diacritics, data which

**everyday** **spoken** **pronunciation.** **Direct** **sequence-to-sequence** **IPA** is scarce and laborious to produce. Similarly, methods such

**prediction,** **meanwhile,** **struggles** **on** **limited** **data** **and** **produces** as [3], [8] that learn from IPA annotations are bottlenecked

**frequent** **hallucinations** **due** **to** **a** **lack** **of** **character-level** **alignment.**

**Our** **method,** **ReNikud,** **overcomes** **these** **limitations** **with** **two**by data availability. Conversely, another abundant source of

**key** **insights:** **(1)** **Weak** **audio** **supervision** **via** **a** **phoneme-based**data on pronunciation exists—unlabelled Hebrew audio—but

**automatic** **speech** **recognition** **(ASR)** **pseudo-labeling** **pipeline** **on** existing methods can only learn from text.

**thousands** **of** **hours** **of** **unlabeled** **Hebrew** **audio,** **yielding** **phonemic** Finally, while methods using vocalization poorly reflect

**transcriptions** **that** **reflect** **natural** **spoken** **norms** **without** **manual**

**annotation.** **(2)** **A** **pseudo-vocalization** **architecture** **that** **predicts** spoken pronunciation, they have been shown to outperform

**IPA** **phonemes** **at** **each** **character** **position,** **enforcing** **character-**direct sequence-to-sequence (seq2seq) prediction of IPA [3],

**level** **alignment** **to** **mitigate** **hallucinations.** **Results** **on** **existing**the latter of which struggles to learn on limited data and

**Hebrew** **G2P** **benchmarks** **and** **new** **targeted** **test** **suites** **for** **spoken** produces frequent hallucinations due to a lack of enforced

**Hebrew** **show** **that** **ReNikud** **surpasses** **previous** **state-of-the-art** character-level alignment with the input transcript.

**methods.** **We** **will** **release** **our** **code** **and** **trained** **models** **to** **support**

2

**further** **work** **on** **Hebrew** **TTS** **and** **speech** **technologies.**

Our method, *ReNikud* , directly addresses these challenges.

***Index*** ***Terms*****—Grapheme-to-Phoneme,** **Text-to-Speech,** **Modern** To reflect spoken norms and unlock abundant training data, we

**Hebrew,** **Weakly** **Supervised** **Learning,** **Automatic** **Speech** **Recog-** propose a novel pipeline to train G2P with*weak supervision*

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

tic context for correct pronunciation. For example, the word 1

symbols it directly predicts character-aligned IPA phonemes.

םירפסמ⁦can be read as mispaʁˈim *numbers*), /mispaʁˈajim By using the orthographic structure of Hebrew text, this⁩

*scissors*), or mesapʁˈim/ ( *telling*). As this ambiguity con- mitigates hallucinations and increases data efficiency relative

founds TTS generations, leading open-source approaches first to seq2seq baselines, as we demonstrate.

predict *nikud* (vocalization, i.e., conventional vowel diacritics)

to condition synthesis [2], [3].

Our results on existing Hebrew G2P benchmarks show

that ReNikud succeeds in leveraging audio data and better

One issue is the mismatch between written and spoken reflecting Hebrew speech. In addition, we propose additional

Hebrew. Firstly, nikud does not fully specify phonetic features test suites and targeted evaluations to show improvements on

such as lexical stress, e.g., ⁧הריב⁩may be pronounced as b'iʁa difficult phonetic cases reflecting spoken language.

*beer*) or /biʁ'a/ ( *capital city* ). Secondly, nikud convention-

ally reflects traditional grammatical rules that do not match We will release our code, data and trained models to spur

work on Hebrew speech technologies.

Equal contribution 1We place the IPA stress mark directly before the stressed vowel, following 2

TTS conventions.

Rethinking Nikud


---

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

providing weak supervision for our downstream G2P model. Importantly, we retain only pairs where the Hebrew and

IPA transcripts agree on the number of words and where

every word passes the FST alignment procedure described

below. This filtering retains approximately[TODO: XXX%]of

the original samples. While strict, this selection criterion still yields 1.52 million aligned sentence from the large dataset, selecting for more reliably transcribed utterances. Finally, we perform a string alignment process based on

the Hebrew orthography’s abjad structure. In general, abjads encode consonants linearly with interleaved, unwritten vowels, meaning that graphemes map monotonically to (consonant,

vowel) pairs. As Hebrew also has unwritten lexical stress, eachThe core model is a character-level transformer encoder.

grapheme maps to a*phonetic triplet* encoding such a pair and

a binary stress indicator. We find this alignment with a simple finite state transducer (FST) handling known consonant values, including one-to-many (e.g.,⁧ב ⁩b, v/) and many-to-one (e.g.,

ט ת ⁦t/) mappings, as well as orthographic complexities such⁩

as:

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

∅ ∅

0

י

∅ ∅

0

פ

p 0

ס

s 0

| חופת(/⁦tap'uaχ/) ⁩ת | /⁦t/ / | a/ 0 |⁩
|---|---|---|
| פ | /⁦p/ / | u/ 1 |⁩
| ו | ∅ ∅ | 0 |
| ח | ∅ | /⁦aχ/ 0 |⁩

Table I: **Examples** **of** **FST-derived** **alignment** between

Hebrew characters and phonetic triplets (consonant, vowel,

stress).

*B. Pseudo-Vocalization Architecture*

Our goal is to create a Hebrew G2P model that maps

unvocalized Hebrew text directly to IPA strings. Because

Hebrew is an *abjad*, there is a strong, local relationship be-

tween individual written letters and their phonetic realizations. Standard sequence-to-sequence models fail to exploit these

localized properties, leading to hallucinations. To mitigate this, we frame the G2P task as a con-

strained, per-character classification problem—a method we term *Pseudo-Vocalization*, illustrated in Figure 1 (right). While

a single Hebrew character typically corresponds to more than one IPA symbol (e.g., a consonant followed by a vowel), we resolve this by having every Hebrew letter independently pre-

dict exactly one phonetic triplet, as described in Section II-A.

On top of this encoder, we attach three parallel, independent classification heads that simultaneously predict the phonetic attributes for each character directly from the encoder’s hidden states:


---

- **Consonant** **Head:** Selects from 25 IPA consonants oripa

null (

- **Vowel** **Head:** Selects from 5 vowels, null ), or the

special /aχ/ token (see Section II-A).

- **Stress** **Head:** Binary classifier for lexical stress.

At inference time, realizations are predicted by taking

the argmax of logits for each head. In addition, we apply

*constrained decoding* to enforce hard constraints on Hebrew

letters and phonetic realizations: the argmax is calculated only over possible consonantal realizations of a letter (e.g.,⁧ב ⁩can

only be realized as b/ or /v/). We also enforce a word-level

constraint that exactly one lexical stress is predicted.

*C. Renikud Classifier*

The core model is built upondicta-il/dictabert-

large-char, a character-level BERT encoder pre-trained on

Hebrew. We selected this base encoder because our method

requires character-level representation. On top of this base

encoder, we attach three independent classification heads that simultaneously predict the following phonetic elements for

every input character:

- **Letter** **Head:** Predicts the base consonant from a prede-

fined set of 25 possible classes.

- **Vowel** **Head:** Predicts the associated vowel from a set of 7 possible classes.

- **Stress** **Head:** A binary classifier indicating whether the

character carries primary lexical stress (true/false).

III. Experiments and Results

*A. Experimental Setup*

For our base ASR model, we employ the Whisper Large v3 Turbo checkpoint adapted for Hebrew by ivrit.ai, which we subsequently fine-tune on text-and-IPA objective. Our training process is divided into two distinct stages:

**Dataset** **Size**

**Role**

| SASpeech | [9] | ∼18h Pretraining | (Stage 1) |
|---|---|---|---|
| Recital |  | ∼46h Pretraining | (Stage 1) |
| ILSpeech | [3] | ∼2h Fine-tuning | (Stage 2) |

(Stage 1) (Stage 1) (Stage 2)

Table II: **Data** **sources** for IPA ASR training.

**Stage** **1:** **Pretraining.** During the initial pre-training phase,

we utilized two primary corpora. The first is a subset of the *SASpeech* dataset [9]. While the full corpus contains roughly

30 hours of audio, the automatic audio files that contain 26 hours we filtered short files with single word, we used the ivirit’s ASR to filter all the audio with a lot of ”umm..” by

doing this we trim it down to approximately 14 hours

the automatically aligned data. with the 4 manual data we got about 18 hours. The second is the crowd-sourced*Recital*

dataset, consisting of approximately 46 hours of raw audio. we processed the datasets’ existing Hebrew transcripts directly through Phonikud [3] to produce IPA. **Stage** **2:** **Fine-tuning** **and** **Evaluation** **of** **the** **ASR**Fol-

lowing pre-training, the model was fine-tuned on the manual

*ILSpeech* dataset [3], which comprises approximately 2

hours of audio. From the dataset, we extracted exactly 150 recordings for our held-out test set, reserving the remainder for fine-tuning. To assess the ASR-IPA capabilities, we evaluated the fine-

tuned model on two datasets: the held-out test set of 150

manually annotated sentences from*ILSpeech*, and *Michel*, a

synthetic out-of-domain dataset comprising 250 sentences. We report Character Error Rate (CER), Word Error Rate (WER), Vowel Error Rate (VER), and Stress Error Rate (SER). Results

are detailed in Table III.

**Test** **Set** **CER**

**WER** **VER** **SER**

ILSpeech (150 seq.) 0.0240 0.1120 0.0224 0.9240

Michel (250 seq.) 0.0478 0.2216 0.0321 0.1767

Table III: **ASR** **IPA** **evaluation** **results** on the in-domain

ILSpeech and out-of-domain synthetic Michel datasets.

[Max: is 350 sentences enough for showing the results?] [Max: is there a way to explain that michel is a legit dataset?] **Stage** **3:** **Training** **of** **Renikud**For our primary large-scale

dataset, we utilized Knesset Vox [10], specifically drawing

upon approximately 1.7k hours of parliamentary recordings from its training set. Knesset Vox has ready to use transcripts by using ASR and forced alignment between the already made scripts from the knesset parliament transcripts. Because the Whisper ASR model experiences performance degradation on longer audio inputs (exceeding 25 seconds), we bypassed the original Knesset Vox sentence annotations and re-segmented the raw audio into optimized 5–15-second clips to ensure

correct results of phonetic transcriptions with the ASR. We then processed these shorter segments using both a standard Hebrew Whisper model and our custom IPA-tuned Whisper model to extract parallel Hebrew text and IPA transcriptions. After extracting the pseudo-labels and applying the FST align- ment process described in Section II-A,To ensure memory

stability and prevent out-of-memory (OOM) errors during

training, we filtered out sentence-length outliers using the stan- dard 1 5 IQR rule. Specifically, we discarded sequences with

lengths falling outside the bounds ofQ 1 5 IQR, Q 1

3

1 5 IQR . Ultimately, this weak supervision pipeline yielded

a dataset of approximately 1.52 million aligned Hebrew-to-IPA sentences. aligned Hebrew-to-IPA sentences. [Morris: does

Knesset Vox have gold transcripts? do we ignore them?][Max:

Yes, but we create shorter clips of 5-15 and it will be a

headache to use the gold labels also probably were made with whisper] [Morris: should be explained concisely][Max: added

some explanation about the transcriptions] **Stage** **4:** **Evaluation** **of** **Renikud**To benchmark our pro-

of posed ReNikud architecture, we evaluated its grapheme-to-

phoneme mapping capabilities against the standard Phonikud baseline.

*B. MILIM Testset* 3

MILIM testset consists of a targeted evaluation corpus de-

SASpeech [9] ILSpeech [3]3Benchmark for Individual-word Testing of Underspecified IPA


---

**Cat.** **Input**

Gender Acronyms

**Target**

ךתיארדסבלכה

ן״מאב

**IPA** **Cat.** **Input**

ידיגת ךתיא⁦ʔitˈaχ/ Names⁩

ן״מאבתרישאוה⁦beʔamˈan/ Homogr.⁩

**Target**

**IPA**

ילשהלוחכההצלוחההפיאיהיליהיל⁦lˈihi⁩

בשיאוהשןמזבןיינעמרפסארקאוהרפס⁦sˈefeʁ/~/sapˈaʁ⁩

םישנרפסלצא

Penult.

םחל ירטםחליתינק⁦lˈeχem/ Min. Str.⁩

וידלילשםיגשיההמחורתחנולהיהתחנ⁦nˈaχat/~/naχˈat⁩

לולסמהלעםולשבתחנסוטמה

Rare Ph.

רהמלכאת

ךליבשבספי׳ציתאבהספי׳צ⁦tʃˈips/ Slang⁩

ירמגלבונגםדאןבאוהבונג⁦ɡanˈuv⁩

Foreign

ביוו

הפשיבוטביווהזיא⁦vˈajb⁩

Table IV: Selected examples from MILIM, split by category (Cat.). Abbreviated category names are penultimate stress (Penult.),

rare phonemes (Rare Ph.), homographs (Homogr.), and minimal stress pairs (Min. Str.).

signed to systematically assess a model’s capacity for complex linguistic disambiguation in context-dependent orthographies. The testset has 1,653 sentences about 150 for each cate-

gory some categories like ilspeech and homographs contain multiple words so the testset is on 3,110 changing words.

MILIM testset except of the ilspeech, the generation of the sentences was created using Gemini-3.1-pro and then we fixed it manually. the high result of the gemini in the graphs might be the results of bias towards his own sentences. ILspeech wasFigure 2: Word accuracy rate (left) and character accuracy rate

updated to version 2 to fix mistakes like e.g. ⁧ןכותו םירטאווא(⁩right). [Max: should i add the name Gemini-3.1-pro? in the

it was ⁧םירטבאןכתו⁩

graph or in caption?][Morris: in caption or paper text is fine.

**Targeted** **Evaluation** **Methodology:**

It should be a gray dotted line, not solid black, and in caption

The dataset is categorized into distinct linguistic challenges:we should say that it provides an upper bound]

- **Morphological** **and** **Syntactic** **Ambiguity** **gender**

Hebrew pronouns, verbs, and adjectives frequently share identical orthography but shift in pronunciation based on

*Example:*

ספי’צ

ורגרובמהיתנמזה

the gender of the subject or object.

*Targeted Label:* ⁧ספיצ ⁩tʃˈips

- **Baseline** **Control** **ilspeech-v2-test** Main testset of

*Example:* ⁧ותוא ארקת ,רפסהתאךל ןתונינא⁩

phonikud and also to test general speech classification

*Targeted Label:* Index 2 ( ⁧ךל ⁩leχˈa/ (Resolved via correction.

the masculine future verb ⁧ארקת⁩

*Example:*

םיטקיורפרופסניאבאליממתברועמהתייה

- **Semantic** **Ambiguity** **homographs** This category

םימדקתמםייאבצ[⁦Max: i will add here the ipa but⁩

tests identically spelled words with completely divergent

i dont think we need ithajtˈa meʔoʁˈevet mimˈele

meanings and phonetic structures.

beʔejnsfˈoʁ pʁojˈektim tsvaʔijˈim mitkadmˈim

*Example 1:* ⁧קרמללצב יתכתח(⁩I cut an **onion** for **Evaluation** **Methodology:** Predictions were compared

the soup) batsˈal

against human-annotated gold-standard IPA transcriptions.

*Example 2:* ⁧ץעה לצב ונבשי(⁩We sat **in** **the** **shade** Performance is reported via Word Error Rate (WER) and

of the tree) betsˈel

Character Error Rate (CER). The overall model performance

- **Lexical** **Slang** **slang** Modern spoken Hebrew fre- (reported as OVERALL) is calculated as a micro-average

quently diverges from standard dictionary vocabulary, of the error rates across all distinct evaluation categories,

adopting informal, non-standard words.

encompassing both the challenge suite and the generalized test

*Example:*

לומתאהתייההחידאפוזיא

set in [3] as seen in

*Targeted Label:*

החידאפ⁦fadˈiχa⁩

**Results** **and** **Analysis:** The comparative results are detailed

- **Colloquial** **Phonology** **colloquial** Everyday spoken in Table VII. For example, ReNikud accurately predicts the

Hebrew often alters normative vowel patterns or conso-colloquial slang

החידאפ⁦as / fadˈiχa/, whereas the Phonikud⁩

nant articulation, reflecting register-specific shifts rather incorrectly outputs the padiχˈa/. Furthermore, ReNikud suc-

than lexical slang.

cessfully maps non-native phonemes in foreign loanwords,

*Example:*

הדובעלותיאעסונושדחעונפואהנקאוה⁦correctly resolving the English ’w’ in ⁩רניוו⁦wˈineʁ/) and the⁩

*Targeted Label:* Index 3 ( ⁧עונפוא⁩ʔofanˈoa/ (Pre- ’j’[Max: literally the j not yod]sound in ⁧בוג ⁩hadʒˈob/),

scriptive Formal: /ʔofnˈoa/).

which the Phonikud misclassifies as vinˈeʁ/ and /hadʒˈov/).

- **Foreign** **Loanwords** **and** **Rare** **Phonemesloanwords**

Gemini-3.1-pro results used as an upper bound for the possible

Hebrew orthography adapts to non-native phonemes (e.g.,results. In thecolloquial category, Gemini significantly un-

/w/, /d/, /t/) using modifying characters (geresh) orderperformed compared to ReNikud. This discrepancy arises

unusual letter combinations.

because Gemini’s phonetic knowledge is largely derived from


---

prescriptive, text-based dictionaries and formal grammatical rules, whereas ReNikudlearns directly from the acoustic distri- butions of authentic spoken Hebrew. A prominent illustration of this is the handling of the Hebrew conjunction⁧ו (“⁩and”).

According to strict normative grammar, the conjunction shifts to the /u/ phoneme. However, modern spoken Hebrew routinely

ignores this rule, favoring the default ve // pronunciation.

For example, given the sentence

החפשמו

םירבחביולתלכה

תכמות(⁦Index 3:⁩

החפשמו), ⁦Gemini erroneously outputs⁩

the prescriptive umiʃpaxˈa/. In contrast, ReNikudcorrectly

predicts the targeted colloquial pronunciation vemiʃpaχˈa

demonstrating its superior alignment with real-world native

speech patterns.

*C. Vocalization (Nikud Prediction)*

Figure 3: Diacritization performance on test set over the

G2P is similar to diacritization which is an important task,different number of sentences in the training

but nikud data is not scalable unlike audio. We want to

demonstrate with our per-character architecture finetuning on nikud is not only possible its also better than using our method WER scores were nearly identical (11.5% vs. 11.6%,

as shown in 3. We evaluated its capacity to perform standard p = 0 844), confirming the models were converging.

Hebrew text diacritization (*nikud*). While our primary G2P - **100k** **Steps** **(Statistical** **Parity):** At the final 100,000-

pipeline scales by leveraging audio supervision, diacritiza- step mark, both models reached a complete statistical tie

tion remains a foundational task in Hebrew natural language (WER of 10.7% vs. 10.9%). More importantly, the Boot-

processing (NLP) that shares the exact same core structural strap Confidence Interval narrowed to 0 013 0 011]

challenge: resolving highly localized, context-dependent am- This tightly bound interval means we are 95% sure that

biguities at the grapheme level. Following the per-character the maximum possible difference between the two models

classification methodology established by DictaBERT [7], is around 1 3

[Morris: need better explanation][Max: is this good enough?] [Max: how do we want to show the qualitative results? the

we retained our pre-trained ReNikud encoder but replaced the models results are almost 1 to 1.]

phonetic classification heads with a head tailored to directly We trained the subsets on ReNikudcheckpoint and on

predict the correct *nikud* class.

dicta-il/dictabert-large-char checkpoint the training

This adapted model was fine-tuned on a dataset of 5 million params as follows: same hyperparams with 5 early-stopping

unvocalized sentences taken from the Knesset corpus that every epoch untill converges. and compared the results of the

was used in Phonikud training data (Phonikud’s data was test as seen in

generated from Dicta Nakdan API) but without the stress,

4

The comparative results against the DictaBERT-Menaked

shva and the prefix tags. From the 5m sentences we sampled , Dicta’s best model for nikud show that using ReNikuda bit

10k, 25k, 50k and 100k sentences and other 10k sentence better convergence with small amount of data and the final

for validation. For evaluation we took 100 sentences from result are close to dicta’s best public model as shown in VI.

nakdimon test and manually fixed the 100 sentences. **Test** **Set** [Max: do we even want to compare it to DictaBERT-

**Size** **and** **Model** **Convergence:** To verify that 100 sentences Menaked?]

provide enough data to accurately evaluate the models, we used paired Wilcoxon tests and Bootstrap resampling to measure the*D. Ablation and Architectural Comparison*

statistical differences at each stage.

To isolate the contributions of our core design choices and

**Test** **Set** **Size** **and** **Model** **Convergence:** To verify that validate the efficacy of our approach, we designed evaluations

100 sentences provide enough data to accurately evaluate to justify two key components: our novel classification archi-

the models, we used paired Wilcoxon tests and Bootstrap tecture and the necessity of audio-derived weak supervision.

resampling to measure the statistical differences at each stage. The comparative results of these evaluations are detailed in

- **10k** **Steps** **(Detecting** **Differences):** Early in training, the Table VIII.

test set easily detected a clear performance gap. ReNikud **Architectural** **Ablation:** To demonstrate that our inde-

outperformed Dicta with a Word Error Rate (WER) ofpendent classification head is superior for Hebrew G2P, we

13.4% compared to 15.7%. The statistical test confirmedcompared it against two standard architectures trained on

this was a real differencep  0 001

the identical weakly-supervised Knesset Vox dataset. The

- **25k** **and** **50k** **Steps** **(Convergence):** As the models baselines included a sequence-to-sequence approach ByT5-

trained on more data, their performance leveled out. AsSmall) and a Connectionist Temporal Classification (CTC)

early as 25k steps, the statistical difference between the 4

models was eliminated p = 0 669). By 50k steps, their dicta-il/dictabert-large-char-menaked


---

Stress

Homog.

Phonemes

Gender Acronyms Penult. Rare

Foreign Names Stress

Slang Colloquial

| ReNikud | (Ours) | 47.4 | **14.3/ 34.2** | / 8.9 | **19.9** / **3.6** | **58.3** / | **17.0** 46.5 / 11.1 | **29.3** / **9.5** | **18.2** / **9.8 37.8** | / **11.2 53.6** | / **9.3 27.3** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CTC | Loss | Network 62.5 | / 20.7 | 34.9 **8.7/** | 21.2 / | 3.8 63.6 | / 17.2 **44.5** / **10.6** | 31.3 / 10.4 | 22.7 / 10.8 | 38.5 / 11.6 | 57.6 / 10.1 30.0 |
| ReNikud |  | (Phonikud Data) | **45.4** / 15.0 76.3 | / 25.9 | 29.8 | / 6.3 82.1 | / 29.1 47.1 | / 12.6 32.7 | / 11.0 21.2 | / 10.5 43.6 | / 15.1 90.1 |
| Renikud | w/Vox | labeled with Phonikud | 64.5 / 20.7 | 80.3 / | 26.3 33.1 | / 7.0 84.1 | / 27.0 57.4 | / 15.9 34.0 | / 11.1 23.7 | / 10.9 55.1 | / 19.7 92.1 |
| Seq2Seq | (ByT5) | 61.2 | / 24.0 43.4 | / 10.9 | 27.8 | / 6.7 69.5 | / 20.1 55.5 | / 15.8 36.7 | / 13.4 29.1 | / 15.7 51.9 | / 20.3 55.6 |
| Phonikud |  | (Baseline) 61.2 | / 20.0 64.5 | / 23.6 | 42.4 | / 9.1 82.8 | / 27.9 65.8 | / 18.2 34.7 | / 11.1 23.2 | / 10.0 59.0 | / 20.6 91.4 |

/ 17.2

/ 6.3 82.1 / 29.1 47.1 / 12.6 32.7

/ 10.5 43.6 / 15.1 90.1

/ 24.0 43.4 / 10.9 27.8 / 6.7 69.5 / 20.1 55.5 / 15.8 36.7 / 13.4 29.1 / 15.7 51.9 / 20.3 55.6

/ 20.0 64.5 / 23.6 42.4 / 9.1 82.8 / 27.9 65.8 / 18.2 34.7 / 11.1 23.2 / 10.0 59.0 / 20.6 91.4

Table V: Detailed evaluation on the Hebrew G2P challenge suite (WER / CER, in %). Our proposed ReNikud model trained

on the Knesset Vox corpus achieves the best overall performance among dedicated G2P models, significantly reducing errors in complex domains such as Slang and Rare Phonemes compared to both the Phonikud baseline and a variant of ReNikud restricted to the same legacy training data as Phonikud. Best results per column are highlighted in bold.

**Model** **Train**

**Size** **WER**

**(Corpus)** **CER** **(Corpus)** **EM**

blˈaɡan/. For ⁧ןלטס⁩satlˈan/), it skips the vocalization entirely,

DictaBERT-Menaked (pretrained [Max: i dont think the training info is public]) 10.21% 1.68%

29%

outputting stlˈan

**V**

**ReNikud (Ours)** 100k 10.74%

1.83%

29%

Finally, the autoregressive decoding mechanism repeatedly

Dicta 100k 10.86%

1.84%

31%

loses track of the word’s prosodic structure,**misplacing** **the**

**primary** **stress** **marker** (the / ˈ/ symbol) onto the wrong

Table VI: Diacritization performance on the test set syllable. This is particularly prevalent in penultimate-stressed slang, where ByT5 defaults to ultimate stress—predicting

liɡˈa/ instead of lˈiɡa/ ( ⁧הגיל) ⁩and /tembˈel/ instead of tˈembel

network built on the samedicta-il/dictabert-large-

לבמט

char base encoder used in our method.

Our ReNikud architecture structurally prevents these fail-

**Qualitative** **Analysis** **of** **Autoregressive** **Hallucinations:** ures. By enforcing a constrained, 1-to-1 per-character mapping,

Qualitative analysis of the predictions highlights a critical the classifier guarantees strict structural alignment. This en-

flaw in the Seq2Seq baseline: autoregressive hallucination. sures that every orthographic character is explicitly accounted

Unlike classification-based models that map predictions strictly for with a discrete phonetic label, inherently preventing the

to the input characters, Seq2Seq models frequently generate runaway generation of extra vowels, the dropping of required

phonetic sequences that completely mismatch the provided phonetic slots, and anchoring the stress marker directly to the

Hebrew orthography. Our constrained, 1-to-1 per-character source text. **Qualitative** **Analysis** **of** **Model** **Predictions:**

mapping architecture structurally prevents these failures by Qualitative analysis of the test suite demonstrates ReNikud’s

forcing the sequence length and alignment to match the source ability to successfully resolve complex linguistic challenges

text.

where both alignment-free architectures (ReNikud-CTC) and

**Qualitative** **Analysis** **of** **Phonetic** **Misalignment:**

legacy classification baselines (Phonikud) fail:

Qualitative analysis reveals a critical limitation in the

- **Morphological** **and** **Syntactic** **Ambiguity** **gender**

Seq2Seq baseline: phonetic and prosodic misalignment. Unlike The baseline models fail to use the context of the feminine

classification-based models that strictly map predictions to verbs and pronouns in the sentence to correctly predict

input characters, unconstrained Seq2Seq generation frequently the feminine suffix eχ

breaks the structural boundaries of the target words. Rather

*Example:*

החוטבתא,ךלצא

ראשנחתפמה(⁦The key⁩

than producing full lexical hallucinations, the model suffers

stayed with you [f], are you [f] sure?)

from severe localized distortions—specifically, inserting ex-

*Targeted Label:* ⁧ךלצא ⁩ʔetslˈeχ

traneous vowels, omitting required vowels, and incorrectly

*ReNikud (Ours):* ʔetslˈeχ (Correctly resolves femi-

placing lexical stress.

nine context)

An analysis of theslang and colloquial subsets exposes

*Baseline Failures:* ReNikud-CTC predicts / ʔetslχa

the severity of these generative errors. For instance, ByT5

(mispredicts the masculine suffix and entirely drops

frequently **inserts** **extraneous** **phonemes** to force unfamiliar

the stress marker); Phonikud predicts / ʔˈetslχ/ (in-

words into normative grammatical templates. When predicting

valid phonetics).

the slang term ⁧הפאל⁩lˈafa/), the model hallucinates[Max:

- **Semantic** **Ambiguity** **homographs** The baselines fre-

how would you call it?]a complex glottal structure, outputting quently fail to resolve identically spelled words based

leʔapˈa/. Similarly, for the word ⁧ימאמ⁩mˈami/), it erroneously on sentence-level context, often defaulting to the most

generates /maʔamˈi

common statistical pronunciation.

Conversely, the model frequently**omits** **required** **vowels**

artificially compressing words. For the word ⁧ןגאלב⁩balaɡˈan/),

*Example:*

םחללכאולודגהץעהלצב

טעמחונלבשיאוה

the model completely drops the initial vowel, generating

ReNikud (Ours) 47.4 CTC Loss Network 62.5  / 20.7 34.9 21.2 / 3.8 63.6 31.3 / 10.4 22.7  / 10.8 38.5  / 11.6 57.6 ReNikud (Phonikud Data)  / 25.9 29.8 Renikud w/Vox labeled with Phonikud 64.5  / 20.7 80.3  / 26.3 33.1 Seq2Seq (ByT5) 61.2 Phonikud (Baseline) 61.2⁧לצבםע(⁩He sat to rest a bit in the**shade** of the


---

large tree and ate bread with**onion**

*Targeted Labels:* ⁧לצב ⁩betsˈel/ (shade); ⁧לצב⁩

batsˈal/ (onion).

*ReNikud (Ours):* betsˈel batsˈal (Perfectly distin-

guishes both contexts). *Baseline Failures:* ReNikud-CTC incorrectly predicts

betsˈel/ for both words, missing the contextual shift.

Phonikud suffers from vowel reduction and mis-

places the stress on the second wordbtsˈel bˈatsal/).

- **Colloquial** **Phonology** **colloquial** Legacy models

heavily bias toward prescriptive grammar rules, failing

to capture how native speakers actually pronounce con- junctions and prepositions.

*Example:*

הלילבםיקזחםיקרבו םימערויה(⁦There⁩

were strong thunders and**lightnings** at night.)

*Targeted Label:*

םיקרבו⁦vebʁakˈim/ (Colloquial⁩

pronunciation). *ReNikud (Ours):* vebʁakˈim

*Baseline Failures:* Both ReNikud-CTC and

Phonikud erroneously apply the formal ”bumaf”

rule, shifting the conjunction to the normative

u/ (/ ubʁakˈim/ and uvʁakˈim/), which is highly

unnatural in spoken modern Hebrew.

- **Lexical** **Slang** **slang** Baselines struggle to assign

correct vowel templates to non-standard vocabulary, fre- quently mispredicting the vowels.

*Example:* ⁧ךילע הרפכ הרוקהמ(⁩What’s happening,

**darling** [slang].)

*Targeted Label:* ⁧הרפכ ⁩kapˈaʁa

*ReNikud (Ours):* kapˈaʁa

*Baseline Failures:* ReNikud-CTC predicts / kapeʁˈa

(hallucinating an ’e’ vowel and shifting stress);

Phonikud predicts / kapaʁˈa/ (shifting stress to the

final syllable).

- **Acronyms** **acronyms** The baseline models struggle

with correct stress placement and vowel resolution for

military or medical acronyms.

*Example:* ⁧א״דמ בר״עמאוה(⁩He is a medic in MADA)

*Targeted Label:* ⁧א״דמב⁩bemˈada

*ReNikud (Ours):* bemˈada

*Baseline Failures:* ReNikud-CTC suffers from

prosodic duplication, predicting bemˈadˈa/ with two

conflicting stress markers; Phonikud predicts / be-

madˈa/, defaulting to standard ultimate stress.

- **Penultimate** **Stress** **loanwords** Legacy baselines

heavily bias towards final ultimate stress (Mil’ra), fre-

quently failing on modern loanwords that require penul- timate stress (Mil’el).

*Example:* ⁧הנוש טפסנוק⁩

לעססובמןויערה(⁦The idea⁩

is based on a different**concept**

*Targeted Label:* ⁧טפסנוק⁩kˈonsept

*ReNikud (Ours):* kˈonsept

*Baseline Failures:* Both ReNikud-CTC and

Phonikud predict / konsˈept/, incorrectly forcing

the foreign loanword into a native ultimate-stress

pattern.

- **Rare** **Phonemes** **rare** **phonemes** Baseline models

struggle to map orthographically modified characters (like the Geresh) to their correct phonetic outputs. *Example:*

בהאתאלהתא,ךלשרנא’ז האלהז(⁦It’s⁩

not your **genre**, you won’t like it.)

*Targeted Label:* ⁧רנאזה ⁩haʒˈaneʁ

*ReNikud (Ours):* haʒˈaneʁ

*Baseline Failures:* ReNikud-CTC mispredicts the in-

ternal vowel cluster, outputtinghaʒˈeneʁ Phonikud

misplaces the prosodic stress, predictinghaʒanˈeʁ

- **Phonetic** **Insertion** **and** **Misalignment foreign**

Be-

cause the CTC baseline must dynamically manage blank tokens to achieve sequence alignment, it frequently suffers from phonetic distortion, inserting nonexistent syllables. *Example:*

רתאלץרפרקאההזיא(⁦Some **hacker**⁩

broke into the site.) *Targeted Label:* ⁧רקאה ⁩hˈakeʁ

*ReNikud (Ours):* hˈakeʁ

*Baseline Failures:* ReNikud-CTC predicts /haʔakˈeʁ

hallucinating an inserted glottal stop ʔ/), adding

an extra syllable, and shifting the stress. Phonikud

predicts /hakˈeʁ/ (incorrect ultimate stress).

**Audio** **Supervision** **vs.** **Text** **Data:** To justify our weak

supervision pipeline, we compared the ReNikud architecture trained on Knesset Vox that the ipas were created by phonikud (Renikud w/Vox labeled with Phonikud) and text-derived

Phonikud dataset (ReNikud (Phonikud Data)) as shown in

Table VII and the results are worst in any category then

using Knesset Vox with audio labels. **Training** **Details:** All models were continuously evaluated

using a validation set of 250 gold sentences.[Max: what is

expected from this part?] **Ablation** **Results:** The results in Table VIII confirm the

independent contributions of both our direct phonetic clas-

sification architecture and our weak-supervision data pipeline. Structurally, when compering different data on the same model

we can see that using Phonikud’s data or using the same

knesset vox data but not using ASR-IPA for IPA labels but using phonikud for labeling resulting with worst WER and CER overall results and across all the categories in MILIM as shown in Table VII by taking seq2seq and a network with ctc loss the results are the same except of 2 categories that the ctc loss is slightly better but when overall results are taken to account ReNikudis better.

IV. Related Work

Explicit G2P conversion for Hebrew was recently introduced by Kolani et al. [3], following prior works on Hebrew dia- critization [6], [7]. These approaches are bottlenecked by the availability of annotated textual data, while we use audio as a

scalable source of pronunciation information.


---

| ReNikud | (Ours) | 47.4 | **14.3/ 34.2** | / 8.9 | **19.9** / **3.6** | **58.3** / | **17.0** 46.5 / 11.1 | **29.3** / **9.5** | **18.2** / **9.8 37.8** | / **11.2 53.6** | / **9.3 27.3** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CTC | Loss | Network 62.5 | / 20.7 | 34.9 **8.7/** | 21.2 / | 3.8 63.6 | / 17.2 **44.5** / **10.6** | 31.3 / 10.4 | 22.7 / 10.8 | 38.5 / 11.6 | 57.6 / 10.1 30.0 |
| ReNikud |  | (Phonikud Data) | **45.4** / 15.0 76.3 | / 25.9 | 29.8 | / 6.3 82.1 | / 29.1 47.1 | / 12.6 32.7 | / 11.0 21.2 | / 10.5 43.6 | / 15.1 90.1 |
| Renikud | w/Vox | labeled with Phonikud | 64.5 / 20.7 | 80.3 / | 26.3 33.1 | / 7.0 84.1 | / 27.0 57.4 | / 15.9 34.0 | / 11.1 23.7 | / 10.9 55.1 | / 19.7 92.1 |
| Seq2Seq | (ByT5) | 61.2 | / 24.0 43.4 | / 10.9 | 27.8 | / 6.7 69.5 | / 20.1 55.5 | / 15.8 36.7 | / 13.4 29.1 | / 15.7 51.9 | / 20.3 55.6 |
| Phonikud |  | (Baseline) 61.2 | / 20.0 64.5 | / 23.6 | 42.4 | / 9.1 82.8 | / 27.9 65.8 | / 18.2 34.7 | / 11.1 23.2 | / 10.0 59.0 | / 20.6 91.4 |

Table VII: Detailed evaluation on the Hebrew G2P challenge suite (WER / CER, in %). Our proposed ReNikud model trained

on the Knesset Vox corpus achieves the best overall performance among dedicated G2P models, significantly reducing errors in complex domains such as Slang and Rare Phonemes compared to both the Phonikud baseline and a variant of ReNikud restricted to the same legacy training data as Phonikud. Best results per column are highlighted in bold.

| **Validation** | **Set (250)** | **Test Set (1,500)should** |
|---|---|---|
| **Method** |  |  |
| **WER CER** | **WER** | **CER**not |

Gender Acronyms Penult.

/ 24.0 43.4 / 20.0 64.5

/ 10.9 27.8 / 23.6 42.4

Seq2Seq 24.1 4.9 32.1 11.0

ReNikud (Phonikud Data) 23.4 6.8 32.6 11.0

ReNikud (w/Vox labeled with Phonikud) 20.7 4.5 33.0 9.9

CTC Loss Network 21.2 3.8 27.9 8.9

**New** **Classifier** **Head** **(Ours)** **13.7**

**2.7** **26.7** **8.5**

Table VIII: Performance comparison of generation methods.

Error rates are reported as percentages for Word Error Rate (WER) and Character Error Rate (CER), evaluated on both a curated validation set of 250 sentences and the full held-out test set of 1,500 sentences.

Among prior works learning pronunciation from audio

in other language settings, we distinguish between two ap- proaches: (1) **Audio-supervised** methods such as ours use audio during

training to improve pronunciation knowledge. Most similar

to our work, a few studies use audio to improve G2P

English [11], [12] or in multilingual settings [13]. However, these works train on labeled audio as a supplementary signal to labelled text, while we use large-scale unlabeled audio as our primary training signal. Additionally, we operate on the Hebrew language which has a high degree of orthographic am- biguity and phonetic features unspecified in text (stress, spoken norms, etc.), and our pseudo-vocalization architecture avoids seq2seq hallucinations by enforcing abjad-style alignment. (2) **Audio-guided** methods also take audio along with text at

inference time for G2P [14]–[16] or abjad diacritization [17], [18]. While adding audio as an additional input can provide a richer signal, we focus on the case where only text is available at inference time.

V. Conclusion

We introduced ReNikud, a*Pseudo-Vocalization* architecture

for Hebrew G2P conversion. By reframing the generative

sequence-to-sequence problem into a per-character phonetic triplet classification task (Consonant, Vowel, Stress), our

method structurally mitigates the generative hallucinations

observed in standard Seq2Seq models.[Morris: this paragraph

Stress

Homog.

Phonemes  Rare

Foreign Names Stress

Slang Colloquial

/ 17.2

/ 6.3 82.1 / 29.1 47.1 / 12.6 32.7

/ 10.5 43.6 / 15.1

/ 6.7 69.5 / 20.1 55.5 / 15.8 36.7 / 13.4 29.1 / 15.7 51.9 / 20.3

/ 9.1 82.8 / 27.9 65.8 / 18.2 34.7 / 11.1 23.2 / 10.0 59.0 / 20.6

reducing degrees of freedom] [Yakov: Add a mention about the limitation where, due to

our strict alignment, the aligner might drop some informal variants such as , which might be pronounced as jixtov.] To train this architecture, we developed a weak-supervision

pipeline utilizing a monotonic FST to align continuous IPA transcriptions from an adapted Whisper ASR model with

unvocalized Hebrew graphemes. Our evaluations demonstrate

that ReNikud lowers Word Error Rates compared to the legacy Phonikud baseline and the evaluated Seq2Seq and CTC archi- tectures [Morris: phrase that part better], particularly on com-

plex edge-cases such as colloquial slang, rare phonemes, and penultimate stress. Furthermore, we validated the extensibility of our core character-level encoder by successfully adapting it for Hebrew text diacritization via knowledge distillation, using only a fraction of standard training data volumes.[Morris: llm

speak] for **Limitations** **and** **Future** **Work:** A primary limitation of our

methodology is its reliance on ASR-generated pseudo-labels, as inherent transcription errors from the ASR model naturally propagate into the G2P training data. Additionally, because the Knesset Vox dataset consists exclusively of parliamentary speeches, the training corpus carries a distinct formal and

demographic bias. [Morris: LLM speak] This restricts the

model’s exposure to diverse, casual, and second-person con- versational phonology—a domain shift that accounts for the observed performance gap in resolving gendered morphology compared to legacy models trained on broader literary text. [Morris: are you sure that’s true?]Future work will focus

on expanding our weak-supervision pipeline to incorporate

more diverse, unstructured conversational audio corpora to

address these domain-specific biases. Furthermore, because

the core challenge of unwritten vowels is shared across other abjad writing systems (such as Arabic), we plan to extend the *Pseudo-Vocalization*architecture to these languages to evaluate

ReNikud (Ours) 47.4 CTC Loss Network 62.5 ReNikud (Phonikud Data) Renikud w/Vox labeled with Phonikud 64.5 Seq2Seq (ByT5) 61.2 Phonikud (Baseline) 61.2  / 20.7 34.9 21.2 / 3.8 63.6  / 20.7 80.3  / 25.9 29.8  / 26.3 33.1 31.3 / 10.4 22.7  / 10.8 38.5  / 11.6 57.6 should be changed, renikud is also a method for using audio, not just the architecture] [Morris: change claim to be aboutits cross-lingual generalizability.[Max: something do to with ⁧תובונגע,ח?] [⁩Morris: what do they limit?]


---

References

[1] P. T. Daniels and W. Bright, *The world’s writing systems*. Oxford

University Press, 1996.

[2] V. Pratap, A. Tjandra, B. Shi, P. Tomasello, A. Babu, S. Kundu,

A. Elkahky, Z. Ni, A. Vyas, M. Fazel-Zarandi*et al.* , “Scaling speech

technology to 1,000+ languages,” *Journal of Machine Learning Re-*

*search*, vol. 25, no. 97, pp. 1–52, 2024.

[3] Y. Kolani, M. Melichov, C. Calev, and M. Alper, “Phonikud: Hebrew grapheme-to-phoneme conversion for real-time text-to-speech,”*arXiv*

*preprint arXiv:2506.12311*, 2025.

[4] A. Aharoni, “Vocalization of modern hebrew,” in*Encyclopedia of*

*Hebrew Language and Linguistics*, G. Khan, S. Bolozky, S. E. Fassberg,

G. A. Rendsburg, A. D. Rubin, O. Schwarzwald, and T. Zewi, Eds. Leiden: Brill, 2013, vol. 3, pp. 944–951. [5] H. Neudecker, “Vocalization of modern hebrew and colloquial pro- nunciation,” in *Encyclopedia of Hebrew Language and Linguistics*

G. Khan, S. Bolozky, S. E. Fassberg, G. A. Rendsburg, A. D. Rubin,
O. Schwarzwald, and T. Zewi, Eds. Leiden: Brill, 2013, vol. 3, pp.

951–953. [6] E. Gershuni and Y. Pinter, “Restoring hebrew diacritics without a dic- tionary,” in *Findings of the Association for Computational Linguistics:*

*NAACL 2022*, 2022, pp. 1010–1018.

[7] S. Shmidman, A. Shmidman, and M. Koppel, “Dictabert: A state-of- the-art bert suite for modern hebrew,” 2023. [8] J. Zhu, C. Zhang, and D. Jurgens, “Byt5 model for massively multi- lingual grapheme-to-phoneme conversion,” in*Proc. Interspeech 2022*

2022, pp. 446–450. [9] O. Sharoni, R. Shenberg, and E. Cooper, “Saspeech: A hebrew single speaker dataset for text to speech and voice conversion,” *Proc.* in

*Interspeech*, 2023.

[10] Y. Marmor, A. Zulti, D. Krongauz, A. Gabet, Y. Snapir, Y. Lifshitz, and E. Segal, “Voxknesset: A large-scale longitudinal hebrew speech dataset for aging speaker modeling,” 2026. [Online]. Available:

[https://arxiv.org/abs/2603.01270](https://arxiv.org/abs/2603.01270)

[11] S. Sun, K. Richmond, and H. Tang, “Improving seq2seq tts frontends with transcribed speech audio,” *IEEE/ACM Transactions on Audio,*

*Speech, and Language Processing*, vol. 31, pp. 1940–1952, 2023.

[12] S. Sun and K. Richmond, “Acquiring pronunciation knowledge from transcribed speech audio via multi-task learning,” 2024. [Online].

Available: [https://arxiv.org/abs/2409.09891](https://arxiv.org/abs/2409.09891)

[13] M. S. Ribeiro, G. Comini, and J. Lorenzo-Trueba, “Improving grapheme- to-phoneme conversion by learning pronunciations from speech record- ings,” *arXiv preprint arXiv:2307.16643*, 2023.

[14] J. Route, S. Hillis, I. C. Etinger, H. Zhang, and A. W. Black, “Multi- modal, multilingual grapheme-to-phoneme conversion for low-resource languages,” in *Proceedings of the 2nd Workshop on Deep Learning*

*Approaches for Low-Resource NLP (DeepLo 2019)*, 2019, pp. 192–201.

[15] H. Gao, M. Hasegawa-Johnson, and C. D. Yoo, “G2pu: grapheme-to- phoneme transducer with speech units,” in*ICASSP 2024-2024 IEEE*

*International Conference on Acoustics, Speech and Signal Processing* *(ICASSP)*. IEEE, 2024, pp. 10 061–10 065.

[16] C.-J. Li, K. Chang, S. Bharadwaj, E. Yeo, K. Choi, J. Zhu, D. Mortensen, and S. Watanabe, “Powsm: A phonetic open whisper-style speech

foundation model,” *arXiv preprint arXiv:2510.24992*, 2025.

[17] S. Shatnawi, S. Alqahtani, and H. Aldarmaki, “Automatic restoration of diacritics for speech data sets,” 2024. [Online]. Available:

[https://arxiv.org/abs/2311.10771](https://arxiv.org/abs/2311.10771)

[18] A. Ghannam, N. Alharthi, F. Alasmary, K. Al Tabash, S. Sadah, and

L. Ghouti, “Abjad ai at nadi 2025: Catt-whisper: Multimodal diacritic restoration using text and speech representations,” pp. 757–761, 2025.
